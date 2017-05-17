# Client-service
Provide general headless browser service based on phantomjs.

>Make sure you have installed the phantomjs.

## Install
```
# intall client-service
npm install client-service

# install client-service-bridge
npm install client-service-bridge
```

## Example

__client.js__(Phantomjs)

```
// You need to install "client-service-bridge".
var clientTools = require('client-service-bridge');
var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = {
	width: 1920,
	height: 1080
};

page.open('http://phantomjs.org', function (status) {
  var base64 = page.renderBase64('PNG');
  clientTools.send(base64, function (status, res) {
  	phantom.exit();
  });
});
```

__entry.js__(Node)

```
var HeadlessBrowserEnv = require('client-service');

var inst = new HeadlessBrowserEnv();
var taskPath = 'xxxxx/client.js';
inst.run(taskPath, {}, {
    onMessage: function (bridgeMethod, bridgeData, resDataForBridge) {
        console.log(bridgeData);
    }
});

```

## API

### var hdlInst  = new HeadlessBrowserEnv([bridgeApi], [opts])
* bridgeApi: Used to communicate with bridge. Default `http://127.0.0.1:2333`;
* opts:
	* opts.buildBridgeServer: Automatically create a bridge service. Default `true`;
	* opts.secret: secret for bridge api(compare with req.headers['x-secret']).


### hdlInst.run(jobFilePath, jobParams, [opts]);
* jobFilePath: Js file which running on phantomjs environment.
* jobParams: Parameters for jobFile.
* opts.onMessage(bridgeMethod, bridgeData, resDataForBridge): 
	* bridgeMethod: `GET`/`POST`;
	* bridgeData: `clientTools.send(xxxx);`
	* resDataForBridge: `clientTools.send(..., function (xx, res) {});`

### hdlInst.verifyRequest(req);
Verify bridge request(If you set `opts.buildBridgeServer = false`, and create bridge server by yourself, you can use this method to verify request.).

### hdlInst.resolveResponseData(req, reqParams);
Resolve response data for bridge(If you set `opts.buildBridgeServer = false`, and create bridge server by yourself, you can use this method to resolve data for response.).

