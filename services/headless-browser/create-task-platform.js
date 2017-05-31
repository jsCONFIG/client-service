/**
 * 创建任务执行平台
 */

const os = require('os');
const queueGenerator = require('queue');
const phantomjsBootstrap = require('./phantomjs-bootstrap');
const log = require('../../lib/log');
const utils = require('../../lib/utils');

/**
 * 创建phantomjs 任务执行环境
 * @param  {[type]} bridgeInst headless-browser-bridge服务实例
 * @param  {Object} jobOpts 本次任务集执行环境的相关配置
 */
var createTaskPlatform = function (bridgeInst, jobOpts) {
    // 执行环境的配置
    jobOpts = utils.smartyMerge({
        // 单个任务执行完成
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
    }, jobOpts);
    var registerBridgeHandlers = {};
    var ptInsts = {};
    var queueIdCount = 0;
    var queue = queueGenerator({
        concurrency: jobOpts.concurrency,
        timeout: jobOpts.timeout,
        autostart: true
    });

    /**
     * 队列事件绑定区
     */
    queue.on('success', ({jobId, inst}, job) => {
        log('Job ' + jobId + ' Success', 'debug', 'SERVICE_BOOT');
        jobOpts.onSuccess(jobId);
        // 销毁pt任务
        inst.destroy();
    });

    queue.on('end', () => {
        log('All Jobs Finished.', 'debug', 'SERVICE_BOOT');
        jobOpts.onEnd();
    });

    queue.on('error', ({jobId, error}) => {
        log('Job ' + jobId + ' Error: ' + (error && error.message), 'debug', 'SERVICE_BOOT');
        jobOpts.onError(jobId);
    });

    queue.on('timeout', (next, job) => {
        var jobId = job.jobId;
        log('Job ' + jobId + ' Timeout.', 'debug', 'SERVICE_BOOT');
        var handlerGroup = registerBridgeHandlers[jobId];
        if (handlerGroup && handlerGroup.onTimeout) {
            handlerGroup.onTimeout();
        }
        jobOpts.onTimeout(jobId);
        next();
    });

    return {
        queue,
        run: (jobFile, jobParams, opts) => {
            opts = Object.assign({
                // 接收到消息时的回调
                onMessage: utils.emptyFn,
                onTimeout: utils.emptyFn,
                debug: false
            }, opts);
            var onMessage = opts.onMessage;
            var bridgeId = bridgeInst.registerBridgeId();
            var jobId = ++queueIdCount;
            var destroy = function () {
                // 清空回调方法
                var bridgeHandlerGroup = registerBridgeHandlers[bridgeId];
                if (bridgeHandlerGroup) {
                    delete registerBridgeHandlers[bridgeId];
                }
                bridgeInst.removeHandler(bridgeId, onMessage);
                // 销毁子进程
                var ptInst = ptInsts[jobId];
                if (ptInst) {
                    delete ptInsts[jobId];
                    ptInst.destroy();
                    ptInst = null;
                }
                // 移除队列
                var qPos = queue.indexOf(queueCore);
                if (qPos !== -1) {
                    queue.splice(qPos, 1);
                }
            };
            var queueCore = (next) => {
                log('Start Job. jobID(' + jobId + ')', 'debug', 'SERVICE_BOOT');
                var phantomjsInst;
                var onEnd = function (result, job) {
                    destroy();
                    next(
                        null,
                        {
                            jobId: jobId,
                            result: result,
                            inst: phantomjsInst
                        }
                    );
                };
                var onError = function (err, job) {
                    destroy();
                    next(
                        err,
                        {
                            jobId: jobId,
                            inst: phantomjsInst
                        }
                    );
                };
                // 增加Bridge消息监听
                bridgeInst.setHandler(bridgeId, onMessage);

                // 启动pt 服务
                phantomjsInst = phantomjsBootstrap.entry(
                    jobFile,
                    jobParams,
                    {
                        onEnd: onEnd,
                        onError: onError,
                        jobId: jobId,
                        bridgeId: bridgeId,
                        bridgeApi: bridgeInst.api,
                        secret: bridgeInst.secret,
                        debug: opts.debug
                    }
                );
                ptInsts[jobId] = phantomjsInst;
                return phantomjsInst;
            };
            queueCore.jobId = jobId;
            queue.push(queueCore);
            registerBridgeHandlers[bridgeId] = {
                onMessage: onMessage,
                onTimeout: function () {
                    destroy();
                    opts.onTimeout();
                }
            };
            // 返回任务ID
            return {
                jobId: jobId,
                bridgeId: bridgeId,
                destroy: destroy
            };
        },
        destroy: function () {
            for (var i in registerBridgeHandlers) {
                if (registerBridgeHandlers.hasOwnProperty(i)) {
                    var bridgeHandlerGroup = registerBridgeHandlers[i];
                    if (bridgeHandlerGroup) {
                        delete registerBridgeHandlers[i];
                        bridgeHandlerGroup.onMessage && bridgeInst.removeHandler(i, bridgeHandlerGroup.onMessage);
                        bridgeHandlerGroup = null;
                    }
                }
            }
            for (var i in ptInsts) {
                if (ptInsts.hasOwnProperty(i)) {
                    var ptInst = ptInsts[i];
                    if (ptInst) {
                        delete ptInsts[i];
                        ptInst.destroy();
                        ptInst = null;
                    }
                }
            }
            queue.end();
        }
    };
};

module.exports = createTaskPlatform;
