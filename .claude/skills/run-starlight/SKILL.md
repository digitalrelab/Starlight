---
name: run-starlight
description: Start, restart, stop, screenshot or drive the Starlight desktop app in development. Use whenever the app has to run.
---

- Start or restart: `bun run dev` from the checkout root, in the background. It replaces only this checkout's previous instance.
- Stop: `bun run dev:stop`.
- Drive or inspect: attach over the Chrome DevTools Protocol at `127.0.0.1:<port>`, where `<port>` is in `apps/desktop/.data/dev.port`.
- Never start Electron or electron-vite directly, and never stop processes by name, pattern or port: other checkouts run their own instances.
