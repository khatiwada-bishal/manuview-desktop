# ManuView Desktop

ManuView Desktop is the standalone, native desktop application for **ManuView** — an AI pre-submission manuscript review and research suite.

Built with **Tauri v2 + React + Vite + Tailwind CSS**.

---

## Getting Started

### Prerequisites

1. **Node.js** (v18+)
2. **Rust & Cargo** (for Tauri native app compilation)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

### Installation

```bash
npm install
```

### Running in Development

Run the Tauri desktop app with hot module reload:

```bash
npm run desktop:dev
```

To run only the web preview in your browser:

```bash
npm run dev
```

### Building for Production

To create native OS packages (macOS `.dmg` / `.app`, Windows `.msi` / `.exe`, Linux `.deb` / `.AppImage`):

```bash
npm run desktop:build
```

The compiled bundles and installers will be saved under `src-tauri/target/release/bundle/`.

---

## How to Initialize this as a New GitHub Repository

To push this project to `github.com/khatiwada-bishal/manuview-desktop`:

```bash
# 1. Move this folder to your workspace parent directory:
mv manuview-desktop ../manuview-desktop
cd ../manuview-desktop

# 2. Initialize Git:
git init -b main
git add .
git commit -m "feat: initial commit of manuview-desktop standalone app"

# 3. Add your GitHub remote and push:
git remote add origin https://github.com/khatiwada-bishal/manuview-desktop.git
git push -u origin main
```

---

## Project Structure

```
manuview-desktop/
├── src-tauri/              # Rust Tauri shell, window config, permissions, icons
│   ├── src/main.rs         # Tauri application bootstrap
│   ├── src/lib.rs          # Tauri commands and plugins
│   ├── tauri.conf.json     # Window, bundle, and capability configurations
│   └── Cargo.toml          # Rust dependencies
├── src/                    # Frontend UI (React + Tailwind)
│   ├── components/         # DesktopDashboard, Sidebar, Header, Modals
│   ├── lib/                # Native OS desktop dialog bridge & LLM connection hooks
│   ├── App.tsx             # Main desktop application component
│   ├── main.tsx            # React DOM entry
│   └── index.css           # Global dark theme and aura glassmorphic styling
├── vite.config.ts          # Vite build configuration optimized for Tauri
├── tailwind.config.js      # Tailwind theme configuration
└── package.json            # Scripts and npm dependencies
```

## License

MIT
