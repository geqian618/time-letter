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
    appearance: {
        theme: 'system',
        enableScrollbar: true
    },
    others: {
        optionAnchorPoint: true,
        movingStepSize: 1,
        defaultCanvasScale: 0.75,
        deleteTipVisible: true,
        autoCenterOnToggle: true
    },
    resize: {
        leftSidebar: {
            width: '18%',
            height: '75%'
        },
        canvasWorkspace: {
            width: '60%',
            height: '75%'
        },
        rightSidebar: {
            width: '22%',
            height: '75%'
        },
        bottomSidebar: {
            width: '100%',
            height: '25%'
        }
    },
    availableFonts: null
}

// 偏好设置弹窗的静态下拉选项
const outputSizeOptions = [
    {label: '最佳尺寸', value: 0},
    {label: '固定宽度', value: 1},
    {label: '固定高度', value: 2},
    {label: '自适应', value: 3},
]

const downloadThreadsOptions = [
    {label: '自动', value: -1},
    {label: '4', value: 4},
    {label: '8', value: 8},
    {label: '12', value: 12},
    {label: '16', value: 16},
    {label: '32', value: 32}
]

export {defaultProjectSettings, outputSizeOptions, downloadThreadsOptions}
