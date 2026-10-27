/**
 * DSH Skill Studio host half.
 *
 * Bridges Codex-style `SKILL.md` folders into `ctx.skills`, owns the
 * user/project skill files shared by Codex and DSH, and serves the small
 * authenticated JSON API used by the Web management page.
 */
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, watch } from 'node:fs';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export const name = 'skill-studio-codex';
export const inject = ['skills'];

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SKILL_BYTES = 512 * 1024;
const MAX_DESCRIPTION = 2048;
const MAX_REQUEST_BYTES = 1024 * 1024;
const SYSTEM_ROOT_ID = 'codex-system';
const TRASH_DIR = '.trash';
const MANAGED_FRONTMATTER_KEYS = new Set([
  'name',
  'description',
  'whenToUse',
  'disable-model-invocation',
  'user-invocable',
]);

class StudioError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'StudioError';
    this.status = status;
  }
}

function asError(value) {
  return value instanceof Error ? value : new Error(String(value));
}

function fail(status, message) {
  throw new StudioError(status, message);
}

function isSkillName(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 64 && SKILL_NAME.test(value);
}

function normalizeText(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n');
}

function isInside(root, child) {
  const rel = relative(resolve(root), resolve(child));
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function homePath(value) {
  try {
    const home = homedir();
    if (isInside(home, value)) {
      const rel = relative(home, value);
      return rel === '' ? '~' : join('~', rel);
    }
  } catch {
    // Fall through to the raw path.
  }
  return value;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (['true', 'yes', 'on', '1'].includes(text)) return true;
  if (['false', 'no', 'off', '0'].includes(text)) return false;
  return fallback;
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'");
  }
  return value;
}

function blockScalar(lines, indicator) {
  const literal = indicator.startsWith('|');
  const strip = indicator.endsWith('-');
  const keep = indicator.endsWith('+');
  let text = lines.join('\n');
  if (!literal) {
    text = lines
      .map((line) => line.trim())
      .join(' ')
      .replace(/\s+/g, ' ');
  }
  if (strip) text = text.replace(/\s+$/u, '');
  else if (!keep) text = text.replace(/\n+$/u, '');
  return text;
}

function splitFrontmatter(text) {
  const normalized = normalizeText(text).replace(/^\uFEFF/u, '');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== '---') {
    return { lines: [], body: normalized };
  }
  let end = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      end = index;
      break;
    }
  }
  if (end < 0) return { lines: [], body: normalized };
  return {
    lines: lines.slice(1, end),
    body: lines.slice(end + 1).join('\n').replace(/^\n+/u, ''),
  };
}

function parseFrontmatter(lines) {
  const data = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = /^([A-Za-z0-9_-]+):(.*)$/u.exec(line);
    if (!match) continue;
    const key = match[1];
    const raw = match[2].trim();
    if (['|', '|-', '|+', '>', '>-', '>+'].includes(raw)) {
      const block = [];
      let cursor = index + 1;
      while (cursor < lines.length && (/^\s+/u.test(lines[cursor]) || lines[cursor] === '')) {
        block.push(lines[cursor].replace(/^\s{1,4}/u, ''));
        cursor += 1;
      }
      data[key] = blockScalar(block, raw);
      index = cursor - 1;
      continue;
    }
    if (key === 'metadata' && raw === '') {
      const metadata = {};
      let cursor = index + 1;
      while (cursor < lines.length && (/^\s+/u.test(lines[cursor]) || lines[cursor] === '')) {
        const nested = /^\s+([A-Za-z0-9_-]+):(.*)$/u.exec(lines[cursor]);
        if (nested) metadata[nested[1]] = parseScalar(nested[2]);
        cursor += 1;
      }
      data.metadata = metadata;
      index = cursor - 1;
      continue;
    }
    data[key] = parseScalar(raw);
  }
  return data;
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function frontmatterFor(fields, originalLines = []) {
  const kept = [];
  for (let index = 0; index < originalLines.length; index += 1) {
    const line = originalLines[index];
    const match = /^([A-Za-z0-9_-]+):/u.exec(line);
    if (match && MANAGED_FRONTMATTER_KEYS.has(match[1])) {
      while (index + 1 < originalLines.length && /^\s+/u.test(originalLines[index + 1])) index += 1;
      continue;
    }
    kept.push(line);
  }
  while (kept.length > 0 && kept[kept.length - 1].trim() === '') kept.pop();

  const output = [
    `name: ${fields.name}`,
    `description: ${yamlString(fields.description)}`,
  ];
  if (fields.whenToUse) output.push(`whenToUse: ${yamlString(fields.whenToUse)}`);
  if (fields.modelInvocable === false) output.push('disable-model-invocation: true');
  if (fields.userInvocable === false) output.push('user-invocable: false');
  if (kept.length > 0) output.push(...kept);
  return output;
}

function renderSkillFile({ fields, body, originalLines = [] }) {
  const frontmatter = frontmatterFor(fields, originalLines);
  const cleanBody = normalizeText(body).replace(/^\n+/u, '').replace(/\s+$/u, '');
  return `---\n${frontmatter.join('\n')}\n---\n\n${cleanBody}${cleanBody ? '\n' : ''}`;
}

