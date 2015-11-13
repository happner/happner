var Utilities = require('./utilities');

module.exports = Config;

function Config() {

}

Config.prototype.process = function(instance, config, callback) {
  var serializer;

  if (typeof config.name != 'string') {
    config.name = require('sillyname')().split(' ')[0].toLowerCase();
  }

  global.UTILITIES = global.UTILITIES || new Utilities(config.util);

  instance.log = UTILITIES.createContext(config.name);

  this.log = instance.log.createLogger('Config');
  this.log.$$TRACE('process()');

  config.datalayer = config.datalayer || config.dataLayer || {};
  delete config.dataLayer;

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

  if (config.port) {
    config.datalayer.port = config.port;
    delete config.port;
  }

  if (typeof config.datalayer.port == 'undefined')
    config.datalayer.port = 55000;

  if (config.host) {
    config.datalayer.host = config.host;
    delete config.host;
  }

  if (config.exchange && (serializer = config.exchange.serializer)) {

    if (typeof serializer == 'string') {
      try {
        instance._mesh.serializer = this.validateSerializer(require(serializer));
      } catch (e) {
        this.log.warn('serializer load failed', e);
      } 
    } else {
      instance._mesh.serializer = this.validateSerializer(serializer);
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
