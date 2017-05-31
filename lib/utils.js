const unikey = (len = 16) => {
    let result = '';
    while (result.length < len) {
        result += Math.random().toString(36).substr(2);
    }
    return result.substr(0, len);
};

const emptyFn = () => {};

/**
 * 根据rootObj的key，从newObj中取对应数据更新rootObj
 */
const smartyMerge = (rootObj, newObj = {}, isNumParse) => {
    let tempObj = {};
    for (let i in rootObj) {
        if (rootObj.hasOwnProperty(i)) {
            tempObj[i] = rootObj[i];
            if (i in newObj) {
                let temp = newObj[i];
                let parseVal = parseFloat(temp, 10);
                if (isNumParse && !isNaN(parseVal)) {
                    temp = parseVal;
                }
                tempObj[i] = temp;
            }
        }
    }
    return tempObj;
};

module.exports = {
    unikey,
    emptyFn,
    smartyMerge
};