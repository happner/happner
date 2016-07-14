var PORT = 55000
  , SPLASH = __dirname + '/index.htm'
  , LOADER_PATH = {match: new RegExp('^/app'), path: __dirname + '/app'}
  , PROXY = {}
  , __loadProgress = 0
  , __progressLog = []
  , __messageLog = []
  , __config = {}
  , __connections = {}
  , __listening = false
  , http = require('http')
  , httpRequest = require('request')
  , path = require('path')
;

function LoaderProgress(config) {


  if (!config)
    config = {};

  if (config.port)
    PORT = config.port;

  if (config.proxy) {
    PROXY.target = config.proxy;
  }

  if (config.loaderPath) {
    LOADER_PATH = config.loaderPath;
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

function _catchStreamError(err, res) {
  res.writeHead(404, {"Content-Type": "text/plain"});
  res.write("404 Not Found: " + err + "\n");
  res.end();
  return;
}

function _matchPathRoute(url) {
  if (!url.match(LOADER_PATH.match)) return false;
  var targetFilename = url.replace(LOADER_PATH.match, LOADER_PATH.path);
  return path.normalize(targetFilename);
};

LoaderProgress.prototype.listen = function (callback) {

  this.__progressServer = http.createServer(function (req, res) {


    if (req.url.indexOf('/loader.htm') == 0) {
      var fileStream = require('fs').createReadStream(SPLASH);
      fileStream.on('error', function (err) {
        _catchStreamError(err, res)
      });
      return fileStream.pipe(res);
    }

    var targetFile = _matchPathRoute(req.url);

    if (targetFile) {
      var fileStream = require('fs').createReadStream(targetFile);
      fileStream.on('error', function (err) {
        _catchStreamError(err, res)
      });
      return fileStream.pipe(res);
    }

    if (req.url == '/log') {
      res.write(JSON.stringify(__messageLog));
      return res.end();
    }

    if (req.url == '/progress') {
      res.write(JSON.stringify(__progressLog));
      return res.end();
    }

    if (req.url == '/config') {
      res.write(JSON.stringify(__config));
      return res.end();
    }

    if (req.url == '/ping') {
      res.write(JSON.stringify({"happner-loader %": __loadProgress}));
      return res.end();
    }

    // By Default we do not want to proxy, so we relocated to the loader
    if (PROXY.target === null || PROXY.target === undefined) {
      var fileStream = require('fs').createReadStream(SPLASH);
      fileStream.on('error', function (err) {
        _catchStreamError(err, res)
      });
      return fileStream.pipe(res);
    }

    // Try Proxy to the target url
    var request = httpRequest({
      url: PROXY.target + req.url,
      method: req.method,
      headers: req.headers,
      followRedirect: false
    });

    req.pipe(request, {end: true})
      .on('error', function (err) {
        res.writeHead(502);
        res.write("Loader Proxy Error:" + err.code);
        return res.end();
      })
      .on('response', function (response) {
        if (response.statusCode == 404) {
          // If the Proxy server doesn't know about the page, serve
          // up the splash screen.
          var fileStream = require('fs').createReadStream(SPLASH);
          fileStream.on('error', function (err) {
            _catchStreamError(err, res)
          });
          return fileStream.pipe(res);
        } else {
          res.writeHead(response.statusCode, response.headers);
          response.pipe(res)
        }
      })
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
};

LoaderProgress.prototype.progress = function (log, progress) {

  __loadProgress = progress;
  __progressLog.push({"log": log, "progress": progress});
};

LoaderProgress.prototype.log = function (message) {
  __messageLog.push(message);
};

LoaderProgress.prototype.stop = function () {
  if (__listening) {

    for (var key in __connections) {
      __connections[key].destroy();
    }
    this.__progressServer.close();
  }
};

module.exports = LoaderProgress;

