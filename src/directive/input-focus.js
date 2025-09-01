// 自定义自动聚焦指令
const autoFocusDirective = {
    mounted(el, binding) {
        // 存储初始值
        el._autoFocusInitialized_ = false;

        // 创建聚焦函数
        el._autoFocusHandler_ = () => {
            // 对于 Element Plus 的 el-input，查找内部的 input元素
            const input = el.querySelector('input') || el;

            // 添加轻微延迟确保DOM完全渲染
            setTimeout(() => {
                // 只有在指令值为 true 且尚未初始化时聚焦
                if (binding.value && !el._autoFocusInitialized_) {
                    input.focus();
                    el._autoFocusInitialized_ = true;
                }

                // 如果提供了回调函数，执行它
                if (typeof binding.value === 'function') {
                    binding.value() === true && input.focus();
                }
            }, 100);
        };

        // 立即尝试执行一次
        // el._autoFocusHandler_();
    },

    updated(el, binding) {

        // 当绑定值从 false 变为 true 时，重置初始化状态
        if (binding.value && !binding.oldValue) {
            el._autoFocusInitialized_ = false;
        }

        // 只有当对话框刚刚打开时执行聚焦
        if (binding.value && !el._autoFocusInitialized_) {
            el._autoFocusHandler_();
        }
    },

    beforeUnmount(el) {
        // 清理
        delete el._autoFocusHandler_;
        delete el._autoFocusInitialized_;
    }
};

export default autoFocusDirective;