function parseTomlInterface(text) {
  const result = {};
  let section = '';
  for (const rawLine of normalizeText(text).split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const sectionMatch = /^\[([^\]]+)\]$/u.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1].trim();
      continue;
    }
    if (section !== 'interface') continue;
    const match = /^([A-Za-z0-9_-]+)\s*=\s*(.*)$/u.exec(line);
    if (!match) continue;
    const value = parseScalar(match[2]);
    if (typeof value === 'string' || typeof value === 'boolean') result[match[1]] = value;
  }
  return result;
}

function safeBrandColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{3,8}$/iu.test(value) ? value : undefined;
}

function parseOpenAiYaml(text) {
  const result = {};
  let section = '';
  for (const rawLine of normalizeText(text).split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const sectionMatch = /^([A-Za-z0-9_-]+):\s*$/u.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    if (section !== 'interface' && section !== 'policy') continue;
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/u.exec(line);
    if (!match) continue;
    const value = parseScalar(match[2]);
    if (typeof value === 'string' || typeof value === 'boolean') result[match[1]] = value;
  }
  return result;
}

function pickInterface(raw) {
  const output = {};
  const displayName = raw.displayName ?? raw.display_name;
  const shortDescription = raw.shortDescription ?? raw.short_description;
  const defaultPrompt = raw.defaultPrompt ?? raw.default_prompt;
  const iconSmall = raw.iconSmall ?? raw.icon_small;
  const iconLarge = raw.iconLarge ?? raw.icon_large;
  const brandColor = raw.brandColor ?? raw.brand_color;
  if (typeof displayName === 'string' && displayName.trim()) output.displayName = displayName.trim();
  if (typeof shortDescription === 'string' && shortDescription.trim()) {
    output.shortDescription = shortDescription.trim();
  }
  if (typeof defaultPrompt === 'string' && defaultPrompt.trim()) output.defaultPrompt = defaultPrompt.trim();
  if (typeof iconSmall === 'string' && iconSmall.trim()) output.iconSmall = iconSmall.trim();
  if (typeof iconLarge === 'string' && iconLarge.trim()) output.iconLarge = iconLarge.trim();
  if (raw.allow_implicit_invocation === false || raw.allowImplicitInvocation === false) {
    output.allowImplicitInvocation = false;
  }
  if (raw.allow_implicit_invocation === true || raw.allowImplicitInvocation === true) {
    output.allowImplicitInvocation = true;
  }
  const color = safeBrandColor(brandColor);
  if (color) output.brandColor = color;
  return output;
}

function skillInterfaceOf(dir) {
  if (!dir) return {};
  let output = {};
  try {
    const openai = join(dir, 'agents', 'openai.yaml');
    if (existsSync(openai)) {
      const text = readFileSync(openai, 'utf8');
      output = pickInterface(parseOpenAiYaml(text.length > 64 * 1024 ? text.slice(0, 64 * 1024) : text));
    }
  } catch {
    // Optional presentation metadata.
  }
  try {
    const file = join(dir, 'config.toml');
    if (!existsSync(file)) return output;
    const text = readFileSync(file, 'utf8');
    return {
      ...pickInterface(parseTomlInterface(text.length > 64 * 1024 ? text.slice(0, 64 * 1024) : text)),
      ...output,
    };
  } catch {
    return output;
  }
}

function sourceForRoot(root) {
  if (root.source === 'builtin') return 'bundled';
  if (root.source === 'codex') return 'custom';
  return 'custom';
}

function skillProviderForRoot(root) {
  return root.source === 'codex' || root.source === 'builtin' ? 'codex' : 'filesystem';
}

