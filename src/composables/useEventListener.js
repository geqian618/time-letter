import {watch} from 'vue'

const useEventListener = (element, event, callback) => {
    return watch(() => element, (element, _, onCleanup) => {
        if (!element) return
        element.addEventListener(event, callback);
        onCleanup(() => {
            element.removeEventListener(event, callback);
        })
    }, {
        immediate: true
    })
}

export default useEventListener;
