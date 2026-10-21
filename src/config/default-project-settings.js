// 全局快捷键默认值（Electron accelerator 格式）：偏好设置与主进程注册共用
const defaultShortcuts = {
    importImages: 'CommandOrControl+I',
    exportImages: 'CommandOrControl+O',
    preferences: 'CommandOrControl+Alt+S',
    savePreset: 'CommandOrControl+T',
    removeImage: 'CommandOrControl+D',
    deleteImage: 'CommandOrControl+Alt+D',
    clearCanvas: 'CommandOrControl+L',
    resetCanvas: 'CommandOrControl+R'
}

const defaultProjectSettings = {
    outputSettings: {
        outputSize: {
            type: 0,
            width: 1920,
            height: 1080,
            maxWidth: 1920,
            maxHeight: 1080
        },
        extname: 0,
        quality: 100,
        isSynchronizeMetadata: true,
        fileNaming: {
            basename: 0,
            prefix: '',
            suffix: ''
        }
    },
    metadata: {
        formats: {
            iso: '${iso}',
            cameraBrand: '${cameraBrand}',
            cameraModel: '${cameraModel}',
            lensModel: '${lensModel}',
            focalLength: '${focalLength}',
            shutter: '${shutter}',
            aperture: '${aperture}',
            shootingTime: '${shootingTime}',
            filename: '${filename}'
        },
        others: {
            shootingTimeFormat: 'yyyy-MM-dd HH:mm:ss',
            enableEquivalentFocalSegment: false,
            conversionMultiple: 1.5
        }
    },
    performance: {
        downloadThreads: -1,
    },
    // 全局快捷键（Electron accelerator 格式），可在偏好设置中修改
    shortcuts: {...defaultShortcuts},
    locale: {
        language: 'system'
    },
    appearance: {
        theme: 'system',
        // 界面强调色（颜色选择器自定义值）：运行时派生亮/暗两套令牌，默认靛青
        uiAccent: '#3E63DD',
        enableScrollbar: true,
        enableZoomPill: true
    },
    others: {
        optionAnchorPoint: true,
        movingStepSize: 1,
        defaultCanvasScale: 0.75,
        deleteTipVisible: true,
        autoCenterOnToggle: true,
        focalZoom: false
    },
    /* 面板默认比例（设计稿实测：左右面板各 ≈16.3%，底部区 ≈16%） */
    resize: {
        leftSidebar: {
            width: "17%",
            height: "80%"
        },
        canvasWorkspace: {
            width: "63%",
            height: "80%"
        },
        rightSidebar: {
            width: "20%",
            height: "80%"
        },
        bottomSidebar: {
            width: "100%",
            height: "20%"
        }
    }
}

export {defaultProjectSettings, defaultShortcuts}
