;(function(isBrowser) {

  var Internals, Logger, EventEmitter;

  if (isBrowser) {
    window.Happner = window.Happner || {};
    window.Happner.MeshClient = MeshClient;
    window.MeshClient = MeshClient; // TODO: deprecate this.
    Internals = Happner.Internals;
    EventEmitter = Primus.EventEmitter;
  }

  else {
    module.exports = MeshClient;
    Promise = require('bluebird');
    HappnClient = require('happn').client;
    Internals = require('./internals');
    Logger = require('happn-logger');
    EventEmitter = require('events').EventEmitter;
  }

  var extend = function(subclass, superclass) {
    Object.keys(superclass.prototype).forEach(function(method) {
      subclass.prototype[method] = superclass.prototype[method];
    });
  }

  function MeshClient(/* opts */  /* hostname, port, secret, callback */) {

    EventEmitter.call(this);

    var log;

    var args = Array.prototype.slice.call(arguments);
    var arg;

    var opts = {};
    var hostname; // first string arg
    var port;     // the only number arg
    var secret;   // second string arg
    var callback; // the only arg that's a function

    while (arg = args.shift()) {

      if (typeof arg == 'object') opts = arg
      else if (typeof arg == 'number') port = arg
      else if (typeof arg == 'string' && !hostname) hostname = arg
      else if (typeof arg == 'string') secret = arg
      else if (typeof arg == 'function') callback = arg

    }
    // xx
    hostname = hostname || opts.host || opts.hostname || opts.address;
    port = port || opts.port;
    secret = secret || opts.secoptsret;

    if (!hostname) {
      hostname = isBrowser ? window.location.hostname : 'localhost';
    }

    if (!port) {
      if (isBrowser) {
        opts.protocol = opts.protocol || window.location.href.split(':')[0];
        if (!window.location.port) {
          if (opts.protocol == 'https') {
            port = 443;
          } else {
            port = 80;
          }
        } else {
          port = window.location.port; // use the port that the page came from
        }
      }
    }

    if (!secret) {
      secret = 'mesh';
    }

    opts.hostname = opts.hostname || opts.host || hostname;
    opts.port = opts.port || port || 55000;
    opts.secret = opts.secret || secret;

    this.opts = opts;

    if (isBrowser) {
      log = Happner.createLogger('MeshClient');
    } 
    else {
      if (opts.logger && opts.logger.createLogger) {
        log = opts.logger.createLogger('MeshClient');
      }
      else if (Logger) {
        log = Logger.createContext('client').createLogger('MeshClient');
      }
      else {
        log = Happner.createLogger('MeshClient');
      }
    }

    // These should be loaded ahead of this script
    // Use http://__your.server__/api/client  (for entire package)
    // if (!Promise) console.error('Missing bluebird for Promise.');
    // if (!HappnClient) console.error('Missing HappnClient.');

    this.log = opts.log = log;

    this.log.$$DEBUG('created instance with opts', opts);

    if (typeof callback == 'function') {
      log.warn('MeshClient() with login callback is deprecated.');
      log.warn('see: https://github.com/happner/happner/blob/master/docs/client.md');
      log.info('connecting to %s:%s', hostname, port);
      return initialize(this, opts, callback);
    }

  };

  extend(MeshClient, EventEmitter);

  MeshClient.prototype.login = function(credentials, callback) {

    var _this = this;

    return new Promise(function(resolve, reject) {

      setTimeout(function PendForEmitterSubs() {

        _this.log.$$DEBUG('login()');

        if (typeof credentials == 'undefined') credentials = {};
        if (typeof credentials == 'function') {
          callback = credentials;
          credentials = {};
        }

        var cloneOpts = {};
        Object.keys(_this.opts).forEach(function(key) {
          cloneOpts[key] = _this.opts[key];
        });

        ['username', 'password', 'secret'].forEach(function(key) {
          if (credentials[key]) {
            cloneOpts[key] = credentials[key];
          }
        });
        
        if (typeof callback !== 'function') {
          callback = function() {}
        }

        // TODO: when removing old login, ensure this still returns
        //       the promise of a logged in client

        initialize(_this, cloneOpts, function(e, client) {

          if (e && e.message == 'ALREADY_HANDLED') {

            // when client script defines listener for 'login/error', 'login/deny'
            // then it is assumed the client is not using the promise and any 
            // rejection will result in 'unhandled rejection errors' so the 
            // promise is not rejected
            return;
          }

          if (e) return reject(e);

          // TODO: login resolves something usefull...
          //       already have the client on the outside

          resolve(); // PENDING (also in event('login/allow')) something useful in login result

        });

      }, 0);

    });

  }

  var initialize = function(instance, opts, callback) {

    // protect from not running `new MeshClient(...)`
    // TODO: remove this when the deprecated old login is removed

    if (! (instance instanceof MeshClient )) instance = new EventEmitter();

    var defer = Promise.defer();
    var emitter = new EventEmitter();
    var started = false;

    var client = {
      _mesh: {},
      log: opts.log,
    }

    var warned = false;
    Object.defineProperty(client, 'api', {
      get: function() {
        if (!warned) {
          console.warn('Use of client.api.* is deprecated. Use client.*');
          warned = true;
        }
        return client;
      }
    });

    var config = {
      protocol: opts.protocol || 'http',
      host: opts.hostname,
      port: opts.port,
      allowSelfSignedCerts:opts.allowSelfSignedCerts,
    };

    if (opts.username) config.username = opts.username;
    if (opts.password) config.password = opts.password;
    
    HappnClient.create({config: config, info: opts.info, Logger: opts.log}, function(e, fbclient){

      if (e) {

        if (e.name && e.name.indexOf('AccessDenied') == 0) {
          instance.emit('login/deny', e);
          if (typeof instance._events['login/deny'] !== 'undefined') {
            return callback(new Error('ALREADY_HANDLED'));
          }
          return callback(e);
        }

        // TODO: Error called back from HappnClient is not of much use in browser (possibly in nodejs too)
        //       Two page refreshes produces a null Error (it has no message)
        //       But in the background the actual error fires unreachably:
        //       WebSocket connection to 'ws://10.0.0.44:50505/primus/?_primuscb=L7lGmx-' failed: Error in connection establishment: net::ERR_ADDRESS_UNREACHABLE
        //       No page refresh leaves us hanging, then produces a slightly more usefull error after a time.

        instance.emit('login/error', e);
        if (typeof instance._events['login/error'] !== 'undefined') {
          return callback(new Error('ALREADY_HANDLED'));
        }
        return callback(e);

      }

      client.data = fbclient;
      client.session = fbclient.session;


      var buzy = false;
      var interval;
      var initializeLoop = function() {

        buzy = true; // initialize is called on interval, ensure only one running at a time.

        client.data.get('/mesh/schema/*', function(e, response){

          if (e) {
            clearInterval(interval);
            buzy = false;
            instance.emit('login/error', e);
            defer.reject(e);
            return callback(e);
          }

          if (response.length < 2) {
            buzy = false;
            client.log.warn('awaiting schema');
            return; // around again.
          }

          response.map(function(configItem){
            if (configItem._meta.path == '/mesh/schema/config') {
              client._mesh.config = configItem;
            }
            else if (configItem._meta.path == '/mesh/schema/description') {
              client._mesh.description = configItem;
            }
          });

          if (!client._mesh.config.name || !client._mesh.description.name) {
            buzy = false;
            client.log.warn('awaiting schema');
            return; // around again.
          }

          if (client._mesh.description.initializing) {
            buzy = false;
            client.log.warn('awaiting schema');
            return; // around again.
          }

          var isServer = false;
         
          Internals._initializeLocal(client, client._mesh.description, client._mesh.config, isServer, function(e) {
            if (e) {
              clearInterval(interval);
              buzy = false;
              defer.reject(e);
              return callback(e);              
            }
            
            clearInterval(interval);
            buzy = false;

            // Assign api

            instance.data = client.data;
            instance.event = client.event;
            instance.exchange = client.exchange;
            instance.token = client.session.token;

            subscribe();

          });
        });
      }

      interval = setInterval(initializeLoop, 2000); // Does not cause 'thundering herd'.
                                                   //
                                                  // This retry loop is applicable only 
                                                 // to new connections being made BETWEEN
                                                // server start and server ready.
      initializeLoop();

      var subscribe = function() {

        // TODO: subscribe to config? does it matter

        var exchange = client.exchange;
        var event = client.event;

        client.data.on( '/mesh/schema/description',

          function(description) {
            
            // call api assembly with updated subscription

            var endpointName = description.name;
            var endpoint = client._mesh.endpoints[endpointName];

            console.log('have description:::', description);
            console.log('have description cli :::', client);

            var previousDescription = endpoint.description;
            var previousComponents = Object.keys(previousDescription.components);

            endpoint.previousDescription = previousDescription;
            endpoint.description = description;

            MeshClient._updateEndpoint(client, endpointName, exchange, event,
              function(err, res) {

                if (err) {
                  // Not much can be done...
                  return client.log.error('api update failed', err);
                }

                client.log.info('api updated!');

                var updatedComponents = Object.keys(description.components);

                // TODO?: changed components/""hotswap""

                var create = updatedComponents.filter(function(name) {
                  return previousComponents.indexOf(name) == -1
                }).map(function(name) {
                  return {
                    description: JSON.parse( // deep copy description
                      JSON.stringify(       // (prevent accidental changes to live)
                        description.components[name]
                      )
                    )
                  }
                });

                var destroy = previousComponents.filter(function(name) {
                  return updatedComponents.indexOf(name) == -1
                }).map(function(name) {
                  return {
                    description: JSON.parse(
                      JSON.stringify(
                        previousDescription.components[name]
                      )
                    )
                  }
                });

                if (destroy.length > 0) instance.emit('destroy/components', destroy);
                if (create.length > 0) instance.emit('create/components', create);
              }
            )
          },

          function(e) {
            if (e) {
              client.log.error('failed on subscribe', e);
              instance.emit('login/error', e);
              callback(e);
              defer.reject(e);
              return;
            }

            client.log.info('initialized!');
            instance.emit('login/allow'); // PENDING (also in .login().resolved) something useful in login result
            callback(null, instance);

            var components = client._mesh.description.components;
            instance.emit('create/components', Object.keys(components).map(
              function(name) {
                return {
                  description: JSON.parse(JSON.stringify(components[name])),
                }
              }
            ));

            defer.resolve(instance);
          }
        );
      }
    });

    return defer.promise;
  }

})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
