const unikey = (len = 16) => {
    let result = '';
    while (result.length < len) {
        result += Math.random().toString(36).substr(2);
    }
    return result.substr(0, len);
};

const emptyFn = () => {};

module.exports = {
    unikey,
    emptyFn
};