function findProjectRoot(start) {
  let cursor = resolve(start || process.cwd());
  while (true) {
    if (existsSync(join(cursor, '.git'))) return cursor;
    const parent = dirname(cursor);
    if (parent === cursor) return resolve(start || process.cwd());
    cursor = parent;
  }
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function readTextLimited(file, maxBytes = MAX_SKILL_BYTES) {
  const info = await stat(file);
  if (info.size > maxBytes) fail(413, `Skill file is larger than ${Math.round(maxBytes / 1024)} KiB`);
  return normalizeText(await readFile(file, 'utf8'));
}

async function atomicWrite(file, text) {
  const dir = dirname(file);
  await mkdir(dir, { recursive: true });
  const temp = join(dir, `.${basename(file)}.${randomUUID()}.tmp`);
  await writeFile(temp, text, 'utf8');
  try {
    await rename(temp, file);
  } catch (error) {
    try {
      await rm(file, { force: true });
      await rename(temp, file);
    } catch {
      await rm(temp, { force: true }).catch(() => {});
      throw error;
    }
  }
}

/**
 * Keep a Codex `agents/openai.yaml` invocation policy aligned when it already
 * exists. We never create the file: absence simply leaves Codex on its default.
 */
async function syncOpenAiPolicy(dir, modelInvocable) {
  const file = join(dir, 'agents', 'openai.yaml');
  if (!existsSync(file)) return;
  try {
    const text = await readFile(file, 'utf8');
    const lines = normalizeText(text).split('\n');
    let sectionStart = -1;
    let sectionEnd = lines.length;
    for (let index = 0; index < lines.length; index += 1) {
      if (/^policy:\s*$/u.test(lines[index])) {
        sectionStart = index;
        break;
      }
    }
    if (sectionStart < 0) {
      const suffix = text.endsWith('\n') ? '' : '\n';
      await atomicWrite(file, `${text}${suffix}policy:\n  allow_implicit_invocation: ${modelInvocable ? 'true' : 'false'}\n`);
      return;
    }
    for (let index = sectionStart + 1; index < lines.length; index += 1) {
      if (!/^\s+/u.test(lines[index]) && lines[index].trim() !== '') {
        sectionEnd = index;
        break;
      }
    }
    let replaced = false;
    for (let index = sectionStart + 1; index < sectionEnd; index += 1) {
      if (/^\s+allow_implicit_invocation\s*:/u.test(lines[index])) {
        lines[index] = `  allow_implicit_invocation: ${modelInvocable ? 'true' : 'false'}`;
        replaced = true;
        break;
      }
    }
    if (!replaced) lines.splice(sectionStart + 1, 0, `  allow_implicit_invocation: ${modelInvocable ? 'true' : 'false'}`);
    await atomicWrite(file, `${lines.join('\n').replace(/\s+$/u, '')}\n`);
  } catch {
    // Codex presentation metadata is optional; never fail a skill edit over it.
  }
}

function skillFromFile(file, root, options = {}) {
  const text = options.text;
  const split = splitFrontmatter(text);
  const data = parseFrontmatter(split.lines);
  const fallbackName = options.fallbackName || basename(dirname(file));
  const skillName = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : fallbackName;
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const whenToUse = typeof data.whenToUse === 'string' ? data.whenToUse.trim() : '';
  const directory = dirname(file);
  const interfaceData = options.interfaceData ?? skillInterfaceOf(directory);
  if (!interfaceData.shortDescription && data.metadata && typeof data.metadata === 'object') {
    const short = data.metadata['short-description'] ?? data.metadata.short_description;
    if (typeof short === 'string' && short.trim()) interfaceData.shortDescription = short.trim();
  }
  const explicitlyDisabled = parseBoolean(data['disable-model-invocation'], false);
  const modelInvocable = !(explicitlyDisabled || interfaceData.allowImplicitInvocation === false);
  const userInvocable = parseBoolean(data['user-invocable'], true);
  const valid = isSkillName(skillName) && description.length > 0;
  return {
    name: skillName,
    displayName: interfaceData.displayName || skillName,
    description,
    whenToUse,
    invocation: { modelInvocable, userInvocable },
    path: file,
    dir: directory,
    relativePath: relative(root.path, file),
    rootId: root.id,
    source: root.source,
    sourceKind: root.id === SYSTEM_ROOT_ID ? 'codex' : root.source,
    scope: root.scope,
    provider: skillProviderForRoot(root),
    rank: root.rank,
    editable: Boolean(root.editable && !options.symlink && root.id !== SYSTEM_ROOT_ID),
    creatable: Boolean(root.creatable),
    runtime: false,
    valid,
    error: valid ? undefined : !isSkillName(skillName) ? 'Invalid skill name' : 'Missing description',
    interface: interfaceData,
    body: split.body,
    frontmatterLines: split.lines,
    text,
  };
}

async function scanRoot(root) {
  const output = [];
  let entries;
  try {
    entries = await readdir(root.path, { withFileTypes: true });
  } catch {
    return output;
  }
  const candidates = root.id === SYSTEM_ROOT_ID
    ? entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    : entries;
  for (const entry of candidates) {
    if (entry.name.startsWith('.') && root.id !== SYSTEM_ROOT_ID) continue;
    const absolute = join(root.path, entry.name);
    let info;
    try {
      info = await lstat(absolute);
    } catch {
      continue;
    }
    if (info.isSymbolicLink()) {
      // A linked skill stays visible but read-only: its bytes live elsewhere.
      try {
        info = await stat(absolute);
      } catch {
        continue;
      }
      if (!info.isDirectory() && !info.isFile()) continue;
      if (info.isDirectory()) {
        const file = join(absolute, 'SKILL.md');
        if (!existsSync(file)) continue;
        try {
          const text = await readTextLimited(file);
          output.push(skillFromFile(file, root, { text, symlink: true }));
        } catch {
          // Unreadable linked skill: leave it out of the model catalog.
        }
        continue;
      }
    }
    if (info.isDirectory()) {
      const file = join(absolute, 'SKILL.md');
      if (!existsSync(file)) continue;
      try {
        const text = await readTextLimited(file);
        output.push(skillFromFile(file, root, { text }));
      } catch {
        // Invalid or unreadable entries stay out of the model catalog.
      }
      continue;
    }
    if (info.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      try {
        const text = await readTextLimited(absolute);
        output.push(skillFromFile(absolute, root, {
          text,
          fallbackName: basename(entry.name, '.md'),
        }));
      } catch {
        // Invalid or unreadable flat skill.
      }
    }
  }
  return output;
}

function renderSkillContent(skill) {
  const escapeAttr = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const escapeText = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const resource = skill.resourceBase;
  let hint;
  if (resource === undefined) {
    hint = [`Resources for this skill are managed by provider "${escapeText(skill.provider)}".`, 'Load referenced resources only as needed.'];
  } else if (resource.kind === 'directory') {
    hint = [`Base directory for this skill: ${escapeText(resource.path)}`, 'Resolve relative paths mentioned by this skill against the base directory before using them. Load referenced resources only as needed.'];
  } else if (resource.kind === 'url') {
    hint = [`Base URL for this skill: ${escapeText(resource.url)}`, 'Resolve relative URLs mentioned by this skill against the base URL before using them. Load referenced resources only as needed.'];
  } else {
    hint = [`Resources for this skill: ${escapeText(resource.description)}`, 'Load referenced resources only as needed.'];
  }
  return [
    `<skill_content name="${escapeAttr(skill.name)}">`,
    '<skill_resources>',
    ...hint,
    '</skill_resources>',
    '',
    '<skill_instructions>',
    skill.content,
    '</skill_instructions>',
    '</skill_content>',
  ].join('\n');
}

function skillMessage(name, text) {
  return {
    id: randomUUID(),
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'skill-invocation', name, form: 'instructions' },
  };
}

