// var utilities = require('./utilities');
var shortid = require('shortid');
var sillyname = require('sillyname');

module.exports = Config;

function Config() {

}

Config.prototype.process = function(mesh, config, callback) {
  var serializer;

  this.log = mesh.log.createLogger('Config');
  this.log.$$TRACE('process()');

  // process shortform endpoints
  Object.keys(config.endpoints || {}).forEach(function(name) {
    var econf = config.endpoints[name];
    if (!isNaN(parseInt(econf))) {
      config.endpoints[name] = {
        config: {
          port: parseInt(econf)
        }
      }
    } else if (typeof econf == 'string') {
      var pp = econf.split(':')
      config.endpoints[name] = {
        config: {
          host: pp[0].trim(),
          port: parseInt(pp[1].trim())
        }
      }
    }
  });

  config.endpoints = config.endpoints || {};

  // Move component.datalayer to component.data
  Object.keys(config.components || {}).forEach(function(name) {
    var component = config.components[name];
    if (component.data) return;
    if (!component.datalayer) return;
    component.data = component.datalayer;
    delete component.datalayer;
  });

  if (config.exchange && (serializer = config.exchange.serializer)) {

    if (typeof serializer == 'string') {
      try {
        mesh._mesh.serializer = this.validateSerializer(require(serializer));
      } catch (e) {
        this.log.warn('serializer load failed', e);
      } 
    } else {
      mesh._mesh.serializer = this.validateSerializer(serializer);
    }


  }

  callback(null, config);
}

Config.prototype.validateSerializer = function(it) {
  if (typeof it.__encode !== 'function' 
    || typeof it.__decode !== 'function') {
    this.log.warn('invalid serializer ignored');
    return;
  }
  return it;
}
