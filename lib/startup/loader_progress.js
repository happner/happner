var PORT = 55000;
var SPLASH = __dirname + '/index.htm';
var PROXY = {};
var __progressLog = [];
var __messageLog = [];
var __config = {};
var __connections = {};
var __listening = false;
var http = require('http');
var httpRequest = require('request');

function LoaderProgress(config) {

  if (!config)
    config = {};

  if (config.port)
    PORT = config.port;

  if (config.proxy) {
    PROXY.target = config.proxy;
  }

  if (!config.splash)
    config.splash = __dirname + '/index.htm';

  SPLASH = config.splash;

  __progressLog = [];
  __messageLog = [];
  __config = config;
  __connections = {};
  __listening = false;

}

LoaderProgress.prototype.listen = function (callback) {

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

    if (req.url.indexOf('/loader.htm') == 0 || req.url == ('/ping')) {
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

    // By Default we do not want to proxy, so we relocated to the laoder
    if (PROXY.target === null || PROXY.target === undefined) {
      res.writeHead(302, {'Location': '/loader.htm'});
      return res.end();
    }

    // Try Proxy to the target url
    var request = httpRequest({
      url: PROXY.target + req.url,
      method: req.method,
      headers: req.headers
    });

    req.pipe(request, {end: true})
      .on('error', function (err) {
        res.writeHead(502);
        res.write("Loader Proxy Error:" + err.code);
        return res.end();
      })
      .on('response', function (response) {
        if (response.statusCode == 404) {
          // If the Proxy server doesn't know about the page, redirect.
          // to loader page.
          res.writeHead(302, {'Location': '/loader.htm'});
          return res.end();
        }
      }).pipe(res);
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

LoaderProgress.prototype.progress = function (log, progress) {
  __progressLog.push({"log": log, "progress": progress});
}

LoaderProgress.prototype.log = function (message) {
  __messageLog.push(message);
}

LoaderProgress.prototype.stop = function () {
  if (__listening) {

    for (var key in __connections) {
      __connections[key].destroy();
    }

    this.__progressServer.close();
  }

}

module.exports = LoaderProgress;

