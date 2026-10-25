[简体中文](README.md) | English

<div align="center">

<img src="electron/resources/favicon.png" width="110" alt="Time Letter"/>

# Time Letter (时光信笺)

**A fully local, offline photo watermark & border tool — seal the memories of this moment into letters sent to your future self**

[![Gitee Star](https://gitee.com/geqian618/time-letter/badge/star.svg?theme=dark)](https://gitee.com/geqian618/time-letter/stargazers)
[![GitHub Star](https://img.shields.io/github/stars/geqian618/time-letter?style=flat&logo=github&label=Star)](https://github.com/geqian618/time-letter/stargazers)
[![Version](https://img.shields.io/badge/version-v2.0.0-blue)](https://github.com/geqian618/time-letter/releases)
[![Build](https://github.com/geqian618/time-letter/actions/workflows/build.yml/badge.svg)](https://github.com/geqian618/time-letter/actions/workflows/build.yml)
[![Electron](https://img.shields.io/badge/Electron-22.3-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](#-cross-platform-build-notes)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📑 Table of Contents

- [📖 Introduction](#-introduction)
- [✨ Features](#-features)
- [🖼️ Screenshots](#-screenshots)
- [🎬 Demo](#-demo)
- [🛠️ Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [📥 Download & Install](#-download--install)
- [🚀 Getting Started (Local Development)](#-getting-started-local-development)
- [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
- [📦 Packaging & Cross-Platform Build](#-packaging--cross-platform-build)
- [❓ FAQ](#-faq)
- [📜 Changelog](#-changelog)
- [🤝 Contributing](#-contributing)
- [💝 Support the Author](#-support-the-author)
- [📄 License](#-license)

---

## 📖 Introduction

"Time Letter" is a simple, flexible and highly extensible photo watermark & border tool that **runs entirely locally, no internet connection required**.

> Inspired by the "letter-burying ritual" from the internet — "Find a spot, bury a letter, and mail it to yourself years from now." Carefully seal away your present feelings, waiting for time to open them.
>
> Photos are the same. If letters are written monologues to the future, then photos are silent poems gifted to the years.
>
> May we all turn fleeting emotions into silent letters traveling through time. One day in the future, opened by your own hands — a gentle reunion with your former self, remembering those moments.

### ✨ Core Advantages

- 🖱️ **Simple to use** — interaction logic is basically identical to common drawing software, zero learning curve
- 🧩 **Highly extensible** — freely customize text, logos, fonts and template presets
- 📦 **Easy to migrate** — freely export / import template presets and global app settings
- 🔒 **Fully local** — no internet required, collects no data, privacy-safe

## ✨ Features

### 🖋️ Watermarks & Typography

- **Text watermark**: fully adjustable font, size, weight, line height, letter spacing, column width, color, shadow, rotation, direction (horizontal / vertical), opacity and more, with multi-line text support
- **EXIF metadata watermark**: automatically reads camera brand, body, lens, focal length, ISO, shutter, aperture, shooting time and filename, and lays them out as a watermark in one click — with equivalent focal length conversion and custom date formats
- **Logo watermark**: 16 built-in camera / phone brand logos (Canon, Sony, Nikon, Fujifilm, Huawei, Xiaomi, DJI, Insta360, etc.), custom image watermarks also supported
- **Date watermark**: one-click date and date-time templates

### 🖼️ Canvas & Borders

- **Three border types**: general (solid color), blur (extended blurred photo edges), and custom image — each side independently controllable in width and color
- **Photo properties**: rounded corners, shadow (color / offset / blur), opacity, scale, etc.
- **Professional canvas experience**: layer management, free dragging, property anchor, focal zoom, adjustable move step, canvas alignment guides & auto-snapping — interactions consistent with common drawing software
- **Batch processing**: multiple canvases edited in parallel; the bottom preview panel supports landscape / portrait filtering, marquee multi-select and quick paging

### 💾 Templates & Libraries

- **Template presets**: save, rename and enable templates; apply configurations to multiple images via "sync by value / sync by ratio"
- **Text library**: centrally manage frequently used watermark texts
- **Font library**: import custom fonts with automatic hot-reloading via directory watching (ships with the "ZiKu XingQiu FeiYangTi" font)
- **Image library**: the separate-window "Image Manager" for centralized asset management

### 📤 Batch Export

- **Multi-threaded export**: adjustable thread count, processed in Worker threads without blocking the UI, cancellable export tasks
- **Format support**: JPG / JPEG / PNG / WEBP / GIF / AVIF — keep the original format or specify one, with adjustable quality
- **Output size**: best / fixed width / fixed height / adaptive — four modes
- **File naming**: original name / index / random, with custom prefix and suffix
- **Metadata write-back**: optionally sync EXIF metadata into exported images

### 🧰 App Experience

- 🌗 Dark / light / follow-system themes
- 🌐 Chinese / English bilingual UI, following the system language
- 🗂️ Image Manager (separate window) for centralized asset management
- 📐 Collapsible panels on all sides, window position & size memory
- 🖱️ Drag-and-drop upload, image lazy loading, system tray, native menus & shortcuts
- 🔒 Fully local, no internet required, collects no data — privacy-safe

## 🖼️ Screenshots

<div align="center">
  <img src="src/assets/images/application.webp" width="100%" alt="Time Letter main interface"/>
</div>

*Main workspace: presets & image library on the left, canvas editor in the center, properties panel on the right, and the image preview bar at the bottom*

## 🎬 Demo

Video demos and tutorials on Bilibili:

**[▶️ Watch here: https://space.bilibili.com/492789742](https://space.bilibili.com/492789742)**

## 🛠️ Tech Stack

| Category | Technology                                                                                  |
| --- |---------------------------------------------------------------------------------------------|
| Frontend | Vue 3 + Vite 5 + JavaScript                                                                 |
| State management | Pinia + pinia-plugin-persistedstate (local persistence)                                     |
| UI components | Element Plus (auto on-demand import via unplugin)                                           |
| Internationalization | vue-i18n (Chinese / English)                                                                |
| Desktop | Electron 22 + electron-builder                                                              |
| Image processing | sharp (main-process export) + @napi-rs/canvas (Node-side canvas rendering) + Worker threads |
| Metadata | exiftool-vendored / exif (EXIF reading & write-back)                                        |
| File watching | chokidar (hot reload for image / font libraries)                                            |

## 📁 Project Structure

```
time-letter
├── electron/                     # Electron main process
│   ├── main.js                   # Entry point (windows / menus / tray / IPC)
│   ├── preload/                  # Preload scripts (contextBridge IPC channels)
│   ├── canvas/                   # Node-side canvas rendering
│   ├── components/               # Native components: app menu / context menu / tray / file watchers / shortcuts / secondary window
│   ├── thread/                   # Worker threads: image export processing
│   ├── locales/                  # Main-process i18n (native menus, etc.)
│   ├── utils/                    # sharp image processing / EXIF / font management / paths
│   └── resources/                # Built-in assets: app icon, brand logos, bundled fonts
├── scripts/                      # Build scripts
│   ├── bundle-main.js            # esbuild bundling for main process / worker / preload
│   └── nsis/                     # NSIS installer script fragment
├── src/                          # Renderer process (Vue 3)
│   ├── views/                    # Pages (main workspace / image manager extension)
│   ├── components/               # Panel components & dialogs
│   ├── canvas/                   # Canvas editor (renderer side)
│   ├── object/                   # Domain objects: CanvasManager, Configuration, etc.
│   ├── stores/                   # Pinia stores (canvases / templates / text resources / settings)
│   ├── composables/              # Composables
│   ├── directive/                # Custom directives (drag sort, input focus)
│   ├── locales/                  # Renderer-side i18n
│   ├── config/                   # Default configs (color schemes, default project settings)
│   └── utils/                    # Utilities (fonts / notifications / throttle / deep clone, etc.)
├── electron-builder.json         # Packaging config (Windows: NSIS/zip, macOS: dmg/zip, Linux: AppImage/tar.gz)
├── vite.config.js                # Vite build config
└── package.json
```

## 📥 Download & Install

Download the latest release from [GitHub Releases](https://github.com/geqian618/time-letter/releases) or [Gitee Releases](https://gitee.com/geqian618/time-letter/releases) (installers for all three platforms are built automatically by GitHub Actions):

| Package | Description |
| --- | --- |
| `Time Letter Setup x.x.x.exe` | Windows installer (NSIS), double-click to install, custom install directory supported |
| `Time Letter x.x.x.zip` | Windows portable version, extract and run |
| `time-letter-x.x.x-x64.dmg / -arm64.dmg` | macOS disk image (Intel / Apple Silicon, must be built on macOS) |
| `time-letter-x.x.x-x64.AppImage / -x64.tar.gz` | Linux packages (AppImage build requires Windows Developer Mode / admin; deb/rpm must be built on Linux) |

## 🚀 Getting Started (Local Development)

### Requirements

| Dependency | Version |
| --- | --- |
| Node.js | ≥ 18 (LTS recommended, verified on Node 20 / 22) |
| npm | ≥ 9 (or pnpm / yarn) |
| OS | Windows / macOS / Linux all work for development; Windows & Linux artifacts can be built on Windows, macOS artifacts must be built on macOS |

### Development & Build

```shell
# 1. Clone the repository (GitHub is the primary repo; the Gitee mirror also works)
git clone https://github.com/geqian618/time-letter.git
# git clone https://gitee.com/geqian618/time-letter.git
cd time-letter

# 2. Install dependencies
npm install

# 3. Start development mode (Vite + Electron, hot reload for the renderer)
npm run electron:serve

# 4. Type check / lint
npm run type-check
npm run lint

# 5. Package (vite build + electron-builder, defaults to the current OS)
npm run electron:build

# 6. Or target a platform explicitly (defaults to the current OS)
npm run electron:build:win
npm run electron:build:linux
npm run electron:build:mac
```

> Build output goes to the `output/` directory.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/⌘ + I` | Import images |
| `Ctrl/⌘ + O` | Export images |
| `Ctrl/⌘ + T` | Export images |
| `Ctrl/⌘ + Alt + S` | Open preferences |
| `Ctrl/⌘ + D` | Remove image |
| `Ctrl/⌘ + Alt + D` | Delete image |
| `Ctrl/⌘ + L` | Clear canvas |
| `Ctrl/⌘ + R` | Reset canvas |

## 📦 Packaging & Cross-Platform Build

### Packaging Commands

```shell
# 1. Development: regular startup
npm run electron:serve

# 2. Package (runs automatically: vite build → electron-builder)
npm run electron:build

# 3. Target a platform explicitly (electron-builder defaults to the current OS)
npm run electron:build:win
npm run electron:build:linux
npm run electron:build:mac
```

### 🌍 Cross-Platform Build Notes

Windows / macOS / Linux are all supported; platform differences are adapted in the main process via `process.platform`:

| Difference | Adaptation |
| --- | --- |
| Data directory (templates / text / image & font resources, browser data) | Dev and packaged Windows keep `data/` next to the app; packaged macOS / Linux use the standard user data dir (`~/Library/Application Support/Time Letter/data`, `~/.config/Time Letter/data`) because Finder / AppImage / deb install locations are not writable. The Chromium profile and caches live in `data/browser/` |
| Config directory (settings, window state) | Dev and packaged Windows use `config/` in the install directory (kept by default on overwrite install); packaged macOS / Linux use `config/` under the standard per-user dir because install locations may be read-only |
| App icon | Windows uses `favicon.ico`; macOS / Linux use `favicon.png` (icns is generated by electron-builder) |
| Tray | Windows / Linux: persistent menu + left-click toggles the window; macOS: left-click toggles the window, right-click opens the menu (a persistent menu would swallow the click event on macOS) |
| Application menu | macOS appends the `appMenu` / `editMenu` / `windowMenu` roles — without them Cmd+Q and clipboard shortcuts (Cmd+C/V) do not work |
| exiftool native deps | asar unpack rules cover vendor packages of all platforms (`exiftool-vendored.*`) |

Key points:

- macOS artifacts are unsigned (`mac.identity: null`); on first launch right-click → Open, or allow the app in System Settings → Privacy & Security.
- The Linux tray requires `libappindicator` (`libayatana-appindicator3-1` on Ubuntu 22.04+); some desktop environments never fire the tray click event — the menu still works.
- Linux targets are AppImage / tar.gz (no wine / dpkg toolchain needed); add deb / rpm targets on a Linux build machine if needed.

## ❓ FAQ

<details>
<summary><b>1. Which image formats are supported?</b></summary>

JPG / JPEG / PNG / WEBP / GIF / AVIF import and export. On export you can keep the original format or specify one.
</details>

<details>
<summary><b>2. Does it need internet? Does it collect my data?</b></summary>

No internet needed. All image processing, watermark rendering and exporting happen locally; nothing is collected or uploaded.
</details>

<details>
<summary><b>3. Which operating systems are supported?</b></summary>

Current releases target Windows (NSIS installer + portable zip), with macOS (dmg + zip, Intel / Apple Silicon) and Linux (AppImage + tar.gz) targets configured:

- The main-process code is cross-platform ready (data directory, icons, tray / menu behavior), so builds work out of the box on each platform.
- Due to electron-builder limitations, macOS artifacts must be built on macOS (without a signing certificate the app runs locally, but distribution requires handling Gatekeeper notarization yourself); Linux AppImage / tar.gz can be cross-built directly on Windows.
- For macOS builds, use the bundled GitHub Actions workflow (`.github/workflows/build.yml`): push a `v*` tag or dispatch manually to produce installers for all three platforms; alternatively run `npm run electron:build` directly on any Mac.
- Building the Linux AppImage on Windows requires Developer Mode or an elevated terminal (symlink privilege); deb / rpm targets depend on fpm and must be built on Linux / macOS (append them to `linux.target` in `electron-builder.json`).
- The Windows portable build stores data next to the executable (`data/`) and settings/window state in `config/`; macOS / Linux use the standard per-user data directory.
</details>

<details>
<summary><b>4. Where are templates and settings stored?</b></summary>

All stored locally. The data directory contains `templates.json` (presets), `text-resources.json`, `resources/` (image library), `fonts/` (font library) and `browser/` (Chromium profile and caches); app settings go to `config/settings.json` and window position/size to `config/main-window-state.json` in the install directory (standard per-user config dir on packaged macOS / Linux). The data directory can be migrated/backed up as a whole. The menu also offers import / export for template presets and global settings.
</details>

<details>
<summary><b>5. How do I use my own fonts?</b></summary>

Add them via "Extensions → Font Library → Import Fonts", or drop font files directly into the font resource directory — the app watches it and hot-loads new fonts automatically.
</details>

## 📜 Changelog

> See the full commit history on [GitHub](https://github.com/geqian618/time-letter/commits) / [Gitee](https://gitee.com/geqian618/time-letter/commits).

### v2.0.0 (2026-08 · Current)

**🌟 Added**

- Dark / light / follow-system theme switching
- Chinese / English bilingual UI, following the system language
- "Image Manager" extension tool in a separate window for centralized asset management
- Multi-line text watermark
- Marquee multi-selection of elements
- Canvas alignment guides & auto-snapping for precise element movement
- Focal-point zoom (zoom at the mouse position), replacing the default center zoom
- GIF & AVIF image format support
- Collapsible left/right/bottom panels and bottom toolbar zoom for freer layouts
- "Reset all settings" feature

**⚡ Improved**

- Bottom preview bar now uses thumbnails, greatly reducing loading latency
- Linked-list-based image navigation with jump-to-first / jump-to-last
- Image switching transitions and first-load performance
- Refactored data persistence (Pinia persistence plugin)
- Index.vue code reorganization

**🐛 Fixed**

- Memory leaks
- Subsequent exports not working after an export was cancelled
- Bottom panel unable to expand after collapsing the side panels
- Proxy class exceptions

### v1.6.0 (2026-07)

- 🆕 Introduced the Skia graphics renderer (skia-canvas), upgrading Node-side canvas rendering
- 🆕 Custom image borders: upload any image as border material
- 🆕 PNG image metadata reading
- 🆕 Select-all button in the preview bar
- 🆕 Drag-and-drop upload hint
- 🐛 Fixed a rendering exception caused by async calls when switching images too quickly

### v1.5.0 (2026-05 ~ 2026-06)

- 🆕 App configuration import/export for easy machine migration
- 🆕 Deleted files now move to the system recycle bin to prevent accidental loss
- 🆕 Custom formatting for the shooting-date metadata
- 🆕 Imported photo count display
- ⚡ Unprocessed images are now copied directly on export — much faster
- 🐛 Fixed property value precision loss

### v1.4.0 (2026-02 ~ 2026-04)

- 🆕 Template preset import/export
- 🆕 SVG file import as watermark material
- 🆕 Edit filenames directly in the metadata panel
- 🆕 Single-instance enforcement to avoid duplicate app instances
- 🆕 Preset export error prompts
- ⚡ Shortcuts now trigger only when the window is focused, avoiding conflicts with system shortcuts
- ⚡ Default user data storage location; improved image library layout and About page
- 🐛 Fixed Ctrl + uppercase A not selecting all in text editing, and brief image distortion when changing border values numerically

### v1.3.0 (2026-01)

- ♻️ Removed fabric.js and rebuilt the entire project on HTML5 Canvas
- 🆕 Adaptive width/height for exported images
- 🐛 Fixed web/node canvas rendering inconsistency, template-sync custom text not applying, and space input not working

### v1.2.0 (2025-11 ~ 2025-12)

- 🆕 Font file import & font offset correction settings
- 🆕 Blur border
- 🆕 Preview image zoom; hover to show image info
- 🆕 Toggle for syncing original image metadata on export
- 🆕 Space + mouse-drag canvas panning; drag-and-drop image upload
- 🆕 Export file renaming (prefix / suffix); global canvas scale config
- 🆕 Arrow-key element movement; custom scrollbar styles
- ⚡ Event performance optimization, better text editing experience, large-scale code restructuring

### v1.1.0 (2025-09 ~ 2025-10)

- 🆕 Equivalent focal length conversion & custom crop factor
- 🆕 Download thread count setting & cancellable export tasks
- 🆕 Previous / next image navigation menu; vertical text layout
- ⚡ Settings window tab-switching experience, slider component extension, UI polish

### v1.0.0 (2025-08 · First Release)

- 🎉 Project launch: photo import & original preview, adaptive watermark layout
- 🆕 Text / date / EXIF metadata watermarks with drag positioning & sync
- 🆕 Initial template preset feature
- 🆕 Image / text shadows and layer control
- 🆕 Export global config, size options, font style & weight settings
- 🆕 About page, config-sync positioning modes

## 🤝 Contributing

Issues and Pull Requests are welcome:

```shell
# 1. Fork this repository and clone it locally
# 2. Create a feature branch
git checkout -b feature/your-feature

# 3. Commit your changes
git commit -m "feat: add your feature"

# 4. Push and open a Pull Request
git push origin feature/your-feature
```

## 💝 Support the Author

If this project helps you, follow me on [Bilibili](https://space.bilibili.com/492789742) or buy me a coffee~

<div align="center">
  <img src="src/assets/images/qr-code.jpg" width="220" alt="Contact"/>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="src/assets/images/reward-code.jpg" width="220" alt="Donate"/>
</div>

## 📄 License

This project is open-sourced under the [MIT License](LICENSE) — Copyright © 2025 搁浅.

You are free to use, copy, modify, merge, publish, and distribute this software, including for commercial purposes, as long as the original copyright notice and this permission notice are retained in all copies or substantial portions of the Software. The software is provided "as is", without warranty of any kind.

---

<div align="center">

**May every photo become a letter sent to the future.** ⏳

<sub>Made with ❤️ by 搁浅</sub>

</div>
