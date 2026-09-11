# ManuView Desktop - Build & Distribution Guide

ManuView Desktop is built on **Tauri v2** and compiled into native, lightweight executables for macOS (Universal: Apple Silicon & Intel) and Windows (x64 NSIS `.exe` & `.msi`).

---

## 1. macOS Installers (Apple Silicon & Intel)

### Local Universal Build (Built & Ready)
The macOS installer is already built and ready in the [`installers/`](./installers/) directory:
- **Universal DMG Installer**: `installers/ManuView_0.1.0_macOS_Universal.dmg`
- **Portable ZIP Archive**: `installers/ManuView_0.1.0_macOS_Universal.zip`

### Architecture Verification
The binary contains both slices compiled as a single universal Mach-O executable:
```bash
file src-tauri/target/universal-apple-darwin/release/bundle/macos/ManuView.app/Contents/MacOS/manuview-desktop
```
Output:
```
Mach-O universal binary with 2 architectures: [x86_64:Mach-O 64-bit executable x86_64] [arm64]
```
- **Apple Silicon Macs (M1/M2/M3/M4)**: Runs the native `arm64` slice with hardware acceleration.
- **Intel Macs**: Runs the native `x86_64` slice with zero emulation.

### Rebuilding Locally on macOS
Run the packaging script:
```bash
npm run desktop:build:mac
```
Or directly:
```bash
./scripts/build-mac.sh
```

---

## 2. Windows Installers (`.exe` NSIS & `.msi`)

### Option A: Automated via GitHub Actions (Recommended)
An automated release pipeline has been configured in [`.github/workflows/release.yml`](./.github/workflows/release.yml).

1. Push your changes and tag a release:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
   Or trigger manually in GitHub under **Actions &rarr; Release Multi-Platform Installers &rarr; Run workflow**.
2. GitHub's `windows-latest` runner will automatically:
   - Compile the Windows binary with WebView2.
   - Package `ManuView_0.1.0_x64-setup.exe` (NSIS installer).
   - Package `ManuView_0.1.0_x64_en-US.msi` (Windows Installer).
   - Attach them to the GitHub Release for direct download.

### Option B: Building Locally on a Windows PC
1. Prerequisites:
   - Node.js (v18+)
   - Rust toolchain (`rustup`)
   - Visual Studio C++ Build Tools
   - WebView2 Runtime (pre-installed on Windows 10/11)
2. Run:
   ```bash
   npm install
   npm run desktop:build
   ```
3. Artifacts will be located in:
   - `src-tauri/target/release/bundle/nsis/ManuView_0.1.0_x64-setup.exe`
   - `src-tauri/target/release/bundle/msi/ManuView_0.1.0_x64_en-US.msi`

