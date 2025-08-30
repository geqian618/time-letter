// 自定义自动聚焦指令
const autoFocusDirective = {
    mounted(el, binding) {
        el._autoFocus_ = () => {
            // 对于Element Plus的el-input，查找内部的input元素
            const input = el.querySelector('input') || el;
            // 添加轻微延迟确保DOM完全渲染
            setTimeout(() => {
                // 如果有回调函数，执行它
                if (binding.value === true) {
                    input.focus();
                }
                if (typeof binding.value === 'function') {
                    binding.value() === true && input.focus()
                }
            }, 100);
        };

        // 立即尝试执行一次
        // el._autoFocus_();
    },

    updated(el, binding) {
        // 当绑定值变化时重新尝试聚焦
        if (binding.value) {
            el._autoFocus_();
        }
    },

    beforeUnmount(el) {
        // 清理
        delete el._autoFocus_;
    }
};

export default autoFocusDirective;
