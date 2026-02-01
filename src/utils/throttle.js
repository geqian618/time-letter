export function useThrottle(action, delay) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            action.apply(this, args);
            lastTime = now;
        }
    };
}
