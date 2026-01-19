import {ref} from 'vue'

const projectSettings = ref({
    outputSettings: {
        outputSize: {
            type: 0,
            longSide: 1920,
            shortSide: 1080,
            width: 1920,
            height: 1080
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
            shootingTime: '${shootingTime}'
        },
        other: {
            enableEquivalentFocalSegment: false,
            conversionMultiple: 1.5
        }
    },
    performance: {
        downloadThreads: -1
    },
    others: {
        optionAnchorPoint: true,
        movingStepSize: 1,
        defaultCanvasScale: 0.75,
        enableScrollbar: true
    },
    availableFonts: new Map()
})


const originalMetadata = {
    formats: {
        iso: '${iso}',
        cameraBrand: '${cameraBrand}',
        cameraModel: '${cameraModel}',
        lensModel: '${lensModel}',
        focalLength: '${focalLength}',
        shutter: '${shutter}',
        aperture: '${aperture}',
        shootingTime: '${shootingTime}'
    },
    other: {
        enableEquivalentFocalSegment: false,
        conversionMultiple: 1.5
    }
}


const downloadThreadsOptions = [
    {label: '自动', value: -1},
    {label: '4', value: 4},
    {label: '8', value: 8},
    {label: '12', value: 12},
    {label: '16', value: 16},
    {label: '32', value: 32}
]

const outputSizeOptions = [
    {label: '原尺寸', value: 0},
    {label: '宽固定', value: 1},
    {label: '高固定', value: 2}
]

export {outputSizeOptions, projectSettings, originalMetadata, downloadThreadsOptions}