const DOLLAR_SKILL = /(^|\s)\$([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/gu;
const SLASH_SKILL = /(^|\s)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/gu;

function messageSkillNames(messages, pattern) {
  const names = [];
  for (const message of messages) {
    if (message?.source?.kind !== 'user') continue;
    for (const block of message.content ?? []) {
      if (block?.type !== 'text' || typeof block.text !== 'string') continue;
      for (const match of block.text.matchAll(pattern)) {
        if (match[2] && !names.includes(match[2])) names.push(match[2]);
      }
    }
  }
  return names;
}

function jsonResponse(status, value) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_REQUEST_BYTES) fail(413, 'Request body is too large');
  if (!text.trim()) return {};
  try {
    const value = JSON.parse(text);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(400, 'Request body must be a JSON object');
    return value;
  } catch (error) {
    if (error instanceof StudioError) throw error;
    fail(400, 'Request body is not valid JSON');
  }
}

export class SkillStudio {
  constructor(ctx) {
    this.ctx = ctx;
    this.home = homedir();
    this.codexHome = resolve(process.env.DSH_CODEX_HOME || process.env.CODEX_HOME || join(this.home, '.codex'));
    this.dshHome = resolve(process.env.DSH_HOME || join(this.home, '.dsh'));
    this.agentsHome = resolve(process.env.DSH_AGENTS_HOME || join(this.home, '.agents'));
    this.defaultCwd = (() => {
      try {
        const wd = this.ctx.get?.('workingDirectory');
        return resolve(wd?.defaultDirectory ?? process.cwd());
      } catch {
        return resolve(process.cwd());
      }
    })();
    this.control = undefined;
    this.watchers = new Map();
    this.watchTimer = undefined;
    this.disposed = false;
  }

  roots(cwd = this.defaultCwd) {
    const project = findProjectRoot(cwd);
    return [
      {
        id: 'codex-project',
        source: 'codex',
        scope: 'project',
        path: join(project, '.codex', 'skills'),
        editable: true,
        creatable: true,
        rank: 50,
        order: 10,
      },
      {
        id: 'dsh-project',
        source: 'dsh',
        scope: 'project',
        path: join(project, '.dsh', 'skills'),
        editable: true,
        creatable: true,
        rank: 100,
        order: 20,
      },
      {
        id: 'agents-project',
        source: 'agents',
        scope: 'project',
        path: join(project, '.agents', 'skills'),
        editable: true,
        creatable: false,
        rank: 200,
        order: 30,
      },
      {
        id: 'codex-user',
        source: 'codex',
        scope: 'user',
        path: join(this.codexHome, 'skills'),
        editable: true,
        creatable: true,
        rank: 350,
        order: 40,
      },
      {
        id: 'dsh-user',
        source: 'dsh',
        scope: 'user',
        path: join(this.dshHome, 'skills'),
        editable: true,
        creatable: true,
        rank: 400,
        order: 50,
      },
      {
        id: 'agents-user',
        source: 'agents',
        scope: 'user',
        path: join(this.agentsHome, 'skills'),
        editable: true,
        creatable: false,
        rank: 500,
        order: 60,
      },
      {
        id: SYSTEM_ROOT_ID,
        source: 'builtin',
        scope: 'builtin',
        path: join(this.codexHome, 'skills', '.system'),
        editable: false,
        creatable: false,
        rank: 700,
        order: 70,
      },
    ];
  }

  rootById(id, cwd = this.defaultCwd) {
    return this.roots(cwd).find((root) => root.id === id);
  }

  rootForPath(file, cwd = this.defaultCwd) {
    const absolute = resolve(file);
    return this.roots(cwd)
      .filter((root) => isInside(root.path, absolute))
      .sort((left, right) => right.path.length - left.path.length)[0];
  }

  rootForTrash(file, cwd = this.defaultCwd) {
    const absolute = resolve(file);
    return this.roots(cwd)
      .filter((root) => isInside(join(root.path, TRASH_DIR), absolute))
      .sort((left, right) => right.path.length - left.path.length)[0];
  }

  start() {
    const disposeProvider = this.ctx.skills.registerProvider((control) => {
      this.control = control;
      this.installWatchers();
      return {
        name: 'codex-studio',
        list: (options) => this.providerList(options),
        get: (candidate, options) => this.providerGet(candidate, options),
      };
    });
    return () => {
      this.disposed = true;
      this.stopWatchers();
      disposeProvider();
    };
  }

  async providerList(options = {}) {
    const cwd = options.cwd ? resolve(options.cwd) : this.defaultCwd;
    const candidates = [];
    for (const root of this.roots(cwd)) {
      if (root.source !== 'codex' && root.source !== 'builtin') continue;
      this.ensureWatched(root.path);
      const skills = await scanRoot(root);
      for (const skill of skills) {
        if (!skill.valid) continue;
        candidates.push({
          name: skill.name,
          description: skill.description,
          whenToUse: skill.whenToUse || undefined,
          invocation: skill.invocation,
          source: sourceForRoot(root),
          provider: 'codex-studio',
          path: skill.path,
          resourceBase: { kind: 'directory', path: skill.dir },
          rank: root.rank,
          locator: { path: skill.path },
          metadata: { rootId: root.id, source: root.source, scope: root.scope },
        });
      }
    }
    return { candidates, complete: true };
  }

