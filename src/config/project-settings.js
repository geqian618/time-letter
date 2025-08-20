import {ref} from 'vue'

const projectSettings = ref({
    outputSettings: {
        outputSize: {
            type: 0,
            // width: 0,
            // height: 0,
            longSide: 0,
            shortSide: 0
        },
        outputDirectory: "",
        extname: 0,
        quality: 10
    }
})


const outputSizeOptions = [
    {label: '原尺寸（不含边框）', value: 0},
    {label: '原尺寸（包含边框）', value: 1},
    {label: '长边固定（不含边框）', value: 2},
    {label: '长边固定（包含边框）', value: 3},
    {label: '短边固定（不含边框）', value: 4},
    {label: '短边固定（包含边框）', value: 5},
    // {label: '自定义（不含边框）', value: 6},
    // {label: '自定义（包含边框）', value: 7},
]

export {outputSizeOptions, projectSettings}
