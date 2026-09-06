import useEventListener from "@/composables/common/useEventListener";
import {useProjectSettingsStore} from '@/stores/project-settings'

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
     * 根据解析后的主题设置文档根元素的属性
     */
    const renderTheme = (theme) => {
        const resolvedTheme = resolveTheme(theme);
        if (resolvedTheme === 'dark') {
            document.documentElement.setAttribute('dark-theme', '');
        } else {
            document.documentElement.removeAttribute('dark-theme');
        }
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
        applyTheme
    }
}
