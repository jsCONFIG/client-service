/**
 * 服务入口
 */
var BridgeNs = require('./bridge-server/bridge');
var headlessBrowser = require('./headless-browser/index');
var createBridgeServer = require('./bridge-server/bridge-server');

var HeadlessBrowserService = function (bridgeApi, opts) {
    bridgeApi = bridgeApi || 'http://127.0.0.1:3333';
    opts = Object.assign({
        // 是否由服务来创建通信server
        buildBridgeServer: true,
        // bridge服务通信密钥
        secret: 'headless-browser-service'
    }, opts);
    this.secret = opts.secret;
    this.bridgeNs = new BridgeNs(bridgeApi, opts);
    if (opts.buildBridgeServer) {
        this.bridgeServer = createBridgeServer(this.bridgeNs);
        var self = this;
        // 监听ctrl+c操作，退出server服务
        process.on('SIGINT', function () {
            self.destroy();
        });
    }
    this.taskPlatform = headlessBrowser.createTaskPlatform(this.bridgeNs);
};

HeadlessBrowserService.prototype = {
    run: function (jobFile, jobParams, opts) {
        return this.taskPlatform.run(jobFile, jobParams, opts);
    },
    verifyRequest: function (req) {
        return this.bridgeNs.verfiyRequest(req);
    },
    resolveResponseData: function (req, reqParams) {
        return this.bridgeNs.resolveResponse(req, reqParams);
    },
    destroy: function () {
        this.bridgeServer && this.bridgeServer.destroy();
        this.taskPlatform && this.taskPlatform.destroy();
    }
};

module.exports = HeadlessBrowserService;
