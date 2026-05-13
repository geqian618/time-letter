function formatTimestamp(timestamp, format = 'YYYY-MM-DD') {

    const date = new Date(timestamp);
    const pad = (num) => String(num).padStart(2, '0');

    const replacements = {
        'YYYY': date.getFullYear(),
        'MM': pad(date.getMonth() + 1),
        'DD': pad(date.getDate()),
    };

    return format.replace(/YYYY|MM|DD/g, match => replacements[match]);
}

function getDate(format = 'YYYY-MM-DD') {
    const date = new Date(Date.now());
    return formatDate(date, format)
}


function getDateTime(format = 'YYYY-MM-DD HH:mm:ss') {
    const date = new Date(Date.now());
    return formatDate(date, format)
}


/**
 * 解析字符串日期为 Date
 * @param str
 * @param format
 * @returns {Date|null}
 */
function parseDate(str, format) {
    // 将小写 yyyy 和 dd 统一转为大写的 YYYY 和 DD，方便内部处理
    const normalizedFormat = format.replace(/yyyy/g, 'YYYY').replace(/dd/g, 'DD');
    // 同时将输入字符串中的相应部分也做映射？不，输入字符串的值就是数字，不需要改。
    // 但格式中的 token 已经归一化，解析时按大写识别即可。

    const tokenMap = {
        YYYY: '(\\d{4})',
        MM: '(\\d{2})',
        DD: '(\\d{2})',
        HH: '(\\d{2})',
        mm: '(\\d{2})',
        ss: '(\\d{2})'
    };
    const tokenList = ['YYYY', 'MM', 'DD', 'HH', 'mm', 'ss'];

    const parts = normalizedFormat.split(/(YYYY|MM|DD|HH|mm|ss)/);
    let regexStr = '';
    const order = [];
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const part of parts) {
        if (tokenList.includes(part)) {
            order.push(part);
            regexStr += tokenMap[part];
        } else if (part !== '') {
            regexStr += escapeRegex(part);
        }
    }

    const fullRegex = new RegExp(`^${regexStr}$`);
    const match = str.match(fullRegex);
    if (!match) return null;

    const values = match.slice(1);
    const dateParts = {YYYY: null, MM: null, DD: null, HH: 0, mm: 0, ss: 0};
    for (let i = 0; i < order.length; i++) {
        dateParts[order[i]] = parseInt(values[i], 10);
    }
    if (dateParts.YYYY === null || dateParts.MM === null || dateParts.DD === null) return null;

    const {YYYY, MM, DD, HH, mm, ss} = dateParts;
    return new Date(YYYY, MM - 1, DD, HH, mm, ss);
}

/**
 * 格式化 Date 为字符串
 * @param {Date} date
 * @param {string} format 支持 YYYY/yyyy, MM, DD/dd, HH, mm, ss
 */
function formatDate(date, format) {
    if (!(date instanceof Date) || isNaN(date)) throw new Error('Invalid Date');
    const pad = (n) => n.toString().padStart(2, '0');

    const replacements = {
        YYYY: date.getFullYear(),
        yyyy: date.getFullYear(),   // 同时支持小写
        MM: pad(date.getMonth() + 1),
        DD: pad(date.getDate()),
        dd: pad(date.getDate()),     // 支持小写 dd
        HH: pad(date.getHours()),
        mm: pad(date.getMinutes()),
        ss: pad(date.getSeconds())
    };

    // 注意：替换顺序需优先匹配更长/更精确的 token 避免冲突，这里所有 token 互斥，直接全局替换即可
    return format.replace(/yyyy|YYYY|MM|dd|DD|HH|mm|ss/g, (match) => replacements[match]);
}


export {formatTimestamp, getDate, getDateTime, parseDate, formatDate}
