var Utilities = require('./utilities');
var log;

module.exports.process = function(instance, config, callback) {

  if (typeof config.name != 'string') {
    config.name = require('sillyname')().split(' ')[0].toLowerCase();
  }

  global.UTILITIES = global.UTILITIES || new Utilities(config.name, config.util);
  log = UTILITIES.createLogger('Config');
  log.$$TRACE('process()');

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

  if (config.port) {
    config.datalayer.port = config.port;
    delete config.port;
  }

  if (config.host) {
    config.datalayer.host = config.host;
    delete config.host;
  }

  callback(null, config);
}
