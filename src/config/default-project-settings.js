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
    locale: {
        language: 'system'
    },
    appearance: {
        theme: 'system',
        // 配色主题：default(琥珀) | indigo | pine | crimson | wisteria
        uiTheme: 'default',
        // 分组卡片：true 显示卡片外壳，false 扁平化（去外壳）
        showGroupCards: true,
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
    },
    availableFonts: null
}

export {defaultProjectSettings}
