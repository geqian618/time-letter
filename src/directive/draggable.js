const draggable = {
    inserted: (el, binding) => {
        const movingRange = binding.arg;
        if (!movingRange || movingRange === 'parent' || movingRange === 'view') {
            el.style.cursor = 'move'
            el.style.position = 'absolute'
            // 鼠标按下触发事件
            el.onmousedown = (event) => {
                // 元素与鼠标箭头之间的水平方向偏移量差   offsetLeft元素水平偏移量，offsetTop元素垂直偏移量
                const x = event.clientX - el.offsetLeft;
                // 元素与鼠标箭头之间的垂直方向偏移量差
                const y = event.clientY - el.offsetTop;
                // 鼠标移动触发事件
                document.onmousemove = (event) => {
                    // 获取鼠标当前位置偏移量
                    let left = event.pageX - x;
                    let top = event.pageY - y;
                    if (movingRange === 'parent') {
                        const parentNode = el.parentNode;
                        const offsetLeft = parentNode.offsetLeft;
                        const offsetTop = parentNode.offsetTop;
                        const offsetRight = parentNode.offsetLeft + parentNode.offsetWidth - parseInt(window.getComputedStyle(el).width);
                        const offsetBottom = parentNode.offsetTop + parentNode.offsetHeight - parseInt(window.getComputedStyle(el).height);
                        left = left < offsetLeft ? offsetLeft : left > offsetRight ? offsetRight : left;
                        top = top < offsetTop ? offsetTop : top > offsetBottom ? offsetBottom : top;
                    }
                    if (!movingRange || movingRange === 'view') {
                        const maxX = (window.innerWidth || document.documentElement.clientWidth) - parseInt(window.getComputedStyle(el).width)
                        const maxY = (window.innerHeight || document.documentElement.clientHeight) - parseInt(window.getComputedStyle(el).height)
                        left = left < 0 ? 0 : left > maxX ? maxX : left;
                        top = top < 0 ? 0 : top > maxY ? maxY : top;
                    }
                    // 将鼠标当前位置偏移量设置给el
                    el.style.left = left + "px";
                    el.style.top = top + "px";
                }
                // 鼠标抬起触发事件
                document.onmouseup = () => {
                    // 取消鼠标移动事件
                    document.onmousemove = null;
                    // 取消鼠标抬起事件
                    document.onmouseup = null;
                }
            }
        }
    }
}
export default draggable
