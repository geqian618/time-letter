import {fileURLToPath, URL} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
    base: './',
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            // 应用图标等原生资源与 Electron 侧同源，避免在 src 下再存一份副本
            '@resources': fileURLToPath(new URL('./electron/resources', import.meta.url))
        }
    },
    optimizeDeps: {
        exclude: ['@napi-rs/canvas'],
    },
    build: {
        // 禁止生成 .map 文件
        sourcemap: false,
        // 使用 terser 进行压缩混淆
        minify: 'terser',
        assetsInlineLimit: 1,
        chunkSizeWarningLimit: 2000,
        terserOptions: {
            compress: {
                // 移除 console
                drop_console: true,
                // 移除 debugger
                drop_debugger: true
            },
            format: {
                comments: false
            },
            // 混淆变量名（默认开启）
            mangle: true,
        }
    }
})
