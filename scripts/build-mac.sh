#!/usr/bin/env bash
set -e

echo "=== Building ManuView Universal macOS App (Silicon + Intel) ==="
npx tauri build --target universal-apple-darwin --bundles app

echo "=== Packaging Drag-and-Drop DMG Installer ==="
mkdir -p dist-dmg
cp -R src-tauri/target/universal-apple-darwin/release/bundle/macos/ManuView.app dist-dmg/
ln -s /Applications dist-dmg/Applications
mkdir -p installers
hdiutil create -volname "ManuView" -srcfolder dist-dmg -ov -format UDZO installers/ManuView_0.1.0_macOS_Universal.dmg
rm -rf dist-dmg

echo "=== Packaging Portable ZIP ==="
(cd src-tauri/target/universal-apple-darwin/release/bundle/macos && zip -r -q ../../../../../installers/ManuView_0.1.0_macOS_Universal.zip ManuView.app)

echo "=== Success ==="
echo "Installers generated in installers/:"
ls -lh installers/
