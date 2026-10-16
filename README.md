# Game design: Multiplayer system for web game 00vchannel

by Deep Frame Studio

An Agent Skill for adding small, cooperative multiplayer sessions to browser games. It includes a working 2–4 player starter, integration contracts, and guidance for synchronization, background tabs, disconnects, and replaying a round.

The host runs the game simulation. Cloudflare Workers and Durable Objects relay messages between players, so friends can join from different networks without running a dedicated game server. Use it with Canvas, Three.js, or an existing browser renderer.

## What the skill does

- Connects your own gameplay to an existing room and synchronization layer.
- Separates player input, host-owned state, and rendering.
- Handles shared interactions, stale inputs, round boundaries, and disconnected players.
- Keeps window switching separate from actually leaving a room.
- Provides a runnable starter and focused debugging and verification guides.

## Install

### Choose your agent

With Node.js and npm installed, run this command and select your agent:

```sh
npx skills add 00vchannel/game-design-multiplayer-system-for-web-game --skill game-design-multiplayer-system-for-web-game-00vchannel -g
```

To select one agent directly, append one of these options:

| Agent | Option |
| --- | --- |
| OpenCode | `-a opencode` |
| ZCode | `-a zcode` |
| Codex | `-a codex` |
| Claude Code | `-a claude-code` |
| Cursor | `-a cursor` |
| Windsurf | `-a windsurf` |

For example, install for ZCode:

```sh
npx skills add 00vchannel/game-design-multiplayer-system-for-web-game --skill game-design-multiplayer-system-for-web-game-00vchannel -g -a zcode
```

Omit `-g` for a project installation. Specify the full skill name above: the repository also retains the old name for existing download links. CLI options are documented in the [Skills CLI](https://github.com/vercel-labs/skills).

### Manual installation

Download the repository ZIP using **Code → Download ZIP**. Copy the complete `skills/game-design-multiplayer-system-for-web-game-00vchannel` folder into one destination below. Keep `SKILL.md`, `agents/`, `references/`, and `assets/` together; do not copy only `SKILL.md`.

| Agent | Global directory | Project directory |
| --- | --- | --- |
| [OpenCode](https://opencode.ai/docs/skills/) | `~/.config/opencode/skills/` | `.opencode/skills/` |
| [ZCode](https://zcode.z.ai/en/docs/skill) | `~/.zcode/skills/` | Use the global directory or ZCode's project import UI |
| [Codex](https://developers.openai.com/codex/skills) | `~/.agents/skills/` | `.agents/skills/` |
| [Claude Code](https://code.claude.com/docs/en/skills) | `~/.claude/skills/` | `.claude/skills/` |
| [Cursor](https://cursor.com/docs/skills) | `~/.cursor/skills/` | `.cursor/skills/` |
| [Windsurf](https://docs.windsurf.com/windsurf/cascade/skills) | `~/.codeium/windsurf/skills/` | `.windsurf/skills/` |

`~` means your home directory. Current Devin Desktop documentation also accepts `.devin/skills/` and retains the Windsurf paths for compatibility. These are local-agent locations; cloud sessions may require a separate import or sync.

In ZCode, open **Settings → Skills → Refresh** and enable the skill. In other agents, check the skill list; restart the session if it has not appeared. Instructions follow each tool's documented discovery mechanism; installation has not been tested interactively in all six tools.

## Usage

Ask your agent:

```text
Use game-design-multiplayer-system-for-web-game-00vchannel to add a cooperative room to my browser game. Inspect the existing code first and preserve my gameplay.
```

In Codex or ZCode, select `$game-design-multiplayer-system-for-web-game-00vchannel`. In Claude Code, invoke `/game-design-multiplayer-system-for-web-game-00vchannel`. Other agents can load it by name through their skill interface.

For a new project, use the installed skill's `assets/starter`. For an existing game, merge only the required parts. The starter is a connectivity playground, not a finished game. Technical references currently include Traditional Chinese; ask your agent to explain them in your preferred language.

## Updates that preserve local edits

For managed installation and updates, use Node.js 24 and the repository's `scripts/update-github-skills.mjs`:

```sh
node scripts/update-github-skills.mjs --skill multiplayer --work-dir "<absolute working directory>" --skills-dir "<absolute skills directory from the table>"
```

Run this from an extracted repository, or ask your agent to retrieve the script from a fixed commit after resolving `main` through the GitHub API. `--skills-dir` is the parent directory, not the skill folder itself; the default is ZCode's global skills directory.

The updater resolves the current `main`, pins that commit for the operation, and verifies downloaded files against GitHub's blob hashes. Interrupted downloads resume the same commit. It keeps backups and stops if installed files contain unrecognized edits or additions. It refuses symlinked destinations; use the same installer that created a linked installation, or arrange a reviewed migration first. Do not assume the separate Skills CLI has the same edit-protection behavior.

Updates happen only when you run setup or request an update. They never overwrite your game. After updating, reload the skill in your agent. For old installations, the updater migrates the old name when its contents match a known version; modified installations stay intact for review.

## Limits

The included architecture supports 2–4 players with a desktop host. It does not provide host migration, reconnect-after-refresh, competitive anti-cheat, or an always-on simulation. Operating-system sleep can pause the host. Free hosting allowances have limits, and this skill does not authorize paid services or deployment on your behalf.

## Repository layout

- `skills/game-design-multiplayer-system-for-web-game-00vchannel/`: current skill and starter.
- `scripts/update-github-skills.mjs`: managed installer and updater.
- `skills/game-design-multiplayer-system-for-web-game/`: preserved compatibility version for older installers.

`agents/openai.yaml` supplies Codex display metadata; other compatible agents can ignore it. Publishing a change to GitHub `main` makes it available on the next requested update; editing a local copy alone does not publish it.
