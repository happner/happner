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

  if (req.url == '/grid'){
    var fileStream = fs.createReadStream(__dirname + '/app/rwdgrid.min.css');
    return fileStream.pipe(res);
  }

  if (req.url == '/logo'){
    var fileStream = fs.createReadStream(__dirname + '/app/logo.png');
    return fileStream.pipe(res);
  }

  if (req.url == '/nanobar'){
    var fileStream = fs.createReadStream(__dirname + '/app/nanobar.min.js');
    return fileStream.pipe(res);
  }

  if (req.url == '/promise'){
    var fileStream = fs.createReadStream(__dirname + '/app/promise.min.js');
    return fileStream.pipe(res);
  }

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
});

proxyServer.on('error', function(e){
  if (process.send)
    process.send(JSON.stringify(e));
});

if (process.on)
  process.on('message', function(data){
    progressLog.push(JSON.parse(data));
  })

try{
  proxyServer.listen(PORT);
}catch(e){
  process.send(JSON.stringify(e));
}
