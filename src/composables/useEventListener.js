import {watch} from 'vue'

const useEventListener = (element, event, callback, options) => {
    return watch(() => element, (element, _, onCleanup) => {
        if (!element) return
        element.addEventListener(event, callback, options);
        onCleanup(() => {
            element.removeEventListener(event, callback, options);
        })
    }, {
        immediate: true
    })
}

export default useEventListener;
