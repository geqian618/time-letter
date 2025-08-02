function formatShutterSpeed(seconds) {
    // 处理无效输入
    if (isNaN(seconds) || seconds <= 0) return '';

    // 大于等于1秒的处理
    if (seconds >= 1) {
        // 四舍五入到0.1秒
        const rounded = Math.round(seconds * 10) / 10;
        return rounded % 1 === 0 ? `${rounded}s` : `${rounded}s`;
    }
    // 小于1秒的处理（分数形式）
    const MAX_DENOMINATOR = 10000;
    let bestNumerator = 0;
    let bestDenominator = 1;
    let minError = Infinity;

    // 遍历分母寻找最佳分数
    for (let d = 1; d <= MAX_DENOMINATOR; d++) {
        const n = Math.round(seconds * d);
        const error = Math.abs(n / d - seconds);

        // 更新最小误差的分数
        if (error < minError) {
            minError = error;
            bestNumerator = n;
            bestDenominator = d;
        }
    }

    // 处理极小的快门速度
    if (bestNumerator === 0) {
        bestNumerator = 1;
        bestDenominator = MAX_DENOMINATOR;
    }

    // 计算最大公约数（GCD）
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(bestNumerator, bestDenominator);
    const numerator = bestNumerator / divisor;
    const denominator = bestDenominator / divisor;

    // 返回格式化结果
    return numerator === 1
        ? `1/${denominator}`
        : `${numerator}/${denominator}`;
}


module.exports = {formatShutterSpeed}