  async providerGet(candidate, options = {}) {
    const file = candidate?.locator?.path;
    if (typeof file !== 'string') return undefined;
    const cwd = options.cwd ? resolve(options.cwd) : this.defaultCwd;
    const root = this.rootForPath(file, cwd) ?? this.rootForPath(file, findProjectRoot(dirname(file)));
    if (root === undefined) return undefined;
    try {
      const text = await readTextLimited(file);
      const skill = skillFromFile(file, root, { text });
      if (!skill.valid || skill.name !== candidate.name) return undefined;
      return {
        name: skill.name,
        description: skill.description,
        whenToUse: skill.whenToUse || undefined,
        invocation: skill.invocation,
        source: sourceForRoot(root),
        provider: 'codex-studio',
        path: skill.path,
        resourceBase: { kind: 'directory', path: skill.dir },
        content: skill.body,
        metadata: { rootId: root.id, source: root.source, scope: root.scope },
      };
    } catch {
      return undefined;
    }
  }

  ensureWatched(rootPath) {
    if (this.disposed || this.watchers.has(rootPath)) return;
    let target = rootPath;
    while (!existsSync(target) && dirname(target) !== target) target = dirname(target);
    try {
      const watcher = watch(target, { recursive: true }, () => this.invalidateSoon());
      watcher.on?.('error', () => {});
      this.watchers.set(rootPath, watcher);
    } catch {
      try {
        const watcher = watch(target, () => this.invalidateSoon());
        watcher.on?.('error', () => {});
        this.watchers.set(rootPath, watcher);
      } catch {
        // Watching is best-effort; the model still sees changes on the next open.
      }
    }
  }

  installWatchers() {
    this.ensureWatched(join(this.codexHome, 'skills'));
    for (const root of this.roots()) {
      if (root.source === 'codex') this.ensureWatched(root.path);
    }
  }

  stopWatchers() {
    if (this.watchTimer !== undefined) {
      clearTimeout(this.watchTimer);
      this.watchTimer = undefined;
    }
    for (const watcher of this.watchers.values()) {
      try {
        watcher.close();
      } catch {
        // Already closed.
      }
    }
    this.watchers.clear();
  }

  invalidateSoon() {
    if (this.disposed) return;
    if (this.watchTimer !== undefined) clearTimeout(this.watchTimer);
    this.watchTimer = setTimeout(() => {
      this.watchTimer = undefined;
      this.control?.invalidate();
    }, 250);
  }

  invalidateNow() {
    this.control?.invalidate();
  }

  async state(cwd = this.defaultCwd) {
    const projectRoot = findProjectRoot(cwd);
    const roots = this.roots(projectRoot);
    const items = [];
    const seenPaths = new Set();
    const rootStates = [];

    for (const root of roots) {
      const exists = await isDirectory(root.path);
      let count = 0;
      if (exists) {
        const scanned = await scanRoot(root);
        count = scanned.length;
        for (const skill of scanned) {
          seenPaths.add(resolve(skill.path));
          items.push(skill);
          if (root.source === 'codex' || root.source === 'builtin') this.ensureWatched(root.path);
        }
      }
      rootStates.push({
        id: root.id,
        source: root.source,
        scope: root.scope,
        path: root.path,
        displayPath: homePath(root.path),
        exists,
        editable: root.editable,
        creatable: root.creatable,
        rank: root.rank,
        order: root.order,
        count,
      });
    }

    let registry = [];
    try {
      registry = await this.ctx.skills.list({ cwd: projectRoot });
    } catch {
      registry = [];
    }
    const winning = new Map(registry.map((skill) => [skill.name, skill]));
    for (const summary of registry) {
      if (summary.path && seenPaths.has(resolve(summary.path))) continue;
      items.push({
        name: summary.name,
        displayName: summary.name,
        description: summary.description,
        whenToUse: summary.whenToUse ?? '',
        invocation: summary.invocation,
        path: summary.path ?? null,
        dir: summary.path ? dirname(summary.path) : null,
        relativePath: null,
        rootId: null,
        source: summary.source,
        sourceKind: 'builtin',
        scope: 'builtin',
        provider: summary.provider,
        rank: 900,
        editable: false,
        creatable: false,
        runtime: summary.path === undefined,
        valid: true,
        error: undefined,
        interface: {},
        body: undefined,
        frontmatterLines: [],
        text: undefined,
      });
    }

    const groups = new Map();
    for (const item of items) {
      const group = groups.get(item.name);
      if (group) group.push(item);
      else groups.set(item.name, [item]);
    }
    for (const [skillName, group] of groups) {
      const winner = winning.get(skillName);
      for (const item of group) {
        if (winner === undefined) {
          item.effective = true;
        } else if (winner.path && item.path) {
          item.effective = resolve(winner.path) === resolve(item.path);
        } else {
          item.effective = !winner.path && !item.path;
        }
        item.duplicateCount = group.length;
        item.shadowed = group.length > 1 && !item.effective;
      }
    }
    items.sort((left, right) => {
      if (left.effective !== right.effective) return left.effective ? -1 : 1;
      if (left.scope !== right.scope) {
        const order = { project: 0, user: 1, builtin: 2 };
        return (order[left.scope] ?? 9) - (order[right.scope] ?? 9);
      }
      if (left.source !== right.source) return left.source.localeCompare(right.source);
      return left.name.localeCompare(right.name);
    });

    return {
      ok: true,
      cwd: projectRoot,
      defaultCwd: this.defaultCwd,
      roots: rootStates,
      skills: items.map((item) => this.presentItem(item)),
      trash: await this.listTrash(roots),
    };
  }

