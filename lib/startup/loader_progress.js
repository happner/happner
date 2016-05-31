var PORT = 55000;
var SPLASH = __dirname + '/index.htm';
var __progressLog = [];
var __messageLog = [];
var __config = {};
var __connections = {};
var __listening = false;
var http = require('http');

function LoaderProgress(config){

  if (!config)
    config = {};

  if (config.port)
    PORT = config.port;

  if (!config.splash)
    config.splash = __dirname + '/index.htm';

  SPLASH = config.splash;

  __progressLog = [];
  __messageLog = [];
  __config = config;
  __connections = {};
  __listening = false;

}

LoaderProgress.prototype.listen = function(callback) {

  this.__progressServer = http.createServer(function (req, res) {

    if (req.url == '/log') {
      res.write(JSON.stringify(__messageLog));
      return res.end();
    }

    if (req.url == '/grid') {
      var fileStream = require('fs').createReadStream(__dirname + '/app/rwdgrid.min.css');
      return fileStream.pipe(res);
    }

    if (req.url == '/logo') {
      var fileStream = require('fs').createReadStream(__dirname + '/app/logo.png');
      return fileStream.pipe(res);
    }

    if (req.url == '/nanobar') {
      var fileStream = require('fs').createReadStream(__dirname + '/app/nanobar.min.js');
      return fileStream.pipe(res);
    }

    if (req.url == '/promise') {
      var fileStream = require('fs').createReadStream(__dirname + '/app/promise.min.js');
      return fileStream.pipe(res);
    }

    if (req.url == '/client') {
      var fileStream = require('fs').createReadStream(__dirname + '/app/proxy_client.js');
      return fileStream.pipe(res);
    }

    if (req.url.indexOf('/index.htm') == 0) {
      var fileStream = require('fs').createReadStream(SPLASH);
      return fileStream.pipe(res);
    }

    if (req.url == '/progress') {
      res.write(JSON.stringify(__progressLog));
      return res.end();
    }

    if (req.url == '/config') {
      res.write(JSON.stringify(__config));
      return res.end();
    }

    res.writeHead(302, {'Location': '/index.htm'});
    return res.end();

  });

  this.__progressServer.on('connection', function (conn) {
    var key = conn.remoteAddress + ':' + conn.remotePort;
    __connections[key] = conn;
    conn.on('close', function () {
      delete __connections[key];
    });
  });

  this.__progressServer.on('listening', function () {
    __listening = true;
    callback();
  });

  this.__progressServer.on('error', function (e) {
    callback(e);
  });

  try {
    this.__progressServer.listen(PORT);
  } catch (e) {
    callback(e);
  }
}

LoaderProgress.prototype.progress = function(log, progress){
  __progressLog.push({"log":log, "progress":progress});
}

LoaderProgress.prototype.log = function(message){
  __messageLog.push(message);
}

LoaderProgress.prototype.stop = function(){
  if (__listening){

    for (var key in __connections) {
      __connections[key].destroy();
    }

    this.__progressServer.close();
  }

}

module.exports = LoaderProgress;

