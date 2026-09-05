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
        enableScrollbar: true
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

export {defaultProjectSettings}
