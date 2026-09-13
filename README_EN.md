[简体中文](README.md) | English

<div align="center">

<img src="electron/resources/favicon.png" width="110" alt="Time Letter"/>

# Time Letter (时光信笺)

**A fully local, offline photo watermark & border tool — seal this moment into letters that travel through time**

[![Gitee Star](https://gitee.com/geqian618/time-letter/badge/star.svg?theme=dark)](https://gitee.com/geqian618/time-letter/stargazers)
[![Version](https://img.shields.io/badge/version-v2.0.0-blue)](https://gitee.com/geqian618/time-letter/releases)
[![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D6?logo=windows95&logoColor=white)](https://github.com/electron/electron)

</div>

---

## 📖 Introduction

"Time Letter" is a simple, flexible and highly extensible photo watermark & border tool that **runs entirely locally, no internet connection required**.

> Inspired by the "letter-burying ritual" from the internet — "Find a spot, bury a letter, and mail it to yourself years from now." Carefully seal away your present feelings, waiting for time to open them.
>
> Photos are the same. If letters are written monologues to the future, then photos are silent poems gifted to the years.
>
> May we all turn fleeting emotions into silent letters traveling through time. One day in the future, opened by your own hands — a gentle reunion with your former self, remembering those moments.

## ✨ Features

### 🖋️ Watermarks & Typography

- **Text watermark**: fully adjustable font, size, weight, line height, letter spacing, column width, color, shadow, rotation, direction (horizontal / vertical), opacity and more
- **EXIF metadata watermark**: automatically reads camera brand, body, lens, focal length, ISO, shutter, aperture, shooting time and filename, and lays them out as a watermark in one click — with equivalent focal length conversion and custom date formats
- **Logo watermark**: 16 built-in camera / phone brand logos (Canon, Sony, Nikon, Fujifilm, Huawei, Xiaomi, DJI, Insta360, etc.), custom image watermarks also supported
- **Date watermark**: one-click date and date-time templates

### 🖼️ Canvas & Borders

- **Three border types**: general (solid color), blur (extended blurred photo edges), and custom image — each side independently controllable in width and color
- **Photo properties**: rounded corners, shadow (color / offset / blur), opacity, scale, etc.
- **Professional canvas experience**: layer management, free dragging, property anchor, focal zoom, adjustable move step — interactions consistent with common drawing software
- **Batch processing**: multiple canvases edited in parallel; the bottom preview panel supports landscape / portrait filtering, multi-select and quick paging

### 💾 Templates & Libraries

- **Template presets**: save, rename and enable templates; apply configurations to multiple images via "sync by value / sync by ratio"
- **Text library**: centrally manage frequently used watermark texts
- **Font library**: import custom fonts with automatic hot-reloading via directory watching (ships with the "ZiKu XingQiu FeiYangTi" font)

### 🚀 Batch Export

- **Multi-threaded export**: adjustable thread count, processed in Worker threads without blocking the UI
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

## 🎬 Demo

Video demos and tutorials on Bilibili:

**[▶️ Watch here: https://space.bilibili.com/492789742](https://space.bilibili.com/492789742)**

## 📥 Download & Install

Download the latest release from [Gitee Releases](https://gitee.com/geqian618/time-letter/releases):

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
| Node.js | ≥ 18 (LTS recommended, verified on Node 22) |
| npm | ≥ 9 (or pnpm / yarn) |
| OS | Windows / macOS / Linux all work for development; Windows & Linux artifacts can be built on Windows, macOS artifacts must be built on macOS |

### Development & Build

```shell
# 1. Clone the repository
git clone https://gitee.com/geqian618/time-letter.git
cd time-letter

# 2. Install dependencies
npm install

# 3. Start development mode (Vite + Electron, hot reload for the renderer)
npm run electron:serve

# 4. Type check / lint
npm run type-check
npm run lint

# 5. Package (runs automatically: vite build → main-process bundle → bytenode compile → electron-builder + encryption)
npm run electron:build
```

> Build output goes to the `electron_dist/` directory.

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

## 🛠️ Tech Stack

| Category | Technology |
| --- | --- |
| Frontend | Vue 3 + Vite 5 + TypeScript |
| State management | Pinia + pinia-plugin-persistedstate (local persistence) |
| UI components | Element Plus (auto on-demand import via unplugin) |
| Internationalization | vue-i18n (Chinese / English) |
| Desktop | Electron 29 + electron-builder |
| Image processing | sharp (main-process export) + @napi-rs/canvas (Node-side canvas rendering) + Worker threads |
| Metadata | exiftool-vendored / exif (EXIF reading & write-back) |
| File watching | chokidar (hot reload for image / font libraries) |
| Source protection | esbuild (bundle) + bytenode (V8 bytecode) + electron-builder-encryptor (AES-256) |

## 📁 Project Structure

```
time-letter
├── electron/                     # Electron main process
│   ├── main.js                   # Entry point (windows / menus / tray / IPC)
│   ├── main-loader.js            # Production bootstrap loader (loads main.jsc)
│   ├── preload/                  # Preload scripts (contextBridge IPC channels)
│   ├── canvas/                   # Node-side canvas rendering
│   ├── components/               # Native components: app menu / context menu / tray / file watchers / shortcuts / secondary window
│   ├── thread/                   # Worker threads: image export processing
│   ├── runtime/                  # Production renderer decryption loader (renderer-loader)
│   ├── locales/                  # Main-process i18n (native menus, etc.)
│   ├── utils/                    # sharp image processing / EXIF / font management / paths
│   └── resources/                # Built-in assets: app icon, brand logos, bundled fonts
├── scripts/                      # Build scripts
│   ├── bundle-main.js            # esbuild bundling for main process / worker / preload
│   ├── compile.js                # bytenode compilation to .jsc bytecode
│   └── encryptor-afterpack.js    # afterPack hook: encryption & integrity finalization
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
├── encryptor.config.js           # electron-builder-encryptor config (encryption key)
├── electron-builder.json         # Packaging config (Windows: NSIS/zip, macOS: dmg/zip, Linux: AppImage/deb/tar.gz)
├── vite.config.js                # Vite build config
└── package.json
```

## 🔐 Packaging & Source Protection (electron-builder-encryptor)

During packaging (`npm run electron:build`), artifacts are protected via the `afterPack` hook of [electron-builder-encryptor](https://github.com/dusionlike/electron-builder-encryptor):

| Content | Protection |
| --- | --- |
| Main process (`electron/**/*`) | `scripts/bundle-main.js` bundles all internal modules into a **single** esbuild bundle, then bytenode compiles it into a **single** `main.jsc` bytecode; the worker is likewise bundled into a single `worker.jsc`, and preload into `index.jsc`. App code inside `app.asar` is just 3 bytecode files + 3 bootstrap loaders |
| Renderer process (`dist/`, vite output) | AES-256-CBC encrypted and packed into a single `resources/renderer.pkg`, removed from `app.asar` |
| `app.asar` integrity | Generates `resources/app.yml` (MD5 checksum); the app exits at runtime if tampering is detected |

- The encryption config has a **single source of truth**: `encryptor.config.js` (`key`, `protocol`, `renderer.entry/output`); `scripts/bundle-main.js` reads it at build time and injects it into `renderer-loader` via esbuild `define`, so the key needs no maintenance in multiple places.
- Bundles are intermediate build artifacts output to `node_modules/.cache/electron-bundle/` (outside the source tree and the installer); only the compiled `main.jsc` / `worker.jsc` / `index.jsc` ship with the package.
- The `afterPack` hook implementation is in `scripts/encryptor-afterpack.js`.
- Decryption and loading of the renderer in production is done by the app itself: `electron/runtime/renderer-loader.js` (bundled into `main.jsc` with the main process) decrypts `renderer.pkg`, registers the `myclient://` protocol and verifies `app.asar` integrity; see `loadAppContent` in `electron/main.js` for the load URL (`myclient://apps/index.html`). Build artifacts do not depend on the build machine and can run anywhere.

### Notes

- After modifying main-process source (`electron/**/*.js`) or the encryption config (`encryptor.config.js`), simply repackage: `electron:build` automatically runs bundle (with config injection) → compile → package & encrypt — no manual steps needed.
- `electron/main-loader.js`, `electron/preload/index-loader.js` and `electron/thread/worker-loader.js` are runtime bootstrap loaders kept in plain text; they are not bytecode-compiled.
- After packaging, `app.asar` contains very few app files (3 bytecode files + 3 bootstrap loaders + icons); the rest is `node_modules` dependencies.
- The encryption key lives in `encryptor.config.js` — keep it safe; anyone with the key can decrypt `renderer.pkg`.
- `afterPack` removes the "build-machine absolute path" runtime chain (`main-c.jsc`) injected by encryptor and restores the `main-loader.js` bootstrap loader, ensuring the installer runs on any machine; it also regenerates the `app.yml` checksum based on the final `app.asar`.

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
- For macOS builds, use the bundled GitHub Actions workflow (`.github/workflows/release.yml`): push a `v*` tag or dispatch manually to produce installers for all three platforms; alternatively run `npm run electron:build` directly on any Mac.
- Building the Linux AppImage on Windows requires Developer Mode or an elevated terminal (symlink privilege); deb / rpm targets depend on fpm and must be built on Linux / macOS (append them to `linux.target` in `electron-builder.json`).
- The Windows portable build stores data next to the executable (`data/`); macOS / Linux use the standard per-user data directory.
</details>

<details>
<summary><b>4. Where are templates and settings stored?</b></summary>

All stored locally: template presets and text resources are persisted via the Pinia persistence plugin, app settings are saved to `settings.json`, and window position/size is recorded in `main-window-state.json`. Everything can be migrated/backed up with the app data directory. The menu also offers import / export for template presets and global settings.
</details>

<details>
<summary><b>5. How do I use my own fonts?</b></summary>

Add them via "Extensions → Font Library → Import Fonts", or drop font files directly into the font resource directory — the app watches it and hot-loads new fonts automatically.
</details>

<details>
<summary><b>6. Antivirus flags the app as risky?</b></summary>

The app uses V8 bytecode compilation and AES encryption for source protection, which some antivirus software may misjudge as risky. It contains no malicious code — simply add it to the whitelist / trust list.
</details>

## 📜 Changelog

> Version numbers below are organized from the project's commit history. See the full [commit history](https://gitee.com/geqian618/time-letter/commits).

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

No open-source license is attached to this project yet; all rights are reserved by default (Copyright © 搁浅). Free for personal learning; please contact the author before commercial use.
