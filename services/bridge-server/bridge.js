/**
 * bridge 命名空间构造方法
 */

var VALID_METHOD = {
    GET: true,
    POST: true
};

var BridgeNs = function (api, opts) {
    opts = opts || {};
    this.handlerList = {};
    this.secret = opts.secret;
    this.channelCount = 0;
    this.api = api;
};

BridgeNs.prototype = {
    registerBridgeId: function () {
        var bridgeId = ++this.channelCount;
        this.handlerList[bridgeId] = [];
        return bridgeId;
    },
    unregisterBridgeId: function (bridgeId) {
        delete this.handlerList[bridgeId];
        return this;
    },
    // 设置Node 环境对 pt task 中返回的数据的处理方法
    setHandler: function (bridgeId, handler) {
        var hL = this.handlerList;
        // 未注册的频道不允许添加监听
        if (!hL[bridgeId]) {
            return this;
        }
        hL[bridgeId].push(handler);
        return this;
    },
    // 根据通信ID，获取对应的监听方法
    getHandlers: function (bridgeId) {
        return this.handlerList[bridgeId] || [];
    },
    removeHandler: function (bridgeId, handler) {
        var handlerList = this.handlerList[bridgeId];
        if (handlerList && handlerList.length) {
            for (var i = handlerList.length - 1; i >= 0; i--) {
                if (handlerList[i] === handler) {
                    handlerList.splice(i, 1);
                }
            }
        }
        return this;
    },
    // 校验通信请求
    verfiyRequest: function (req) {
        if (req.method && VALID_METHOD[req.method.toUpperCase()]) {
            var secret = this.secret;
            if (secret) {
                return !!(req.headers['x-bridgeid'] && req.headers['x-secret'] === secret && VALID_METHOD[req.method])
            }
            return !!(req.headers['x-bridgeid']);
        }
        return false;
    },
    // 解析出响应结果
    resolveResponse: function (req, reqParams) {
        var bridgeId = req.headers['x-bridgeid'];
        var method = req.method;
        var handleList = this.getHandlers(bridgeId);
        var resData = {};
        if (handleList) {
            handleList.forEach(function (handler) {
                resData = handler(method, reqParams, resData);
            });
        }
        return {
            data: resData
        };
    }
};

module.exports = BridgeNs;
