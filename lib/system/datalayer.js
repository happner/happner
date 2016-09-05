var Happn = require('happn')
  , happnServer = Happn.service
  , fs = require('fs-extra')
  , path = require('path')
  , EventEmitter = require('events').EventEmitter
;

module.exports.create = function (mesh, config, callback) {

  var log = mesh.log.createLogger('DataLayer');

  var access = {};
  access.serverReady = false;
  access.serverError = null;
  access.clientReady = false;
  access.clientError = null;

  access.listen = function (callback) {
    if (!this.__toListenInstance)
      return callback(new Error('no instance waiting for listen command'));

    this.__toListenInstance.listen(callback);
  }.bind(access);

  var store = {};
  store.server = null;
  store.client = null;
  store.events = new EventEmitter(); // proxy events from pubsub in happn

  Object.keys(store).forEach(
    function (key) {
      Object.defineProperty(access, key, {
        get: function () {
          return store[key];
        },
        enumerable: true,
      })
    }
  );

  config.datalayer = config.datalayer || {};

  if (config.secure)
    config.datalayer.secure = true;

  if (config.dataLayer) {
    Object.keys(config.dataLayer).forEach(function (key) {
      config.datalayer[key] = config.dataLayer[key];
    });
  }
  delete config.dataLayer;

  if (typeof config.port !== 'undefined') {
    if (typeof config.datalayer.port == 'undefined') {
      config.datalayer.port = config.port;
    }
    delete config.port;
  }

  if (typeof config.datalayer.port == 'undefined')
    config.datalayer.port = 55000;

  if (config.host) {
    config.datalayer.host = config.host;
    delete config.host;
  }

  if (config.datalayer.dbfile && !config.datalayer.filename)
    config.datalayer.filename = config.datalayer.dbfile;

  var adminUser = {};

  if (config.datalayer.adminPassword)
    adminUser.password = config.datalayer.adminPassword;
  else
    adminUser.password = require('shortid').generate();

  if (!config.datalayer.sessionTokenSecret)
    config.datalayer.sessionTokenSecret = require('shortid').generate();

  var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

  var defaultDBFilepart = config.name;
  if (!defaultDBFilepart) defaultDBFilepart = require('shortid').generate();
  // creates a new file with every mesh re start
  var defaultDbFile = homeDir + path.sep + '.happn' + path.sep + 'data' + path.sep + defaultDBFilepart /* + '-' + Date.now().toString()*/ + '.nedb';
  var dbfile;

  config.datalayer.setOptions = (config.datalayer.setOptions || {});
  config.datalayer.setOptions.timeout = (config.datalayer.setOptions.timeout || 10000);

  if (typeof config.datalayer.setOptions.noStore != 'boolean') {
    config.datalayer.setOptions.noStore = true;
  }

  var exclusions, cookieName, cookieDomain;

  if (!config.datalayer.transport)
    config.datalayer.transport = {mode: 'http'};

  if (config.datalayer.secure) {

    if (!config.datalayer.middleware)
      config.datalayer.middleware = {};

    if (!config.datalayer.middleware.security)
      config.datalayer.middleware.security = {};

    if (!config.datalayer.middleware.security.exclusions) {
      config.datalayer.middleware.security.exclusions = ['/api/client', '/primus/*', '/rest/login', '/rest/method/*'];
    } else {
      exclusions = config.datalayer.middleware.security.exclusions;
      if (exclusions.indexOf('/api/client') < 0) exclusions.push('/api/client');
      if (exclusions.indexOf('/rest/login') < 0) exclusions.push('/rest/login');
      if (exclusions.indexOf('/primus/*') < 0) exclusions.push('/primus/*');
      if (exclusions.indexOf('/rest/method/*') < 0) exclusions.push('/rest/method/*');
    }

    cookieName = config.datalayer.middleware.security.cookieName;
    cookieDomain = config.datalayer.middleware.security.cookieDomain;
  }

  var datalayerConfig = {
    secure: config.datalayer.secure ? true : false,
    transport: config.datalayer.transport,
    utils: {
      Logger: mesh.log
    },
    port: typeof config.datalayer.port !== 'undefined' ? config.datalayer.port : 55000,
    host: config.datalayer.host ? config.datalayer.host : "0.0.0.0",
    mode: 'embedded',
    services: {
      security: {
        path: './services/security/service.js',
        config: {
          sessionTokenSecret: config.datalayer.sessionTokenSecret,
          adminUser: adminUser,
          cookieName: cookieName,
          cookieDomain: cookieDomain
        }
      },
      data: {
        path: './services/data_embedded/service.js',
        config: {}
      },
      pubsub: {
        path: './services/pubsub/service.js'
      }
    },
  }

  if (config.datalayer.deferListen)
    datalayerConfig.deferListen = config.datalayer.deferListen;

  if (config.datalayer.plugin)
    datalayerConfig.services.data.path = config.datalayer.plugin;

  if (config.datalayer.config)
    datalayerConfig.services.data.config = config.datalayer.config;

  if (config.datalayer.filename) config.datalayer.persist = true;

  //set the compactInterval
  if (config.datalayer.compactInterval) {
    if (!datalayerConfig.services.data.config)
      datalayerConfig.services.data.config = {};

    datalayerConfig.services.data.config.compactInterval = config.datalayer.compactInterval;
  }

  if (datalayerConfig.services.data.path == './services/data_embedded/service.js' //embedded mode has the notion of dbfiles
    && config.datalayer.persist) {

    try {

      dbfile = config.datalayer.filename = config.datalayer.filename || defaultDbFile;
      fs.ensureDirSync(path.dirname(dbfile));
      fs.writeFileSync(dbfile + '.test1', 'ping');
      // fs.moveSync(dbfile + '.test1', dbfile + '.test2');
      log.info('persisting %s', dbfile);

      if (!config.datalayer.defaultRoute) {
        config.datalayer.defaultRoute = config.datalayer.persist ? 'persist' : 'mem';
      }

      // Datastores have no starting patterns (see commented out below)
      // Instead the 'defaultRoute' is used.
      // BUT: components can register their own routes to override the default

      datalayerConfig.services.data.config.datastores = [
        {
          name: 'persist',
          isDefault: config.datalayer.defaultRoute == "persist",
          settings: {
            filename: dbfile
          },
          patterns: [
            '/_SYSTEM/*'//system stuff should get persisted
          ]
        },
        {
          name: 'mem',
          isDefault: config.datalayer.defaultRoute == "mem",
          patterns: [
            // '/_mem/*'
          ]
        }
      ]

    } catch (e) {
      //TODO - is this really a good idea, you may think you are persisting, but actually are not...?
      log.warn('no read/write at %s', dbfile);
      log.warn('continuing without persistance');
      config.datalayer.persist = false;
      delete config.datalayer.filename;

    } finally {
      try {
        fs.unlinkSync(dbfile + '.test1');
      } catch (e) {
      } finally {
        try {
          // fs.unlinkSync(dbfile + '.test2');
        } catch (e) {
        } finally {

        }
      }
    }
  }

  if (config.name)
    datalayerConfig.name = config.name;

  if (config.datalayer.middleware)
    datalayerConfig.middleware = config.datalayer.middleware;

  if (config.datalayer.encryptPayloads)
    datalayerConfig.encryptPayloads = config.datalayer.encryptPayloads;

  if (config.datalayer.keyPair)
    datalayerConfig.keyPair = config.datalayer.keyPair;

  happnServer.create(datalayerConfig,
    function (e, happnInstance) {
      if (e) {
        access.serverError = e;
        return callback(e);
      }

      log.$$DEBUG('server ready');
      access.serverReady = true;
      store.server = happnInstance;

      if (datalayerConfig.deferListen)
        access.__toListenInstance = happnInstance;

      store.server.services.pubsub.on('disconnect', function (ev) {
        try {
          if (!ev.info._browser) {
            log.info('\'%s\' disconnected', (ev.info.mesh.name || 'anonymous'));
          }
        } catch (e) {
        }
        //log.$$TRACE('detatch', ev.info);
        store.events.emit('detatch', ev);
      });

      store.server.services.pubsub.on('authentic', function (ev) {
        try {
          if (!ev.info.browser) {
            log.info('\'%s\' connected', (ev.info.mesh.name || 'anonymous'));
          }
        } catch (e) {
        }
        //log.$$TRACE('attach', ev.info);
        store.events.emit('attach', ev);
      });

      if (!adminUser.username)
        adminUser.username = '_ADMIN';

      config.name = happnInstance.services.system.name;

      adminUser.keyPair = happnInstance.services.security._keyPair;

      Happn.client.create({

        Logger: mesh.log,
        secure: config.datalayer.secure,
        plugin: Happn.client_plugins.intra_process,
        context: happnInstance,
        config: adminUser

      }, function (e, clientInstance) {

        if (e) {
          access.clientError = e;
          return callback(e);
        }

        log.$$DEBUG('client ready');
        access.clientReady = true;
        store.client = clientInstance;

        store.client.set('/test/write', {'can': 'can'}, function (e, resp) {

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
          //
          // only available after server mesh.initialize()

          callback(null, clientInstance);
        });
      });
    });

  return access;
};
