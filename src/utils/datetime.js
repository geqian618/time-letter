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
    const pad = (num) => String(num).padStart(2, '0');

    const replacements = {
        'YYYY': date.getFullYear(),
        'MM': pad(date.getMonth() + 1),
        'DD': pad(date.getDate()),
    };

    return format.replace(/YYYY|MM|DD/g, match => replacements[match]);
}


function getDateTime(format = 'YYYY-MM-DD HH:mm:ss') {

    const date = new Date(Date.now());
    const pad = (num) => String(num).padStart(2, '0');

    const replacements = {
        'YYYY': date.getFullYear(),
        'MM': pad(date.getMonth() + 1),
        'DD': pad(date.getDate()),
        'HH': pad(date.getHours()),
        'mm': pad(date.getMinutes()),
        'ss': pad(date.getSeconds())
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
}

export {formatTimestamp, getDate, getDateTime}
