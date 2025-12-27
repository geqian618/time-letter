window.useThrottle = function useThrottle(action, delay) {
    let timer = null;
    return function (...args) {  // 接收参数
        if (!timer) {
            timer = setTimeout(() => {
                // 传递 this 和参数
                action.apply(this, args);
                // 重置定时器，定时器中不能使用 clearTimeout(timer) 来清除定时器
                timer = null;
            }, delay);
        }
    };
}