  presentItem(item) {
    return {
      name: item.name,
      displayName: item.displayName,
      description: item.description,
      whenToUse: item.whenToUse,
      invocation: item.invocation,
      path: item.path,
      dir: item.dir,
      relativePath: item.relativePath,
      rootId: item.rootId,
      source: item.source,
      sourceKind: item.sourceKind,
      scope: item.scope,
      provider: item.provider,
      editable: item.editable,
      creatable: item.creatable,
      runtime: item.runtime,
      valid: item.valid,
      error: item.error,
      interface: item.interface,
      effective: item.effective,
      duplicateCount: item.duplicateCount ?? 1,
      shadowed: item.shadowed ?? false,
    };
  }

  async detail({ path: file, name: skillName, cwd = this.defaultCwd }) {
    if (typeof file === 'string' && file.length > 0) {
      const root = this.rootForPath(file, cwd);
      if (root === undefined) {
        fail(403, 'That file is outside the managed skill roots');
      }
      const absolute = resolve(file);
      const info = await lstat(absolute).catch(() => undefined);
      if (info === undefined || !info.isFile()) fail(404, 'Skill file not found');
      let text;
      try {
        text = await readTextLimited(absolute);
      } catch (error) {
        throw new StudioError(400, asError(error).message);
      }
      const skill = skillFromFile(absolute, root, { text });
      return {
        ok: true,
        skill: {
          ...this.presentItem(skill),
          content: skill.body,
          raw: skill.text,
        },
      };
    }
    if (typeof skillName === 'string' && skillName.length > 0) {
      const skill = await this.ctx.skills.get(skillName, { cwd: findProjectRoot(cwd) });
      if (skill === undefined) fail(404, `Skill "${skillName}" is no longer available`);
      return {
        ok: true,
        skill: {
          name: skill.name,
          displayName: skill.name,
          description: skill.description,
          whenToUse: skill.whenToUse ?? '',
          invocation: skill.invocation,
          path: skill.path ?? null,
          dir: skill.path ? dirname(skill.path) : null,
          relativePath: null,
          rootId: null,
          source: skill.source,
          sourceKind: 'builtin',
          scope: 'builtin',
          provider: skill.provider,
          editable: false,
          creatable: false,
          runtime: skill.path === undefined,
          valid: true,
          interface: {},
          content: skill.content,
          raw: undefined,
        },
      };
    }
    fail(400, 'A skill path or name is required');
  }

  async save(input, cwd = this.defaultCwd) {
    const pathValue = typeof input.path === 'string' && input.path.length > 0 ? resolve(input.path) : undefined;
    let root;
    let skill;
    let originalLines = [];
    let targetFile;
    let skillName;

    if (pathValue !== undefined) {
      root = this.rootForPath(pathValue, cwd);
      if (root === undefined) fail(403, 'That file is outside the managed skill roots');
      if (!root.editable || root.id === SYSTEM_ROOT_ID) fail(403, 'This skill is read-only');
      if (isInside(join(root.path, TRASH_DIR), pathValue)) fail(403, 'Trashed skills cannot be edited');
      const info = await lstat(pathValue).catch(() => undefined);
      if (info === undefined || !info.isFile()) fail(404, 'Skill file not found');
      if (info.isSymbolicLink()) fail(403, 'Linked skills are read-only');
      const text = await readTextLimited(pathValue);
      skill = skillFromFile(pathValue, root, { text });
      originalLines = skill.frontmatterLines;
      targetFile = pathValue;
      skillName = skill.name;
      if (input.name !== undefined && input.name !== skillName) {
        fail(400, 'Rename a skill by creating a new skill; the name in SKILL.md is its identity');
      }
    } else {
      root = this.rootById(input.rootId, cwd);
      if (root === undefined) fail(400, 'Choose a valid destination');
      if (!root.creatable) fail(403, 'That destination is read-only');
      skillName = typeof input.name === 'string' ? input.name.trim() : '';
      if (!isSkillName(skillName)) fail(400, 'Skill name must be kebab-case (a-z, 0-9, single hyphens), 1-64 characters');
      const directory = join(root.path, skillName);
      const flat = join(root.path, `${skillName}.md`);
      if (existsSync(directory) || existsSync(flat)) fail(409, `A skill named "${skillName}" already exists in this destination`);
      targetFile = join(directory, 'SKILL.md');
    }

    const description = typeof input.description === 'string' ? input.description.trim() : skill?.description ?? '';
    if (!description) fail(400, 'Description is required');
    if (description.length > MAX_DESCRIPTION) fail(400, `Description must be at most ${MAX_DESCRIPTION} characters`);
    const whenToUse = typeof input.whenToUse === 'string' ? input.whenToUse.trim() : skill?.whenToUse ?? '';
    if (whenToUse.length > MAX_DESCRIPTION) fail(400, `When-to-use text must be at most ${MAX_DESCRIPTION} characters`);
    const body = typeof input.content === 'string' ? input.content : skill?.body ?? '';
    if (body.length > MAX_SKILL_BYTES) fail(413, `Skill instructions are larger than ${Math.round(MAX_SKILL_BYTES / 1024)} KiB`);
    const modelInvocable = input.modelInvocable === undefined
      ? skill?.invocation.modelInvocable ?? true
      : input.modelInvocable === true;
    const userInvocable = input.userInvocable === undefined
      ? skill?.invocation.userInvocable ?? true
      : input.userInvocable === true;

    const text = renderSkillFile({
      fields: { name: skillName, description, whenToUse, modelInvocable, userInvocable },
      body,
      originalLines,
    });
    await atomicWrite(targetFile, text);
    await syncOpenAiPolicy(dirname(targetFile), modelInvocable);
    this.invalidateNow();
    return {
      ok: true,
      path: targetFile,
      name: skillName,
      rootId: root.id,
      created: pathValue === undefined,
    };
  }

