# Pake Desktop Build Instructions

These are the exact `pake-cli` commands required to package the Dawnbook web app into native desktop applications for macOS, Windows, and Linux.

## Prerequisites
1. Node.js and Rust toolchain must be installed on the build machine.
2. `pake-cli` must be installed globally: `npm install -g pake-cli`.
3. The platform-specific icon files must be present in the `/build-icons/` directory.

## Build Commands

### macOS
Run the following command on a macOS machine to build a universal (`.dmg` / `.app`) binary:
```bash
pake https://dawnbook.belajarcarabelajar.com \
  --name "Dawnbook" \
  --icon "build-icons/app.icns" \
  --width 1200 \
  --height 780 \
  --hide-title-bar true \
  --multi-arch true
```

### Windows
Run the following command on a Windows machine to build the installer:
```powershell
pake https://dawnbook.belajarcarabelajar.com `
  --name "Dawnbook" `
  --icon "build-icons/app.ico" `
  --width 1200 `
  --height 780 `
  --hide-title-bar true `
  --multi-arch true
```

### Linux
Run the following command on a Linux machine (e.g., Ubuntu/Debian) to build the `.AppImage` / `.deb`:
```bash
pake https://dawnbook.belajarcarabelajar.com \
  --name "Dawnbook" \
  --icon "build-icons/app.png" \
  --width 1200 \
  --height 780 \
  --hide-title-bar true \
  --multi-arch true
```

## Post-Build Verification
1. **Launch**: Open the resulting package/executable. The app should launch and display the Dawnbook home page (`/`).
2. **Layout & Resize**: Resize the window down to 800x600. The layout should gracefully degrade to a single column or adjust padding, without creating any horizontal scrollbars on the main `body`.
3. **External Links**: Click any link that points to an external site (e.g., GitHub, social links). It should open in your system default browser rather than navigating the desktop app away from Dawnbook.
4. **Draggable Header**: With `--hide-title-bar true`, click and drag the top header bar (`.desktop-top-controls` or `.side-nav-header`). The desktop window should move freely. Try clicking interactive buttons inside the header; they should still trigger their respective actions.
