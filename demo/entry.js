var path = require('path');
var HeadlessBrowserEnv = require('../services/headless-browser-service');

var inst = new HeadlessBrowserEnv();
var taskPath = path.resolve(__dirname, './client.js');
inst.run(taskPath, {}, {
    onMessage: function (bridgeMethod, bridgeData, resDataForBridge) {
        console.log(bridgeData);
    }
});