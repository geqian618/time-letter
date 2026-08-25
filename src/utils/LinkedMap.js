/**
 * 双向链表节点。仅供 `LinkedMapComposite.getNode` 返回，不应手动构造。
 *
 * @template K
 * @template V
 */
class Node {

    constructor(key, value, prev = null, next = null) {

        this.key = key;

        this._value = value;

        this._prev = prev;

        this._next = next;
    }

    /** @returns {V} 与 `map.get(key)` 同引用。 */
    get value() {
        return this._value;
    }

    /** @returns {Node<K, V> | null} 前一节点，首节点为 null。 */
    get prev() {
        return this._prev;
    }

    /** @returns {Node<K, V> | null} 后一节点，尾节点为 null。 */
    get next() {
        return this._next;
    }
}

/**
 * 保留插入顺序的 LinkedMap（组合实现，不继承 Map）。
 * value 存于内部 Map；链表用于 `getNode` 的双向导航。
 *
 * @template K
 * @template V
 */
class LinkedMap {
    /**
     * @param {Iterable<[K, V]> | null | undefined} [iterable] 可选的 `[key, value]` 可迭代序列。
     */
    constructor(iterable) {

        this._map = new Map();

        this._nodes = new Map();

        this._head = null;

        this._tail = null;

        this._size = 0;

        if (iterable !== undefined && iterable !== null) {
            for (const [k, v] of iterable) this.set(k, v);
        }
    }

    /** @returns {number} */
    get size() {
        return this._size;
    }

    /**
     * @param {K} key
     * @returns {V | undefined}
     */
    get(key) {
        return this._map.get(key);
    }

    /**
     * @returns {V | undefined}
     */
    getFirst() {
        return this._head?.value;
    }


    /**
     * @returns {V | undefined}
     */
    getLast() {
        return this._tail?.value;
    }

    /**
     * @param {K} key
     * @returns {boolean}
     */
    has(key) {
        return this._map.has(key);
    }

    /**
     * 设置 key 对应的 value。新 key 追加到链表尾部；已存在的 key 仅更新 value，
     * 不改变位置（Map 语义，保持遍历顺序稳定）。
     *
     * @param {K} key
     * @param {V} value
     * @returns {this}
     */
    set(key, value) {
        if (this._map.has(key)) {
            this._map.set(key, value);
            this._nodes.get(key)._value = value;
            return this;
        }
        const node = new Node(key, value);
        this._appendTail(node);
        this._nodes.set(key, node);
        this._map.set(key, value);
        this._size++;
        return this;
    }

    /**
     * 删除指定 key。
     *
     * @param {K} key
     * @returns {boolean} 是否成功删除。
     */
    delete(key) {
        if (!this._map.has(key)) return false;
        this._removeNode(this._nodes.get(key));
        this._nodes.delete(key);
        const deleted = this._map.delete(key);
        if (deleted) this._size--;
        return deleted;
    }

    /**
     * 清空所有条目并重置链表。先置空首尾、再清内部 Map（合并为单次触发），
     * 最后断开节点链接。
     */
    clear() {
        const head = this._head;
        this._head = null;
        this._tail = null;
        this._map.clear();
        this._nodes.clear();
        this._size = 0;
        let node = head;
        while (node) {
            const next = node._next;
            node._prev = null;
            node._next = null;
            node = next;
        }
    }

    /**
     * 获取 key 对应的节点，可用于通过 `prev` / `next` 双向遍历。
     * 不存在时返回 undefined。
     *
     * @param {K} key
     * @returns {Node<K, V> | undefined}
     */
    getNode(key) {
        return this._nodes.get(key);
    }


    /**
     * 获取 key 对应的节点，可用于通过 `prev` / `next` 双向遍历。
     * 不存在时返回 undefined。
     *
     * @returns {Node<K, V> | undefined}
     */
    getFirstNode() {
        return this._head;
    }


    /**
     * 获取 key 对应的节点，可用于通过 `prev` / `next` 双向遍历。
     * 不存在时返回 undefined。
     *
     * @returns {Node<K, V> | undefined}
     */
    getLastNode() {
        return this._tail;
    }

    /**
     * 按插入顺序遍历（委托内部 Map，响应式下跟踪 ITERATE）。
     *
     * @param {(value: V, key: K, map: LinkedMap<K, V>) => void} callback
     * @param {*} [thisArg]
     */
    forEach(callback, thisArg) {
        this._map.forEach((value, key) => callback.call(thisArg, value, key, this));
    }

    /** @returns {IterableIterator<[K, V]>} */
    entries() {
        return this._map.entries();
    }

    /** @returns {IterableIterator<K>} */
    keys() {
        return this._map.keys();
    }

    /** @returns {IterableIterator<V>} */
    values() {
        return this._map.values();
    }

    /** @returns {IterableIterator<[K, V]>} */
    [Symbol.iterator]() {
        return this._map[Symbol.iterator]();
    }

    /**
     * 将节点追加到链表尾部。
     *
     * @param {Node<K, V>} node
     */
    _appendTail(node) {
        node._prev = this._tail;
        node._next = null;
        if (this._tail) {
            this._tail._next = node;
        } else {
            this._head = node;
        }
        this._tail = node;
    }

    /**
     * 从链表中摘除节点，并重连前后节点与首尾指针。
     *
     * @param {Node<K, V>} node
     */
    _removeNode(node) {
        const prev = node._prev;
        const next = node._next;
        if (prev) {
            prev._next = next;
        } else {
            this._head = next;
        }
        if (next) {
            next._prev = prev;
        } else {
            this._tail = prev;
        }
        node._prev = null;
        node._next = null;
    }
}


export {Node, LinkedMap}