  async setInvocation(input, cwd = this.defaultCwd) {
    if (typeof input.path !== 'string' || input.path.length === 0) fail(400, 'A skill path is required');
    const pathValue = resolve(input.path);
    const root = this.rootForPath(pathValue, cwd);
    if (root === undefined) fail(403, 'That file is outside the managed skill roots');
    if (!root.editable || root.id === SYSTEM_ROOT_ID) fail(403, 'This skill is read-only');
    if (isInside(join(root.path, TRASH_DIR), pathValue)) fail(403, 'Trashed skills cannot be edited');
    const info = await lstat(pathValue).catch(() => undefined);
    if (info === undefined || !info.isFile()) fail(404, 'Skill file not found');
    if (info.isSymbolicLink()) fail(403, 'Linked skills are read-only');
    const text = await readTextLimited(pathValue);
    const skill = skillFromFile(pathValue, root, { text });
    const modelInvocable = input.modelInvocable === undefined ? skill.invocation.modelInvocable : input.modelInvocable === true;
    const userInvocable = input.userInvocable === undefined ? skill.invocation.userInvocable : input.userInvocable === true;
    const next = renderSkillFile({
      fields: {
        name: skill.name,
        description: skill.description,
        whenToUse: skill.whenToUse,
        modelInvocable,
        userInvocable,
      },
      body: skill.body,
      originalLines: skill.frontmatterLines,
    });
    await atomicWrite(pathValue, next);
    await syncOpenAiPolicy(dirname(pathValue), modelInvocable);
    this.invalidateNow();
    return { ok: true, invocation: { modelInvocable, userInvocable } };
  }

  async remove(input, cwd = this.defaultCwd) {
    if (typeof input.path !== 'string' || input.path.length === 0) fail(400, 'A skill path is required');
    const pathValue = resolve(input.path);
    const root = this.rootForPath(pathValue, cwd);
    if (root === undefined) fail(403, 'That file is outside the managed skill roots');
    if (!root.editable || root.id === SYSTEM_ROOT_ID) fail(403, 'This skill is read-only');
    if (isInside(join(root.path, TRASH_DIR), pathValue)) fail(403, 'Trashed skills cannot be edited');
    const info = await lstat(pathValue).catch(() => undefined);
    if (info === undefined) fail(404, 'Skill file not found');
    if (info.isSymbolicLink()) fail(403, 'Linked skills are read-only');
    const skill = skillFromFile(pathValue, root, { text: await readTextLimited(pathValue) });
    const trash = join(root.path, TRASH_DIR);
    await mkdir(trash, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/gu, '-');
    const base = `${skill.name}-${stamp}-${randomUUID().slice(0, 6)}`;
    const destination = join(trash, info.isDirectory() ? base : `${base}.md`);
    await rename(info.isDirectory() ? skill.dir : pathValue, destination);
    const metadata = {
      name: skill.name,
      displayName: skill.displayName,
      description: skill.description,
      kind: info.isDirectory() ? 'bundle' : 'file',
      rootId: root.id,
      originalPath: pathValue,
      deletedAt: new Date().toISOString(),
    };
    await writeFile(`${destination}.json`, JSON.stringify(metadata, null, 2), 'utf8');
    this.invalidateNow();
    return { ok: true, trashPath: destination, name: skill.name };
  }

  async listTrash(roots = this.roots(), cwd = this.defaultCwd) {
    const output = [];
    for (const root of roots) {
      if (!root.editable) continue;
      const trash = join(root.path, TRASH_DIR);
      let entries;
      try {
        entries = await readdir(trash, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name.endsWith('.json')) continue;
        const absolute = join(trash, entry.name);
        const sidecar = `${absolute}.json`;
        let metadata = {};
        try {
          metadata = JSON.parse(await readFile(sidecar, 'utf8'));
        } catch {
          // Fall back to reading the skill frontmatter.
        }
        let name = metadata.name;
        let description = metadata.description;
        if (!name) {
          try {
            const file = entry.isDirectory() ? join(absolute, 'SKILL.md') : absolute;
            const skill = skillFromFile(file, root, { text: await readTextLimited(file) });
            name = skill.name;
            description = skill.description;
          } catch {
            continue;
          }
        }
        let deletedAt = metadata.deletedAt;
        if (!deletedAt) {
          try {
            deletedAt = (await stat(absolute)).mtime.toISOString();
          } catch {
            deletedAt = undefined;
          }
        }
        output.push({
          trashPath: absolute,
          name,
          displayName: metadata.displayName || name,
          description: description || '',
          rootId: root.id,
          source: root.source,
          scope: root.scope,
          kind: metadata.kind || (entry.isDirectory() ? 'bundle' : 'file'),
          deletedAt,
        });
      }
    }
    output.sort((left, right) => String(right.deletedAt ?? '').localeCompare(String(left.deletedAt ?? '')));
    return output;
  }

