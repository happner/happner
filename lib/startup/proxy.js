var PORT = 55000;
var SPLASH = __dirname + '/index.htm';

if (process.argv.length >= 3)
  PORT = process.argv[2];

if (process.argv.length >= 4)
  SPLASH = process.argv[3];

var http = require('http'),
  url = require('url'),
  path = require('path'),
  fs = require('fs');

progressLog = [];

var proxyServer = http.createServer(function(req, res) {

  if (req.url == '/client'){
    var fileStream = fs.createReadStream(__dirname + '/app/proxy_client.js');
    return fileStream.pipe(res);
  }

  if (req.url == '/index.htm'){
    var fileStream = fs.createReadStream(SPLASH);
    return fileStream.pipe(res);
  }

  if (req.url == '/progress'){
    res.write(JSON.stringify(progressLog));
    return res.end();
  }

  res.writeHead(302, {'Location': '/index.htm'});
  return res.end();

});

proxyServer.on('listening', function(){
  if (process.send)
    process.send('STARTED');
})

if (process.on)
  process.on('message', function(data){
    progressLog.push(JSON.parse(data));
  })

proxyServer.listen(PORT);
