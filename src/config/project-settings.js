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
        quality: 10,
        isSynchronizeMetadata: true
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
    fontConfig: new Map(),
    performance: {
        downloadThreads: -1
    },
    others: {
        optionAnchorPoint: true
    }
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
    {label: '原尺寸（不含边框）', value: 0},
    // {label: '原尺寸宽（包含边框）', value: 1},
    {label: '长边固定（不含边框）', value: 2},
    {label: '长边固定（包含边框）', value: 3},
    {label: '短边固定（不含边框）', value: 4},
    {label: '短边固定（包含边框）', value: 5},
    {label: '宽固定（不含边框）', value: 6},
    {label: '宽固定（包含边框）', value: 7},
    {label: '高固定（不含边框）', value: 8},
    {label: '高固定（包含边框）', value: 9},
    // {label: '自定义（不含边框）', value: 6},
    // {label: '自定义（包含边框）', value: 7},
]

export {outputSizeOptions, projectSettings, originalMetadata, downloadThreadsOptions}
