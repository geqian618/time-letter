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
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        sourcemap: false, // 禁止生成 .map 文件
        minify: 'terser', // 使用terser进行压缩混淆
        assetsInlineLimit: 1,
        chunkSizeWarningLimit: 2000,
        terserOptions: {
            compress: {
                drop_console: true, // 移除 console
                drop_debugger: true // 移除 debugger
            },
            format: {
                comments: false
            },
            mangle: true, // 混淆变量名（默认开启）
        }
    }
})
