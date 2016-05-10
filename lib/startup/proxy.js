
var PORT = 55000;

if (process.argv.length >= 3)
  PORT = process.argv[2];

var http = require('http'),
  url = require('url'),
  path = require('path'),
  fs = require('fs');

var mimeTypes = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css"};

var proxyServer = http.createServer(function(req, res) {

  var uri = url.parse(req.url).pathname;
  var filename = path.join(process.cwd(), uri);
  path.exists(filename, function(exists) {

    if(!exists) {
      response.writeHead(302, {'Location': '/index.htm'});
      return response.end();
    }

    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    res.writeHead(200, mimeType);

    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);

  }); //end path.exists

});

proxyServer.on('listening', function(){
  console.log('STARTED');
})

proxyServer.listen(PORT);
