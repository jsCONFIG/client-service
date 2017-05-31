/**
 * pt 服务启动文件
 */

var child_process = require('child_process');
var log = require('../../lib/log');
var utils = require('../../lib/utils');

var ptEntry = function (taskFile, params, opts) {
    opts = Object.assign({
        onEnd: utils.emptyFn,
        debug: false
    }, opts);
    var childOpts = {};
    if (opts.debug) {
        childOpts = {
            // 子进程直接使用父进程的IO
            stdio: 'inherit'
        };
    }
    // 初始化pt实例
    var childProcess = child_process.spawn(
        'phantomjs',
        [taskFile, JSON.stringify(params), opts.bridgeId, opts.bridgeApi, opts.secret],
        childOpts
    );
    log('Child pid: ' + childProcess.pid + ', with file: ' + taskFile, 'debug', 'PT_BOOT');

    childProcess.on('exit', function (code) {
        log('Pt spawnEXIT:' + code, 'debug', 'PT_BOOT');
        opts.onEnd(null, opts.jobId);
    });

    var exitChild = () => {
        log('Pt destroy fired', 'debug', 'PT_BOOT');
        childProcess.kill('SIGKILL');
    };
    return {
        phantom: childProcess,
        destroy: exitChild
    };
};

module.exports = {
    entry: ptEntry
};