  async restore(input, cwd = this.defaultCwd) {
    if (typeof input.trashPath !== 'string' || input.trashPath.length === 0) fail(400, 'A trash path is required');
    const trashPath = resolve(input.trashPath);
    const root = this.rootForTrash(trashPath, cwd);
    if (root === undefined) fail(403, 'That trashed skill is outside the managed roots');
    const info = await lstat(trashPath).catch(() => undefined);
    if (info === undefined) fail(404, 'Trashed skill not found');
    let metadata = {};
    try {
      metadata = JSON.parse(await readFile(`${trashPath}.json`, 'utf8'));
    } catch {
      // Derive from the skill file below.
    }
    let skillName = metadata.name;
    let kind = metadata.kind;
    if (!skillName) {
      const file = info.isDirectory() ? join(trashPath, 'SKILL.md') : trashPath;
      const skill = skillFromFile(file, root, { text: await readTextLimited(file) });
      skillName = skill.name;
      kind = info.isDirectory() ? 'bundle' : 'file';
    }
    if (!isSkillName(skillName)) fail(400, 'The trashed skill has no valid name');
    const target = kind === 'bundle' ? join(root.path, skillName) : join(root.path, `${skillName}.md`);
    if (existsSync(target)) fail(409, `A skill named "${skillName}" already exists in this destination`);
    await rename(trashPath, target);
    await rm(`${trashPath}.json`, { force: true }).catch(() => {});
    this.invalidateNow();
    return { ok: true, path: target, name: skillName };
  }

  async cwdFromRequest(request) {
    try {
      const url = new URL(request.url);
      const value = url.searchParams.get('cwd');
      if (value && isAbsolute(value)) return resolve(value);
    } catch {
      // Ignore malformed query strings.
    }
    return this.defaultCwd;
  }
}

function studioRoutes(studio) {
  const route = (path, methods, handle) => ({
    path,
    methods,
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        return await handle(request);
      } catch (error) {
        const status = error instanceof StudioError ? error.status : 500;
        return jsonResponse(status, { ok: false, error: asError(error).message });
      }
    },
  });

  return [
    route('/api/skill-studio-codex.state', ['GET'], async (request) => {
      return jsonResponse(200, await studio.state(await studio.cwdFromRequest(request)));
    }),
    route('/api/skill-studio-codex.skill', ['GET'], async (request) => {
      const url = new URL(request.url);
      return jsonResponse(200, await studio.detail({
        path: url.searchParams.get('path') ?? undefined,
        name: url.searchParams.get('name') ?? undefined,
        cwd: await studio.cwdFromRequest(request),
      }));
    }),
    route('/api/skill-studio-codex.save', ['POST'], async (request) => {
      const input = await readJson(request);
      return jsonResponse(200, await studio.save(input, await studio.cwdFromRequest(request)));
    }),
    route('/api/skill-studio-codex.invocation', ['POST'], async (request) => {
      const input = await readJson(request);
      return jsonResponse(200, await studio.setInvocation(input, await studio.cwdFromRequest(request)));
    }),
    route('/api/skill-studio-codex.delete', ['POST'], async (request) => {
      const input = await readJson(request);
      return jsonResponse(200, await studio.remove(input, await studio.cwdFromRequest(request)));
    }),
    route('/api/skill-studio-codex.restore', ['POST'], async (request) => {
      const input = await readJson(request);
      return jsonResponse(200, await studio.restore(input, await studio.cwdFromRequest(request)));
    }),
  ];
}

export function apply(ctx) {
  const studio = new SkillStudio(ctx);
  ctx.effect(() => studio.start(), 'skill-studio: Codex provider and watchers');

  ctx.on('agent/pre-step', async ({ agent, messages, signal }, next) => {
    const decision = await next();
    if (decision.kind === 'reject') return decision;
    const names = messageSkillNames(messages, DOLLAR_SKILL);
    if (names.length === 0) return decision;
    const slashNames = new Set(messageSkillNames(messages, SLASH_SKILL));
    const already = new Set(
      decision.messages
        .filter((message) => message?.source?.kind === 'skill-invocation' && typeof message.source.name === 'string')
        .map((message) => message.source.name),
    );
    let cwd = studio.defaultCwd;
    try {
      const workingDirectory = ctx.get('workingDirectory');
      if (workingDirectory !== undefined) cwd = await workingDirectory.ensure(agent, signal);
    } catch {
      // A session without a working directory still resolves user-level skills.
    }
    const injected = [];
    for (const skillName of names) {
      if (slashNames.has(skillName) || already.has(skillName)) continue;
      signal.throwIfAborted();
      let skill;
      try {
        skill = await ctx.skills.get(skillName, { cwd, signal, scope: agent });
      } catch {
        continue;
      }
      if (skill === undefined || !skill.invocation.userInvocable) continue;
      injected.push(skillMessage(skill.name, renderSkillContent(skill)));
    }
    if (injected.length === 0) return decision;
    return { ...decision, messages: [...decision.messages, ...injected] };
  });

  ctx.inject(['connection'], (scope) => {
    for (const registration of studioRoutes(studio)) {
      scope.effect(
        () => scope.connection.fetch.register(registration),
        `skill-studio: ${registration.path}`,
      );
    }
  });
}
