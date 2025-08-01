import {defineStore} from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
    }),
    actions: {
    },
    // 持久化插件相关配置
    persist: {
        // 持久化模式
        storage: sessionStorage,
        // 持久化到 sessionStorage 中的 key
        key: 'user',
        // 持久化的 state 数据，[] 表示不持久化任何状态，undefined 或 null 表示持久化整个 state。
        paths: ['user'],
        // 序列化与反序列化方式，默认值：JSON.stringify/JSON.parse
        serializer: {
          deserialize: JSON.parse,
          serialize: JSON.stringify
        },
        //默认值为false，当设置为 true 时，持久化/恢复 Store 时可能发生的任何错误都将使用 console.error 输出
        debug: false,
        //默认值 undefined，该 hook 将在从 storage 中恢复数据之前触发，并且它可以访问整个 PiniaPluginContext，这可用于在恢复数据之前强制地执行特定的操作
        beforeRestore: undefined,
        //默认值 undefined，该 hook 将在从 storage 中恢复数据之后触发，并且它可以访问整个 PiniaPluginContext，这可用于在恢复数据之后强制地执行特定的操作
        afterRestore: undefined,
    },
})

