
# 时光信笺

## 简介
“时光信笺”是一款简单易用、自由灵活、扩展性强、本地运行且无需联网的照片水印与边框工具。

## 由来
灵感源自网络上的“埋信仪式”——“寻一块地，埋一封信，寄给若干年后的自己”。将此刻心绪悉心封存，静待时光开启。
照片亦是如此。如果说书信是写给未来的文字独白，那么照片便是赠予岁月的无声诗篇。
愿我们都能将转瞬即逝的心绪，凝成一封封穿越时光的无声信笺。待到未来的某日，被你亲手拆开，与曾经的自己，温柔重逢，再忆彼时。

## 技术栈
前端：
后端：

## 优势
① 简单易用，操作逻辑与常见画图软件基本完全一致。<br>
② 扩展性强，自由自定义文本、自定义LOGO、自定义字体、自定义模板预设。<br>
③ 迁移性强，自由导出与导入模板预设、应用全局设置。<br>
④ 本地运行、无需联网，保护隐私安全。<br>

## 功能演示
```shell
bilibili：https://space.bilibili.com/492789742
```

## 常见问题



## 打包与源码保护（electron-builder-encryptor）

打包时（`npm run electron:build`）通过 [electron-builder-encryptor](https://github.com/dusionlike/electron-builder-encryptor) 的 `afterPack` 钩子对产物进行加密保护：

| 内容 | 保护方式 |
| --- | --- |
| 主进程（`electron/**/*`） | `scripts/bundle-main.js` 用 esbuild 把全部内部模块打包为**单个** bundle，再由 bytenode 编译为**单个** `main.jsc` 字节码；worker 同理打包为单个 `worker.jsc`，preload 为单个 `index.jsc`。`app.asar` 中应用代码仅 3 个字节码文件 + 3 个引导加载器 |
| 渲染进程（`dist/`，vite 产物） | AES-256-CBC 加密压缩为单个 `resources/renderer.pkg`，从 `app.asar` 中移除 |
| `app.asar` 完整性 | 生成 `resources/app.yml`（MD5 校验），运行时检测篡改即退出 |

- 加密配置**唯一来源**为 `encryptor.config.js`（`key`、`protocol`、`renderer.entry/output`）；`scripts/bundle-main.js` 构建时读取该配置，通过 esbuild `define` 注入到 `renderer-loader`，密钥无需在多处维护。
- bundle 为构建中间产物，输出到 `node_modules/.cache/electron-bundle/`（不进源码目录、不进安装包），只有编译后的 `main.jsc` / `worker.jsc` / `index.jsc` 随包分发。
- `afterPack` 钩子实现见 `scripts/encryptor-afterpack.js`。
- 生产环境渲染进程的解密与加载由应用自身完成：`electron/runtime/renderer-loader.js`（随主进程一起打进 `main.jsc`）负责解密 `renderer.pkg`、注册 `myclient://` 协议并校验 `app.asar` 完整性；加载地址见 `electron/main.js` 的 `loadAppContent`（`myclient://apps/index.html`）。打包产物不依赖构建机环境，可任意机器运行。

### 打包命令

```shell
# 1. 开发：常规启动
npm run electron:serve

# 2. 打包（自动依次执行 vite build → bytenode 编译 → electron-builder + 加密）
npm run electron:build

# 3. 指定平台打包（electron-builder 默认按当前系统出包，亦可显式指定）
npm run electron:build:win
npm run electron:build:linux
npm run electron:build:mac
```

### 跨平台适配与构建

支持 Windows / macOS / Linux。平台差异已在主进程内按 `process.platform` 适配：

| 差异点 | 适配方式 |
| --- | --- |
| 数据目录（模板/文本/图片资源、设置、窗口状态） | 开发环境与 Windows 打包沿用工作目录下 `data/`；macOS / Linux 打包使用系统标准用户数据目录（`~/Library/Application Support/时光信笺/data`、`~/.config/时光信笺/data`），因 Finder/AppImage/deb 场景下安装位置不可写 |
| 应用图标 | Windows 用 `favicon.ico`，macOS / Linux 用 `favicon.png`（icns 由 electron-builder 自动生成） |
| 托盘 | Windows / Linux：常驻菜单 + 左键切换窗口显隐；macOS：左键切换窗口、右键弹菜单（macOS 常驻菜单会吞掉点击事件） |
| 应用菜单 | macOS 追加 `appMenu` / `editMenu` / `windowMenu` role，否则 Cmd+Q 退出、输入框 Cmd+C/V 复制粘贴不生效 |
| 打包布局 | macOS 资源位于 `<App>.app/Contents/Resources`，`renderer.pkg` / `app.asar` 校验的读取路径按平台处理（`renderer-loader.js`、`encryptor-afterpack.js`） |
| exiftool 原生依赖 | `afterPack` 重打包时 unpack 规则覆盖全平台二进制包（`exiftool-vendored.*`） |

**构建注意事项**：

- 主进程字节码（bytenode `.jsc`）与构建机的 Electron V8 版本、CPU 架构绑定，**产物不跨平台复用**：Windows 安装包在 Windows 上构建，macOS 包必须在 macOS 上构建，Linux 包建议在 Linux 上构建（仓库提供 `.github/workflows/build.yml` 三平台 CI 矩阵，打 tag 自动出包）。
- macOS 产物未做代码签名（`mac.identity: null`），首次打开需右键 → 打开，或在"系统设置 → 隐私与安全性"中放行。
- Linux 托盘依赖系统 `libappindicator`（Ubuntu 22.04+ 需自行安装 `libayatana-appindicator3-1`）；部分桌面环境不触发托盘 click 事件，菜单仍可用。
- Linux 目标选用 AppImage / tar.gz（免 wine、免 dpkg 工具链）；如需 deb / rpm 建议在 Linux 构建机上追加 target。

### 注意事项

- 修改主进程源码（`electron/**/*.js`）或加密配置（`encryptor.config.js`）后重新打包，`electron:build` 会自动执行 bundle（含配置注入）→ 编译 → 打包加密，无需手动操作。
- `electron/main-loader.js`、`electron/preload/index-loader.js`、`electron/thread/worker-loader.js` 是运行时引导加载器，保持明文，不参与字节码编译。
- 打包后 `app.asar` 内应用代码文件极少（3 个字节码 + 3 个引导加载器 + 图标），其余为 `node_modules` 依赖。
- 加密密钥位于 `encryptor.config.js`，请妥善保管；泄露密钥即可解密 `renderer.pkg`。
- `afterPack` 会在打包后把 encryptor 注入主进程的“构建机绝对路径”运行时链（`main-c.jsc`）移除，并恢复 `main-loader.js` 引导加载器，确保安装包可在任意机器运行；同时按最终 `app.asar` 重新生成 `app.yml` 校验文件。

## 更新日志
