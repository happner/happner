var fork = require('child_process').fork;
var path = require('path');

function ProxyManager(){

}

ProxyManager.prototype.__remote = null;

ProxyManager.prototype.start = function(config, callback){

  var _this = this;

  if (typeof config == 'function'){
    callback = config;
    config = null;
  }

  if (!config)
    config = {};

  if (!config.port)
    config.port = 55000;

  if (this.__remote)
    return callback(new Error('proxy was already started, first call stop'));

  var proxyPath = __dirname + path.sep + 'proxy.js';

  _this.__remote = fork(proxyPath, [config.port.toString()]);
  _this.__remote.on('message', function(data) {

    var result = data.toString();

    if (result.substring(0, 7) == 'STARTED')
      return callback(null);

    _this.stop();
    callback(JSON.parse(data));

  });
}

ProxyManager.prototype.stop = function(){

  if (!this.__remote) return;

  this.__remote.kill();
  this.__remote = null;

}

ProxyManager.prototype.progress = function(log, percentComplete){
  if (!this.__remote) return;
  this.__remote.send(JSON.stringify({log:log, percentComplete:percentComplete}));
}

module.exports = ProxyManager;
