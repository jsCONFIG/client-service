/**
 * node 部分监听方法，实质为一个接口
 */
const http = require('http');
const url = require('url');

const finishRes = (res, req, data) => {
    data = JSON.stringify(data || {status: 'error', code: 404});
    res.setHeader('Content-Type', 'application/json;charset=UTF-8');
    res.setHeader('Access-Control-Allow-Headers', 'X-Secret, Content-Type');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(data);
};

const createServer = function (bridgeInst) {
    const apiInfo = url.parse(bridgeInst.api);
    const ptConfig = {
        port: apiInfo.port || 80,
        domain: apiInfo.hostname || '127.0.0.1'
    };
    const server = http.createServer((req, res) => {
        if (!bridgeInst.verfiyRequest(req)) {
            finishRes(res, req, {
                status: 'error',
                code: 400,
                message: '任务非法'
            });
            return;
        }
        let body = [];
        req.on('data', function (chunk) {
            body.push(chunk);
        })
        .on('end', function () {
            if (req.method === 'GET') {
                body = url.parse(req.url, true).query;
            }
            else {
                body = Buffer.concat(body).toString();
                try {
                    body = JSON.parse(body);
                }
                catch (e) {
                    finishRes(res, req, {
                        status: 'error',
                        code: 400,
                        message: '数据非法'
                    });
                    return;
                }
            }
            var resData = bridgeInst.resolveResponse(req, body);
            finishRes(res, req, {status: 'success', data: resData});
        })
        .on('error', function (e) {
            finishRes(res, req, {status: 'error', code: 500, message: e.message});
        });
    });

    server.listen(ptConfig.port, ptConfig.domain);
    console.log(`Node listener on ${ptConfig.domain}:${ptConfig.port}`);
    return {
        destroy: function () {
            server.close();
        }
    };
};

module.exports = createServer;
