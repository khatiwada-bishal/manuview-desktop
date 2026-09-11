# ManuView app icons

White **Tinos Regular "M"** on Ink Navy `#111729` (22% corner radius). Tinos is the open-source (Apache 2.0) metric twin of Times New Roman, which matches the M in the ManuView app.
Design source: Figma → Codedrops → "ManuView — Logo & App Icons" (edit the components on the Logo page; every size updates).

## What's inside

| Folder | Use |
|---|---|
| `macos/icon.icns` | App icon for macOS 11–15 (Apple template: 824 px squircle, 100 px margins). Built from `AppIcon.iconset/`. |
| `macos/IconComposer/` | `background` + `foreground-M` layers (SVG and PNG) for Xcode 26's Icon Composer (macOS 26 Tahoe look). |
| `windows/icon.ico` | 16, 20, 24, 32, 40, 48, 64, 256 px. For Win32, Electron and Tauri. |
| `windows/msix/Assets/` | Full MSIX / Microsoft Store set: `Square44x44Logo` targetsize-16…256 (default, `altform-unplated`, `altform-lightunplated`) and scale-100…400, plus `SmallTile`, `Square150x150Logo`, `Wide310x150Logo`, `LargeTile`, `StoreLogo`, `SplashScreen` at scale-100/125/150/200/400. |
| `web/` | `favicon.ico` (16/32/48), `icon.svg`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-mask.png` (maskable), `manifest.webmanifest`, `head.html`. |
| `linux/hicolor/` | Copy to `/usr/share/icons/hicolor/` (sizes 16–512 and `scalable/`). Rename `manuview` to your app ID. |
| `electron/build/` | Drop-in `build/` folder for electron-builder: `icon.icns`, `icon.ico`, `icon.png`, `icons/`. |
| `tauri/src-tauri/icons/` | Drop-in Tauri bundle icons: `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.png`, `icon.icns`, `icon.ico`. `tauri/app-icon.png` is the 1024 px source. |

Sizes 32 px and below use a larger M (52% of the square) so the letter stays readable.

## Snippets

**Web** (`web/head.html`):
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
```

**MSIX** (`Package.appxmanifest`):
```xml
<Logo>Assets\StoreLogo.png</Logo>
<uap:VisualElements BackgroundColor="#111729"
    Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png" ...>
  <uap:DefaultTile Wide310x150Logo="Assets\Wide310x150Logo.png"
      Square71x71Logo="Assets\SmallTile.png" Square310x310Logo="Assets\LargeTile.png"/>
  <uap:SplashScreen Image="Assets\SplashScreen.png" BackgroundColor="#111729"/>
</uap:VisualElements>
```

**macOS**: to rebuild the .icns yourself, run `iconutil -c icns macos/AppIcon.iconset`.
