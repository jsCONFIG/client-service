// You need to install "client-service-bridge"
var clientTools = require('client-service-bridge');
var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = {
    width: 1920,
    height: 1080
};

page.open('https://github.com', function (status) {
  var base64 = page.renderBase64('PNG');
  clientTools.send(base64, function (status, res) {
    phantom.exit();
  });
});