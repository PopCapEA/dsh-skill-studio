# Skill Studio for DeepSeek Harness

A Codex-compatible skill system for DSH, with a first-class page in the left
sidebar. It reads and writes plain `SKILL.md` folders, so the same skills work
in Codex, DSH, and the shared `.agents` directory.

![Skill Studio icon](icon.svg)

## What it does

- **One Skill page in the sidebar** — browse every Codex, DSH, and shared skill,
  search it, read its instructions, and see which copy is effective.
- **Create, edit, duplicate, delete, and restore** — writes the Codex
  `SKILL.md` format with YAML frontmatter. Deletions go to a recoverable
  `.trash` folder inside the same scope.
- **Enable or disable per surface** — `disable-model-invocation` controls the
  model catalog and the `skill` tool; `user-invocable` controls direct user
  invocation.
- **Codex scopes** — `~/.codex/skills` and `<project>/.codex/skills` are bridged
  into DSH's skill registry, so existing Codex skills appear in the agent
  catalog without copying them.
- **Invoke in conversation** — type `$skill-name` in a chat to inject the full
  `<skill_content>` block into that turn, exactly like Codex. The existing
  `/skill-name` form also keeps working.
- **Progressive disclosure** — the model receives only names and descriptions;
  full instructions load on demand through the `skill` tool or `$name`.
- **Codex presentation metadata** — `agents/openai.yaml` `interface` and
  `policy.allow_implicit_invocation`, plus legacy `config.toml` `[interface]`
  fields such as `displayName`, `shortDescription`, `brandColor`, and
  `defaultPrompt`, are shown when present.

## Scopes

| Scope | Location | Writable | Notes |
| --- | --- | --- | --- |
| Codex user | `~/.codex/skills` | yes | Bridged into DSH by this plugin |
| Codex project | `<project>/.codex/skills` | yes | Nearest `.git` ancestor, or the workspace directory |
| DSH user | `~/.dsh/skills` | yes | Native DSH filesystem provider |
| DSH project | `<project>/.dsh/skills` | yes | Native DSH filesystem provider |
| Shared Agent | `~/.agents/skills`, `<project>/.agents/skills` | yes | Visible and editable when present |
| Codex built-in | `~/.codex/skills/.system` | no | Read-only; duplicate into a writable scope |
| Bundled/runtime | DSH packages | no | Read-only; duplicate when possible |

`DSH_CODEX_HOME` (or `CODEX_HOME`) changes the Codex home; `DSH_HOME` and
`DSH_AGENTS_HOME` change the DSH and shared roots. The Codex home is scanned
under `<home>/skills`.

A project copy outranks a user copy; a DSH copy outranks a Codex copy of the
same name. The page marks the losing copy **Shadowed** and shows both, so a
stale duplicate is never invisible.

## Skill format

```markdown
---
name: release-checklist
description: Use when preparing and verifying a production release.
whenToUse: Before tagging a release.
---

# Release checklist

## Workflow

1. Run the project's own checks.
2. Inspect the final diff.
3. Report the result and remaining risks.
```

A skill is a directory bundle `<name>/SKILL.md` (recommended) or a flat
`<name>.md` file directly under a scope root. The only required frontmatter
fields are `name` (kebab-case) and `description`. Optional companion files can
live beside `SKILL.md` (`references/`, `scripts/`, `assets/`, `agents/openai.yaml`,
`config.toml`, `icon.svg`).

`disable-model-invocation: true` hides the skill from the model catalog and the
`skill` tool. `user-invocable: false` removes it from the `$name` / `/name`
gesture. Both default to allowed.

## Using a skill in chat

```text
$release-checklist verify the 2.4 release and list anything blocking it
```

The skill's instructions enter the current step as a `<skill_content>` block,
and the catalog tells the model to follow it rather than load it again. Typing
`/release-checklist` uses DSH's existing user-skill gesture and has the same
effect.

The model can also load any model-invocable skill with the existing `skill`
tool, which returns the same canonical `<skill_content>` shape.

## Installation

This package is a normal DSH bundle:

```powershell
dsh plugin --profile <profile> add dsh-skill-studio-codex
```

Or install from a checkout / release tarball:

```powershell
dsh plugin --profile <profile> add <absolute path to this directory or .tgz>
```

Or install it through the DSH Plugin Manager with the absolute package
directory. Refresh the page after installation; the **Skills** icon appears in
the left panel list.

## Design notes

- The host half is plain Node ESM with only `node:` imports. It registers a
  `codex-studio` provider on `ctx.skills`, owns the authenticated
  `/api/skill-studio-codex.*` routes through `ctx.connection.fetch`, and installs
  one `agent/pre-step` listener for `$name`.
- The client half is a plain-JavaScript module loaded by
  `window.__ModuleLoader__`; it uses only React, theme tokens, and the public
  slot/locale services.
- File writes are atomic (temp file plus rename), names are validated, and
  every mutating route is authenticated by the existing browser session.
- Deleting a skill renames its bundle into `<scope>/.trash/` with a sidecar
  record, so **Trash → Restore** works without a database.
- The Codex provider invalidates its catalog on a debounced filesystem watch, so
  edits made in Codex, VS Code, or a shell reach the next model step.
- This published edition uses its own Loader row, sidebar panel id, API prefix,
  locale namespace, and provider name. It can coexist with the local
  `@local/dsh-skill-studio` build instead of replacing it.

## Limits

- Editing always updates `SKILL.md` frontmatter; comments on managed keys are
  not preserved when the key is rewritten. Unknown frontmatter keys and
  `metadata:` blocks are preserved.
- Renaming a skill is intentionally not done in place: the name in `SKILL.md`
  is its identity. Duplicate and delete the old copy instead.
- Symlinked skill bundles are visible but read-only.
- The page manages the default workspace for project scopes. Per-session
  workspaces with a different cwd are still discovered by the model, but the
  management page uses the process workspace.
