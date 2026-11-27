# Starlight

Electron file manager. Bun workspaces. Vite+ toolchain (`vp`).

## Rules

- No tests. Do not write unit, integration, or e2e tests.
- No CLAUDE.md. This file is the only agent instruction file.
- Latest versions only. Pin exact versions in the root `catalog`; packages use `catalog:`.
- Typecheck with tsrs via `vp check`. Do not add `typescript`.
- No comments that restate code.

## Commands

- `bun install`
- `bun run dev` — electron-vite dev
- `bun run build`
- `vp check` — format, lint, typecheck (built-in; no script)
- `vp check --fix`

## Layout

```
apps/desktop/src/main      Electron main: windows, dialogs, port brokering, ShellRpcs
apps/desktop/src/preload   port handshake only; exposes nothing
apps/desktop/src/renderer  React app: routes/, features/, lib/
packages/contracts         Effect Schema: domain types, errors, RpcGroups
packages/core              use cases + ports (Effect services); no node, electron, react
packages/host              utilityProcess: adapters (node fs, sqlite), RPC server, entry
packages/client            RPC client → Promise API + TanStack Query option factories
packages/ui                Base UI + Tailwind primitives and tokens
crates/                    Rust (napi) — empty until profiling justifies it
tooling/tsconfig           shared tsconfig bases
```

## Boundaries

Enforced by `no-restricted-imports` overrides in `vite.config.ts`.

- `contracts` ← everyone. Depends only on `effect`.
- `core` → `contracts`, `effect`. Talks to the world only through ports in `core/src/ports.ts`.
- `host` → `core`, `contracts`. Implements ports. Never imports `electron`.
- `client` → `contracts`, `effect`, `@tanstack/react-query`.
- `ui` → React, Base UI, Tailwind. No data, no routing, no Effect.
- `renderer` → `client`, `ui`, TanStack. No Effect, no `contracts` (types come via `client`).
- `main` → `contracts`, `host/transport`, `electron`. No business logic.

## Architecture

- Processes: main (shell) · host utilityProcess (core, fs, sqlite) · renderer (React).
- Renderer ↔ host and renderer ↔ main talk over MessagePorts with Effect RPC. Main brokers ports; it does not relay data.
- Every command is defined once in `contracts/src/rpc.ts`. UI and agents use the same commands.
- Each connection is bound to an `Actor` (`User` | `Agent`). Mutations write to `audit_log`.
- All disk paths from callers go through `Workspaces.resolve` (root containment + symlink check).
- Filesystem is the source of truth. SQLite is derived state + app state.
- Effect lives in `contracts`, `core`, `host`, `client`, `main`. React code sees Promises and tagged errors.
- URL holds view state (workspace, path). TanStack Query holds data. Do not mirror either into React state.

## Adding a command

1. `contracts/src/rpc.ts`: `Rpc.make("VerbNoun", ...)` with payload/success/error schemas.
2. `core`: use case on a service; new I/O → new port.
3. `host/src/adapters`: implement any new port. `host/src/rpc/server.ts`: map command → use case.
4. `client/src/client.ts`: Promise method. `client/src/queries.ts`: query/mutation options.
5. `renderer`: consume via `useStarlight()` + TanStack Query.
