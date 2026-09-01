import {ElNotification} from 'element-plus'

const success = (message, title = 'Success') => {
    ElNotification({
        title,
        message,
        type: 'success',
        position: 'bottom-right'
    })
}


const error = (message, title = 'Error') => {
    ElNotification({
        title,
        message,
        type: 'error',
        position: 'bottom-right'
    })
}


export default {success, error}

