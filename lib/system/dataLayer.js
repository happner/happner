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

  config.datalayer = (config.datalayer || {});
  config.datalayer.authTokenSecret = (config.datalayer.authTokenSecret || 'mesh');
  config.datalayer.secret = (config.datalayer.secret || config.datalayer.systemSecret || 'mesh');
  config.datalayer.setOptions = (config.datalayer.setOptions || {});
  config.datalayer.setOptions.timeout = (config.datalayer.setOptions.timeout || 10000);
  if (typeof config.datalayer.setOptions.noStore != 'boolean') {
    config.datalayer.setOptions.noStore = true;
  }

  happnServer.initialize({
    port: config.datalayer.port ? config.datalayer.port : 55000,
    host: config.datalayer.host ? config.datalayer.host : "localhost",
    mode: 'embedded', 
    services: {
      auth: {
        path:'./services/auth/service.js',
        config: {
          authTokenSecret: config.datalayer.authTokenSecret,
          systemSecret: config.datalayer.secret
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
