**Intro:** [Watch the Jerry v0.1 beta intro (YouTube Short)](https://youtube.com/shorts/ew30nMNympY?si=h2oXmMP7JQYxsgHr)

# Jerry Client

**v0.1 beta · macOS** — A local Electron app that chats with you and summarizes what you've been working on using [ActivityWatch](https://activitywatch.net/) on your machine.

## Download

Get the latest **macOS .dmg** from [GitHub Releases](https://github.com/SarkarShubhdeep/jerry-client/releases).

> **Gatekeeper:** This beta is unsigned. If macOS blocks the app, right-click Jerry → **Open**, or allow it in **System Settings → Privacy & Security**.

## What's in this beta

- **Chat** with OpenAI (API key in Settings; model picker in the footer)
- **Work summaries** from ActivityWatch when you ask about your day (e.g. *What have I been working on today?*)
- **Work-related web links** (GitHub, docs, Notion, etc.) from the ActivityWatch **web** watcher
- **ActivityWatch status** badge in the title bar (green = connected)
- **Markdown** replies; click the **Jerry v0.1** badge for a quick feature list

## Requirements

| Requirement | Notes |
|-------------|--------|
| **macOS** | Apple Silicon or Intel |
| **[ActivityWatch](https://activitywatch.net/)** | Running locally (default API `http://localhost:5600`) |
| **Watchers** | At least **window**; **web** recommended for link summaries |
| **OpenAI API key** | Set in app **Settings** — not in `.env` |

## First run

1. Install and start **ActivityWatch** (and watchers you use).
2. Install Jerry from the **.dmg** (see Gatekeeper note above).
3. Open **Settings** (gear icon) and add your **OpenAI API key**.
4. Confirm the **AW** badge is green.
5. Try: *What have I been working on today?*

## Jerry CLI (experimental v0.1)

A **standalone** command-line tool in [`jerry-cli/`](jerry-cli/) for stateless work reports (ActivityWatch + OpenAI → `.md` files). It does **not** use or require the Electron app.

```bash
cd jerry-cli
npm install && npm run build
export OPENAI_API_KEY=sk-...
./jerry report "give me report of my past hour work"
```

See [jerry-cli/README.md](jerry-cli/README.md) for config, branching (`jerry-cli/main`), and release tarball (`npm run pack:release`). Tracking issues: [#10](https://github.com/SarkarShubhdeep/jerry-client/issues/10)–[#12](https://github.com/SarkarShubhdeep/jerry-client/issues/12).

## Develop from source

```bash
git clone https://github.com/SarkarShubhdeep/jerry-client.git
cd jerry-client
npm install
npm run dev
```

This starts Next.js and the Electron shell. Optional dev overrides live in `.env` — see [`.env.example`](.env.example) (`ACTIVITYWATCH_BASE_URL` only; LLM keys are in-app).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js + Electron in development |
| `npm run build` | Next.js static export + Electron main |
| `npm run start` | Run production build locally |
| `npm run package` | Build macOS `.dmg` into `release/` |

## Tech stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron + electron-builder |
| UI | Next.js (App Router) + React + TypeScript |
| Components | shadcn/ui + lucide-react + next-themes |
| Styling | Tailwind CSS |
| Activity data | ActivityWatch REST API (localhost) |
| LLM | OpenAI via Electron main process |
| Storage | electron-store (settings, API keys) |

## Roadmap

| # | Area | Status |
|---|------|--------|
| 1 | Electron + Next.js shell | Done |
| 3 | Chat UI + ActivityWatch read path | Done |
| 4 | Work narratives with LLM + AW context | Done (beta) |
| 6 | LLM service infrastructure | Done |
| 2 | System tray + window management | Post-beta |
| 7 | Persist chats (SQLite) | Post-beta |
| — | Native notifications, rules engine | Planned |

## Known limitations (beta)

- No menu bar tray yet ([#2](https://github.com/SarkarShubhdeep/jerry-client/issues/2))
- Chat history is not saved across restarts ([#7](https://github.com/SarkarShubhdeep/jerry-client/issues/7))
- Unsigned macOS build (see Download above)

## License

MIT — see [LICENSE](LICENSE).
