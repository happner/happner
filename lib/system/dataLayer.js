var Happn = require('@smc/happn');
var happnServer = Happn.service;
var log;

module.exports.create = function(config, callback) {

  log = log || UTILITIES.createLogger('DataLayer');

  log.$$TRACE('create()');

  var access = {};
    access.serverReady = false;
    access.serverError = null;
    access.clientReady = false;
    access.clientError = null;

  var store = {};
    store.server = null;
    store.client = null;

  Object.keys(store).forEach(
    function(key) {
      Object.defineProperty(access, key, {
        get: function() {
          return store[key];
        },
        enumerable: true,
      })
    }
  );

  config = (config || {});
  config.authTokenSecret = (config.authTokenSecret || 'mesh');
  config.systemSecret = (config.systemSecret || 'mesh');
  config.setOptions = (config.setOptions || {});
  config.setOptions.timeout = (config.setOptions.timeout || 10000);
  if (typeof config.setOptions.noStore != 'boolean') {
    config.setOptions.noStore = true;
  }

  happnServer.initialize({
    port: config.port ? config.port : 8000,
    host: config.host ? config.host : "localhost",
    mode: 'embedded', 
    services: {
      auth: {
        path:'./services/auth/service.js',
        config: {
          authTokenSecret: config.authTokenSecret,
          systemSecret: config.systemSecret
        }
      },
      data: {
        path: './services/data_embedded/service.js'
      },
      pubsub: {
        path: './services/pubsub/service.js'
      }
    },
  },
  function(e, happnInstance){
    if (e) {
      access.serverError = e;
      return callback(e);
    }

    log.$$DEBUG('server ready');
    access.serverReady = true;
    store.server = happnInstance;

    new Happn.client({

      plugin: Happn.client_plugins.intra_process,
      context: happnInstance

    }, function(e, clientInstance) {
      if (e) {
        access.clientError = e;
        return callback(e);
      }

      log.$$DEBUG('client ready');
      access.clientReady = true;
      store.client = clientInstance;
      callback(null, clientInstance);
    });
  });
  
  return access;
};
