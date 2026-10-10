import useEventListener from "@/composables/common/useEventListener";
import {useProjectSettingsStore} from '@/stores/project-settings'

/**
 * 默认界面强调色（设计稿靛青）：
 * 亮色直接使用该值；暗色由下方派生逻辑自动提亮，保证暗色下的可读性
 */
export const DEFAULT_UI_ACCENT = '#3E63DD';

/* ---------- 颜色工具 ---------- */

const hexToRgb = (hex) => {
    let v = String(hex || '').trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(v)) v = v.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
    const n = parseInt(v, 16);
    return {r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255};
};

const clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));

/* 线性混合：t 为混入 target 的比例（0-1） */
const mix = (rgb, target, t) => ({
    r: clamp(rgb.r + (target.r - rgb.r) * t),
    g: clamp(rgb.g + (target.g - rgb.g) * t),
    b: clamp(rgb.b + (target.b - rgb.b) * t),
});

const toHex = ({r, g, b}) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

/* WCAG 相对亮度 */
const luminance = ({r, g, b}) => {
    const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const WHITE = {r: 255, g: 255, b: 255};
const BLACK = {r: 0, g: 0, b: 0};
/* 暗色表面基准（与 theme.css 的暗色面板/侧栏底色保持一致） */
const DARK_PANEL = {r: 23, g: 23, b: 26};   // #17171A
const DARK_NAV = {r: 19, g: 19, b: 22};     // #131316

/* 前景对比色：强调色过亮时换深色字，否则白字 */
const contrastOf = (rgb) => luminance(rgb) > 0.6 ? '#18181B' : '#FFFFFF';

/**
 * 由基础强调色派生亮 / 暗两套强调令牌。
 * 结果写入 html 行内样式（--acc-l-* / --acc-d-*），
 * theme.css 的亮色块引用 --acc-l-*、暗色块引用 --acc-d-*，
 * 实现「一个颜色驱动整套界面配色」，无需再为每个配色写一份主题表。
 */
const deriveAccents = (hex) => {
    const base = hexToRgb(hex) || hexToRgb(DEFAULT_UI_ACCENT);

    const light = {
        base: toHex(base),
        hover: toHex(mix(base, BLACK, 0.08)),
        active: toHex(mix(base, BLACK, 0.15)),
        soft: toHex(mix(base, WHITE, 0.88)),
        softHover: toHex(mix(base, WHITE, 0.80)),
        softBorder: toHex(mix(base, WHITE, 0.32)),
        softText: toHex(mix(base, BLACK, 0.10)),
        glow: `rgba(${base.r}, ${base.g}, ${base.b}, 0.30)`,
        ring: `rgba(${base.r}, ${base.g}, ${base.b}, 0.22)`,
        contrast: contrastOf(base),
        /* Element Plus 主色梯度：light-N = 混入 N/10 白，dark-2 = 混入 2/10 黑 */
        elLight3: toHex(mix(base, WHITE, 0.30)),
        elLight5: toHex(mix(base, WHITE, 0.50)),
        elLight7: toHex(mix(base, WHITE, 0.70)),
        elLight8: toHex(mix(base, WHITE, 0.80)),
        elLight9: toHex(mix(base, WHITE, 0.90)),
        elDark2: toHex(mix(base, BLACK, 0.20)),
    };

    /* 暗色：基础色先提亮一档再派生，软底往暗色面板底上混合 */
    const darkBase = mix(base, WHITE, 0.25);
    const dark = {
        base: toHex(darkBase),
        hover: toHex(mix(darkBase, WHITE, 0.12)),
        active: toHex(mix(darkBase, WHITE, 0.22)),
        soft: toHex(mix(darkBase, DARK_PANEL, 0.76)),
        softHover: toHex(mix(darkBase, DARK_PANEL, 0.68)),
        softBorder: toHex(mix(darkBase, DARK_PANEL, 0.45)),
        softText: toHex(mix(darkBase, WHITE, 0.30)),
        glow: `rgba(${darkBase.r}, ${darkBase.g}, ${darkBase.b}, 0.28)`,
        ring: `rgba(${darkBase.r}, ${darkBase.g}, ${darkBase.b}, 0.24)`,
        contrast: contrastOf(darkBase),
        /* 暗色下 EP 的 light-N 梯度改为往暗底收敛（参照原琥珀暗色梯度规则） */
        elLight3: toHex(mix(darkBase, DARK_NAV, 0.30)),
        elLight5: toHex(mix(darkBase, DARK_NAV, 0.50)),
        elLight7: toHex(mix(darkBase, DARK_NAV, 0.68)),
        elLight8: toHex(mix(darkBase, DARK_NAV, 0.76)),
        elLight9: toHex(mix(darkBase, DARK_PANEL, 0.86)),
        elDark2: toHex(mix(darkBase, WHITE, 0.15)),
    };

    return {light, dark};
};

const applyAccentVars = ({light, dark}) => {
    const rootStyle = document.documentElement.style;
    const map = {
        'base': 'base', 'hover': 'hover', 'active': 'active',
        'soft': 'soft', 'softHover': 'soft-hover', 'softBorder': 'soft-border',
        'softText': 'soft-text', 'glow': 'glow', 'ring': 'ring', 'contrast': 'contrast',
        'elLight3': 'el-light-3', 'elLight5': 'el-light-5', 'elLight7': 'el-light-7',
        'elLight8': 'el-light-8', 'elLight9': 'el-light-9', 'elDark2': 'el-dark-2',
    };
    for (const key in map) {
        rootStyle.setProperty(`--acc-l-${map[key]}`, light[key]);
        rootStyle.setProperty(`--acc-d-${map[key]}`, dark[key]);
    }
};

export const useTheme = () => {

    const systemTheme = window.matchMedia('(prefers-color-scheme: light)')

    const settingsStore = useProjectSettingsStore();

    /**
     * 解析主题值，将 'system' 转换为实际亮/暗模式
     */
    const resolveTheme = (theme) => {
        if (theme === 'system') {
            return systemTheme.matches ? 'light' : 'dark';
        }
        return theme;
    };

    /**
     * 渲染界面配色（强调色）
     * 读取 appearance.uiAccent（自定义颜色选择器的值），派生亮/暗两套强调令牌注入根元素。
     * 非法值回落默认靛青。
     */
    const renderUiStyle = () => {
        const appearance = settingsStore.projectSettings.appearance || {};
        const accent = hexToRgb(appearance.uiAccent) ? appearance.uiAccent : DEFAULT_UI_ACCENT;
        applyAccentVars(deriveAccents(accent));
    };

    /**
     * 根据解析后的主题设置文档根元素的属性
     */
    const renderTheme = (theme) => {
        const resolvedTheme = resolveTheme(theme);
        if (resolvedTheme === 'dark') {
            document.documentElement.setAttribute('dark-theme', '');
        } else {
            document.documentElement.removeAttribute('dark-theme');
        }
        // 亮暗渲染时同步应用配色，保证启动路径（ImageManager 等）一并生效
        renderUiStyle();
    };

    /**
     * 应用主题（包括通知主进程）
     * @param {string} theme - 'light' | 'dark' | 'system'
     */
    const applyTheme = (theme) => {
        renderTheme(theme);
        // 通知主进程（仅在 API 存在且主题值合法时）
        if (window.electronAPI?.setTheme) {
            window.electronAPI.setTheme(['light', 'dark', 'system'].includes(theme) ? theme : 'system');
        }
    };

    // 系统主题变化时，跟随系统模式的设置同步应用
    useEventListener(systemTheme, 'change', () => {
        if (settingsStore.projectSettings.appearance?.theme === 'system') {
            applyTheme('system')
        }
    })

    return {
        renderTheme,
        renderUiStyle,
        applyTheme
    }
}
