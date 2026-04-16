# StreamFlow

Desktop IPTV player for **Xtream Codes** playlists. Built with **Electron**, **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

**Repository:** [github.com/Othdu/streamflow](https://github.com/Othdu/streamflow)

## Features

- Live TV, VOD, and series browsing with categories, search, and favorites  
- Playback via **hls.js** and **mpegts.js**, with a local HTTP proxy in Electron for CORS, HLS segment routing, and VOD **Range** seeking  
- Optional **external player** (mpv / VLC)  
- **EPG** guide and catch-up where the provider supports it  
- **Themes** and preset palettes, plus a **custom CSS** editor (targets semantic classes such as `.sidebar`, `.channel-card`, `.search-input`; `:root` variables use RGB channels, e.g. `--sf-base: 10 13 20`)  
- **Arabic** UI option with RTL layout  
- Settings persisted with **electron-store**; Windows **NSIS** installer via **electron-builder**

## Requirements

- **Node.js** 18+ and npm  
- **Windows** for the packaged `.exe` (scripts use `electron-builder --win`)

## Development

```bash
npm install
npm run dev
```

This compiles the Electron main/preload, starts Vite on `http://localhost:5173`, and launches Electron.

## Production build (Windows)

```bash
npm run build:win
```

Output goes to the `release/` folder (see `package.json` → `build.directories.output`). You should get an installer similar to:

`release/StreamFlow Setup 1.0.0.exe`

**Tip:** If the build fails because `app.asar` is locked, close any running **StreamFlow** or **Electron** instances, or build to a fresh output directory:

```bash
npm run build
npx electron-builder --win --config.directories.output=release-new
```

## Project layout

| Path | Role |
|------|------|
| `electron/` | Main process, preload, local stream proxy |
| `src/` | Renderer (React app) |
| `dist/` | Vite production bundle |
| `dist-electron/` | Compiled Electron main/preload (from `tsc -p tsconfig.electron.json`) |

## Configuration

- Add playlists in-app (Xtream server URL, username, password).  
- Do **not** commit real credentials; they are stored locally by the app.

## License

Specify your license here (e.g. MIT) if you publish the repo publicly.
