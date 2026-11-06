/**
 * 最小事件总线（观察者模式）：Set 保序、同步回调。
 * 语义与原 eventCallbacks Map + Set 完全一致，仅消除各触发点的重复样板
 */
export class EventEmitter {

    constructor() {
        this.listeners = new Map();
    }

    /**
     * 注册事件回调（与 CanvasEditor.on 同一语义：同事件多回调按注册顺序触发）
     * @param {string} event - 事件名
     * @param {Function} callback - 回调
     */
    on(event, callback) {
        let callbacks = this.listeners.get(event);
        if (!callbacks) {
            callbacks = new Set();
            this.listeners.set(event, callbacks);
        }
        callbacks.add(callback);
    }

    /**
     * 触发事件：无监听者时为空操作
     * @param {string} event - 事件名
     * @param {*} payload - 传给回调的负载
     */
    emit(event, payload) {
        const callbacks = this.listeners.get(event);
        if (callbacks && callbacks.size) {
            callbacks.forEach(callback => callback(payload));
        }
    }

    clear() {
        this.listeners.clear();
    }
}
