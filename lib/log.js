const GLOBAL = false;
const CHANNEL = {
    NORMAL: true,
    // bridge 频道
    BRIDGE: true,
    // bridge 启动器频道
    BRIDGE_BOOT: true,
    // phantomjs 启动器频道
    PT_BOOT: true,
    // 服务启动器频道
    SERVICE_BOOT: true
};

const isArray = (item) => {
    return item instanceof Array;
};

const likeStr = (item) => {
    let iType = typeof item;
    return iType === 'string' || iType === 'number';
};

const logCore = (msg, type = 'log') => {
    if (!isArray(msg)) {
        msg = [msg];
    }
    Function.prototype.apply.call(console[type], console, msg);
};

const logStyle = (msg, style, type = 'log') => {
    if (!isArray(msg)) {
        msg = [msg];
    }

    if (likeStr(msg[0]) && style) {
        msg[0] = '%c' + msg[0];
        msg.splice(1, 0, style);
    }
    logCore(msg, type);
};

const logGroup = {
    debug (msg) {
        logCore(msg, 'info');
    },
    loading (msg) {
        logStyle(msg, 'color: blue;');
    },
    success (msg) {
        logStyle(msg, 'color: green;');
    },
    error (msg) {
        logStyle(msg, 'color: red;');
    },
    timeStart (msg) {
        logStyle(msg, undefined, 'time');
    },
    timeEnd (msg) {
        logStyle(msg, undefined, 'timeEnd');
    }
};

const log = (msg, status = 'idle', channel = 'NORMAL', refer) => {
    if (!GLOBAL) {
        return;
    }
    channel = channel.toUpperCase();
    if (!CHANNEL[channel]) {
        return;
    }
    let say = logGroup[status] || logCore;
    say(msg);
};

module.exports = log;
