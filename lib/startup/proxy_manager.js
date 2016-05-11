var spawn = require('child_process').spawn;
var path = require('path');

function ProxyManager(){

}

ProxyManager.prototype.__remote = null;

ProxyManager.prototype.start = function(config, callback){

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
  console.log('PROXY PATH:::', proxyPath);

  this.__remote = spawn('node', [proxyPath, config.port.toString()]);

  this.__remote.stdout.on('data', function(data) {

    var result = data.toString();

    if (result.substring(0, 7) == 'STARTED')
      return callback(null);

    this.end();
    callback(new Error(data));

  });
}

ProxyManager.prototype.stop = function(){

  if (!this.__remote) return;

  this.__remote.kill();
  this.__remote = null;

}

module.exports = ProxyManager;
