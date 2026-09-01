import {ref, computed} from 'vue'
import {defineStore} from 'pinia'

import {LinkedMap} from '@/utils/LinkedMap'
import CanvasManager from '@/object/canvas-manager'
import {Metadata, TextOptions, ImageOptions, BorderOptions, PhotographOptions} from '@/object/Configuration'

export const useCanvasesStore = defineStore('canvases', () => {

    // ---------- 状态 ----------

    const filterType = ref(0)

    const selectedPreviewList = ref(new Map())

    const imageResources = ref(new Map())

    const photographOptions = ref(new PhotographOptions())

    const textOptions = ref(new TextOptions())

    const imageOptions = ref(new ImageOptions())

    const borderOptions = ref(new BorderOptions())

    const metadataOptions = ref(new Metadata())

    const downloadProgressVisible = ref(false)

    const downloadProgressPercentage = ref(0)

    const deleteTipsDialogVisible = ref(false)



    // ---------- 共享资源注册（非响应式：DOM 引用与画布编辑器实例，仅存取） ----------

    // 各面板注册进来的 DOM 模板引用
    const domRefs = {}

    // 前景层编辑器实例（由 WorkspacePanel 创建后注册）
    let canvasEditor = null;

    // 背景层编辑器实例（由 WorkspacePanel 创建后注册）
    let backgroundCanvasEditor = null;


    // ---------- 计算属性 ----------

    const uploadVisible = computed(() => !CanvasManager.getSelectedObject().path)

    const availableCanvases = computed(() => {
        const filter = filterType.value;
        const result = new LinkedMap();
        for (const [path, canvas] of CanvasManager.getCanvases()) {
            if (filterCanvas(canvas, filter)) {
                result.set(path, canvas);
            }
        }
        return result;
    });

    // 过滤函数
    const filterCanvas = (canvas, filter) => {
        if (filter === 0) return true;
        const {width, height} = canvas.metadata || {};
        const w = Number(width), h = Number(height);
        return filter === 1 ? w >= h : w < h;
    };

    const thumbnailVisible = (canvas) => availableCanvases.value.has(canvas.path)

    // 由各面板在挂载时注册 DOM 引用
    const registerCanvasRefs = (refs) => {
        Object.assign(domRefs, refs)
    }

    const getDomRefs = () => domRefs

    // 画布工作区元素上挂载着 idealWidth / idealHeight 属性，供模板应用等模块读取
    const getWorkspace = () => domRefs.canvasWorkspace

    const setCanvasEditor = (editor) => {
        canvasEditor = editor
    }

    const getCanvasEditor = () => canvasEditor

    const setBackgroundCanvasEditor = (editor) => {
        backgroundCanvasEditor = editor
    }

    const getBackgroundCanvasEditor = () => backgroundCanvasEditor

    return {
        filterType,
        selectedPreviewList,
        imageResources,
        photographOptions,
        textOptions,
        imageOptions,
        borderOptions,
        metadataOptions,
        downloadProgressVisible,
        downloadProgressPercentage,
        deleteTipsDialogVisible,
        uploadVisible,
        availableCanvases,
        thumbnailVisible,
        registerCanvasRefs,
        getDomRefs,
        getWorkspace,
        setCanvasEditor,
        getCanvasEditor,
        setBackgroundCanvasEditor,
        getBackgroundCanvasEditor,
    }
})
