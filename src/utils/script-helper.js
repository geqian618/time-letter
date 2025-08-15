function executeScript(scriptStr) {
    try {
        return new Function(scriptStr)();
    } catch (e) {
        console.error("执行错误:", e);
    }
}

function executeFunctionScript(scriptStr) {
    try {
        // 创建并返回函数（不立即执行）
        return new Function(`return (${scriptStr})()`)();
    } catch (e) {
        console.error("执行错误:", e);
        return null;
    }
}


export {executeScript, executeFunctionScript}
