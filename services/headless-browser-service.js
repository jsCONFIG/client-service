/**
 * 服务入口
 */
var os = require('os');
var BridgeNs = require('./bridge-server/bridge');
var headlessBrowser = require('./headless-browser/index');
var createBridgeServer = require('./bridge-server/bridge-server');
var utils = require('../lib/utils');

var HeadlessBrowserService = function (bridgeApi, opts) {
    bridgeApi = bridgeApi || 'http://127.0.0.1:3333';
    opts = utils.smartyMerge({
        // 是否由服务来创建通信server
        buildBridgeServer: true,
        // bridge服务通信密钥
        secret: 'headless-browser-service',
        // 任务执行成功
        onSuccess: utils.emptyFn,
        // 任务执行出错
        onError: utils.emptyFn,
        // 任务执行超时
        onTimeout: utils.emptyFn,
        // 任务执行结束
        onEnd: utils.emptyFn,
        // 单个任务的超时时间
        timeout: 10 * 1000,
        // 任务并发数，如不想并发，可设置为1
        concurrency: os.cpus().length * 2
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
    this.taskPlatform = headlessBrowser.createTaskPlatform(this.bridgeNs, opts);
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
