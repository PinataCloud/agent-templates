# Useful Assistant Template (Hermes)

## What this is

A vanilla starting point for building agents on Hermes. The agent boots
into a flat `workspace/` cwd with two files it actually reads: `SOUL.md`
(persona) and `AGENTS.md` (workspace conventions, safety, memory
rules). Everything else lives at the root for deployment tooling.

No bootstrap scaffolding, no pre-attached skills, no provider lock-in.
Clone it, edit the persona, attach what you need.

## Layout

```
useful-assistant/
├── manifest.json     # Engine, template metadata, scripts, routes, tasks.
├── README.md         # This file. For humans cloning the template.
└── workspace/        # Agent cwd. Everything in here is visible to the agent.
    ├── SOUL.md       # Persona. Hermes reloads it fresh each message.
    ├── AGENTS.md     # Runtime conventions the agent reads each session.
    └── projects/
        └── hello-test/  # Vite + React + TS starter served at /app
```

> The agent only sees what's inside `workspace/` plus the manifest.
> Anything outside `workspace/` (README, etc.) is for humans.

## The starter project

`workspace/projects/hello-test/` is a Vite + React + TS app, wired
up by `manifest.json`:

- `scripts.build` runs `npm install` on first deploy
- `scripts.start` boots Vite on `0.0.0.0:5173`
- `routes` exposes it at `/app` (unprotected)

Replace it with your own app — just keep `manifest.json`'s scripts and
routes in sync.

## How it works

1. Deploy the template on Hermes — `manifest.json` declares the engine
   and any routes/secrets/skills
2. Open the chat — the agent reads `workspace/SOUL.md` (personality)
   and `workspace/AGENTS.md` (conventions) on every session
3. Edit `workspace/SOUL.md` to tune the persona — reloads on the next
   message, no restart needed
4. Edit `workspace/AGENTS.md` (or add more `AGENTS.md` files in
   subdirectories) to layer in project-specific conventions
5. Attach skills, add secrets, and grow into whatever the agent needs

Hermes will create `workspace/memories/MEMORY.md` automatically on
first run if `memory.memory_enabled: true` in `config.yaml` (the
default). That's where long-term memory accumulates.

## Customization

| File                       | Edit when…                                          |
| -------------------------- | --------------------------------------------------- |
| `workspace/SOUL.md`        | You want a different personality, tone, or style    |
| `workspace/AGENTS.md`      | You want new rules, safety policies, conventions    |
| `manifest.json`            | You need to add skills, secrets, routes, schedules  |

## Context files Hermes auto-discovers

Drop any of these in the workspace (or subdirectories) to layer in
more guidance
([docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)):

| File                       | Purpose                              | Location              |
| -------------------------- | ------------------------------------ | --------------------- |
| `.hermes.md` / `HERMES.md` | Project instructions (top priority)  | Walks to git root     |
| `AGENTS.md`                | Project structure, conventions       | cwd + subdirectories  |
| `CLAUDE.md`                | Claude Code context                  | cwd + subdirectories  |
| `SOUL.md`                  | Global personality                   | `$HERMES_HOME` only   |
| `.cursorrules`             | Cursor IDE conventions               | cwd only              |

Only one project context loads per session (first match wins);
`SOUL.md` always loads independently.
