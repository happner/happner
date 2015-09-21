var Happn = require('happn');
var happnServer = Happn.service;
var fs = require('fs-extra');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

module.exports.create = function(mesh, config, callback) {

  var log = mesh.log.createLogger('DataLayer');

  log.$$TRACE('create()');

  var access = {};
    access.serverReady = false;
    access.serverError = null;
    access.clientReady = false;
    access.clientError = null;

  var store = {};
    store.server = null;
    store.client = null;
    store.events = new EventEmitter(); // proxy events from pubsub in happn

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

  var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  var defaultDbFile = homeDir + path.sep + '.happn' + path.sep + 'data' + path.sep + config.name + '.nedb';
  var dbfile;

  if (config.datalayer.persist) {
    try {
      dbfile = config.datalayer.dbfile = config.datalayer.dbfile || defaultDbFile;
      fs.ensureDirSync(path.dirname(dbfile));
      fs.writeFileSync(dbfile + '.test1', 'ping');
      // fs.moveSync(dbfile + '.test1', dbfile + '.test2');
      log.info('persisting %s', dbfile);
    } catch (e) {
      log.warn('no read/write at %s', dbfile);
      log.warn('continuing without persistance');
      config.datalayer.persist = false;
      delete config.datalayer.dbfile;
    } finally {
      try {
        fs.unlinkSync(dbfile + '.test1');
      } catch(e) {} finally {
        try {
          // fs.unlinkSync(dbfile + '.test2');
        } catch(e) {} finally {
          
        }
      }
    }
  }

  happnServer.create({
    utils: {
      Logger: mesh.log
    },
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
        path: './services/data_embedded/service.js',
        config:{
          dbfile: config.datalayer.dbfile
        }
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


    store.server.services.pubsub.on('disconnect', function(ev) {
      try {
        if (!ev.info._browser) {
          log.info('\'%s\' disconnected', (ev.info.happner.mesh.name || 'anonymous'));
        }
      } catch (e) {}
      log.$$TRACE('detatch', ev.info);
      store.events.emit('detatch', ev);
    });

    store.server.services.pubsub.on('authentic', function(ev) {
      try {
        if (!ev.info.browser) {
          log.info('\'%s\' connected', (ev.info.happner.mesh.name || 'anonymous'));
        }
      } catch (e) {}
      log.$$TRACE('attach', ev.info);
      store.events.emit('attach', ev);
    });

    Happn.client.create({

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

      store.client.set('/test/write', {'can':'can'}, function(e, resp){

        if (e) {
          if (e instanceof Error) {
            e.message = 'DataLayer test failed: ' + e.message;
            return callback(e, null);
          }
          // could still be throwing strings
          return callback(e, null);
        }

        // MeshNode uses the client.
        // Has access to server in _mesh.datalayer.server
        //                                          //
                                                   // only available after server mesh.initialize()

        callback(null, clientInstance);
      });
    });
  });
  
  return access;
};
