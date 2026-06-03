> **Ongoing project** — Jerry is in early development. New updates will be added soon.

# Jerry Client

Jerry is a local Electron desktop app that lives in the Mac system tray, provides a chat interface, and generates work narratives from your ActivityWatch data.

## What it does

- **Work narratives** — Summarize what you've been working on using ActivityWatch activity data via aw-mcp
- **Chat interface** — Talk to Jerry to request summaries, ask questions, and refine narratives
- **System tray** — Runs quietly in the menu bar; open the chat window with a click
- **Push notifications** — Get reminders and alerts when narratives are ready
- **Rules engine** — Configurable rules for working hours, tracked apps, and narrative style

## Tech stack

| Layer | Technology |
|-------|------------|
| Desktop | Electron + electron-builder |
| UI | Next.js (App Router) + React + TypeScript |
| Components | shadcn/ui (gray palette, dark/light/system) + lucide-react |
| Styling | Tailwind CSS + next-themes |
| State | Zustand |
| Activity data | ActivityWatch API (localhost:5600) |
| Storage | electron-store (config and rules) |

## Roadmap (v0.1)

| # | Ticket |
|---|--------|
| 1 | Project bootstrap and Electron shell |
| 2 | System tray and window management |
| 3 | Chat UI and ActivityWatch integration |
| 4 | Work narrative generation with LLM |

### v0.1 goals

- Installs and runs on macOS
- System tray icon with click-to-toggle chat window
- Chat UI for requesting work narratives
- Narratives generated from real ActivityWatch data
- Native notifications on completion
- Secure API key configuration

## Prerequisites

- macOS
- [ActivityWatch](https://activitywatch.net/) running locally
- Node.js 18+

## Getting started

```bash
git clone https://github.com/SarkarShubhdeep/jerry-client.git
cd jerry-client
npm install
npm run dev
```

This starts the Next.js dev server and opens the Electron shell.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js + Electron in development |
| `npm run build` | Build Next.js static export and Electron main |
| `npm run start` | Run production Electron app |
| `npm run package` | Package macOS app with electron-builder |

## License

MIT — see [LICENSE](LICENSE).
