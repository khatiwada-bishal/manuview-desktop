#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== Building ManuView Universal macOS App (Silicon + Intel) ==="
cd "$ROOT_DIR"
npx tauri build --target universal-apple-darwin --bundles app

echo "=== Packaging Drag-and-Drop DMG Installer ==="
mkdir -p "$ROOT_DIR/dist-dmg"
cp -R "$ROOT_DIR/src-tauri/target/universal-apple-darwin/release/bundle/macos/ManuView.app" "$ROOT_DIR/dist-dmg/"
ln -sf /Applications "$ROOT_DIR/dist-dmg/Applications"
mkdir -p "$ROOT_DIR/installers"
hdiutil create -volname "ManuView" -srcfolder "$ROOT_DIR/dist-dmg" -ov -format UDZO "$ROOT_DIR/installers/ManuView_0.1.0_macOS_Universal.dmg"
rm -rf "$ROOT_DIR/dist-dmg"

echo "=== Packaging Portable ZIP ==="
(cd "$ROOT_DIR/src-tauri/target/universal-apple-darwin/release/bundle/macos" && zip -r -q "$ROOT_DIR/installers/ManuView_0.1.0_macOS_Universal.zip" ManuView.app)

echo "=== Success ==="
echo "Installers generated in $ROOT_DIR/installers/:"
ls -lh "$ROOT_DIR/installers/"
