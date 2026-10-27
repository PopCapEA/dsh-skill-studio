# Publishing Skill Studio

This directory is the publish-ready edition. It is intentionally separate from
the installed `@local/dsh-skill-studio` link so publishing does not disturb the
running plugin.

## Current status

- Tarball: `dist/dsh-skill-studio-codex-1.0.0.tgz` (SHA-256 `FA08C51A78BBB3CA9AF7933B9FBAB55525BDE0B70B3701537DC245DCA5974F84`)
- npm package name: `dsh-skill-studio-codex` (unclaimed at the time of writing)
- GitHub repository: <https://github.com/PopCapEA/dsh-skill-studio>
- GitHub release: <https://github.com/PopCapEA/dsh-skill-studio/releases/tag/v1.0.0>
- Market PR: <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/9703> (open; the one-day repository-age gate clears itself and the gate workflow re-runs automatically)
- npm authentication: **not configured on this machine** — npm publish is the only remaining upload step
- Market submission: copied into the PR as `data/plugins/PopCapEA__dsh-skill-studio.yml`

## 1. Create the public GitHub repository

The public repository exists at
<https://github.com/PopCapEA/dsh-skill-studio>. Push this directory's contents
to its `main` branch:

```powershell
git init -b main
git add .
git commit -m "Skill Studio for DeepSeek Harness"
git remote add origin https://github.com/PopCapEA/dsh-skill-studio.git
git push -u origin main
git tag v1.0.0
git push origin v1.0.0
```

Add the `dsh-plugin` topic in GitHub repository settings. Optionally add
`dsh`, `deepseek-harness`, `codex`, and `skills`.

The repository metadata in `package.json` already points at
`PopCapEA/dsh-skill-studio`. The market uses `repository` to associate an npm
package with its listed GitHub source.

## 2. Publish to npm

```powershell
npm login --registry=https://registry.npmjs.org/
npm publish --access public --registry=https://registry.npmjs.org/
```

Then verify:

```powershell
npm view dsh-skill-studio-codex version
dsh plugin --profile web add dsh-skill-studio-codex
```

Do not publish `@local/dsh-skill-studio`; that package is the local development
link and is marked `private`.

## 3. Submit to awesome-dsh-plugin

The public DSH market reads the GitHub curated list
[`awesome-dsh-plugin/awesome-dsh-plugin`](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin).
It has no direct upload endpoint. The submission is one YAML file in
`data/plugins/<owner>__<repo>.yml`; the list's README and site are regenerated
from that data.

1. Copy `submission/PopCapEA__dsh-skill-studio.yml` to
   `data/plugins/PopCapEA__dsh-skill-studio.yml` in a clone of the list
   repository.
2. Open one PR containing only that file.

```powershell
git clone https://github.com/awesome-dsh-plugin/awesome-dsh-plugin.git
cd awesome-dsh-plugin
git checkout -b add-dsh-skill-studio
# copy the prepared submission file
git add data/plugins/PopCapEA__dsh-skill-studio.yml
git commit -m "Add dsh-skill-studio-codex"
git push -u origin add-dsh-skill-studio
```

The list CI checks that `package.json` declares `dsh.bundle`, that the
repository is at least one day old, and that the description is factual. The
site normally syncs within a day after merge.

## 4. Optional: GitHub Release tarball

If installing from GitHub source is too slow, attach the generated tarball to a
GitHub Release and use its stable URL. The market's `tarball` field must be an
HTTPS `.tgz` URL hosted by a GitHub Release:

```text
https://github.com/PopCapEA/dsh-skill-studio/releases/latest/download/dsh-skill-studio-codex-1.0.0.tgz
```

## 5. Install-over note

The published edition deliberately uses different identifiers than the local
link:

| Surface | Local link | Published edition |
| --- | --- | --- |
| Loader row | `skill-studio` | `skill-studio-codex` |
| Sidebar/main id | `skills` | `skill-studio` |
| Skills provider | `codex` | `codex-studio` |
| API prefix | `/api/skill-studio.*` | `/api/skill-studio-codex.*` |
| Locale namespace | `dsh-skill-studio` | `dsh-skill-studio-codex` |

That lets both editions coexist for testing. If you only want one Skills icon,
remove the local link before installing the published package:

```powershell
dsh plugin --profile web remove @local/dsh-skill-studio
dsh plugin --profile web add dsh-skill-studio-codex
```
