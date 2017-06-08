;(function (isBrowser) {

  var Internals, Logger, EventEmitter;

  // 'reconnect-scheduled' event becomes 'reconnect/scheduled'
  var deprecatedReconnectScheduledEventWarned = false;
  // 'reconnect-successful' event becomes 'reconnect/successful'
  var deprecatedReconnectSuccessfulEventWarned = false;
  // 'connection-ended' event becomes 'connection/ended'
  var deprecatedConnectionEndedEventWarned = false;
  // 'destroy/components' event becomes 'components/destroyed'
  var deprecatedDestroyComponentsWarned = false;
  // 'create/components' event becomes 'components/created'
  var deprecatedCreateComponentsWarned = false;

  if (isBrowser) {

    window.Happner = window.Happner || {};
    window.Happner.MeshClient = MeshClient;
    window.MeshClient = MeshClient; // TODO: deprecate this.
    Internals = Happner.Internals;
    EventEmitter = Primus.EventEmitter;

  } else {

    module.exports = MeshClient;
    Promise = require('bluebird');
    HappnClient = require('happn').client;
    Internals = require('./internals');
    Logger = require('happn-logger');
    EventEmitter = require('events').EventEmitter;
  }

  var extend = function (subclass, superclass) {
    Object.keys(superclass.prototype).forEach(function (method) {
      subclass.prototype[method] = superclass.prototype[method];
    });
  };

  function MeshClient(/* opts */  /* hostname, port, token, callback */) {

    EventEmitter.call(this);

    var log;

    var args = Array.prototype.slice.call(arguments);
    var arg;

    var opts = {};
    var hostname; // first string arg
    var port;     // the only number arg
    var callback; // the only arg that's a function

    while (arg = args.shift()) {

      if (typeof arg == 'object') opts = arg;
      else if (typeof arg == 'number') port = arg;
      else if (typeof arg == 'string') hostname = arg;
      else if (typeof arg == 'function') callback = arg;
    }
    // xx
    hostname = hostname || opts.host || opts.hostname || opts.address;
    port = port || opts.port;

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

    opts.hostname = opts.hostname || opts.host || hostname;
    opts.port = opts.port || port || 55000;

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

  MeshClient.prototype.login = function (credentials, callback) {

    var _this = this;

    return new Promise(function (resolve, reject) {

      setTimeout(function PendLoginAttemptForEmitterSubscriptions() {

        _this.log.$$DEBUG('login()');

        if (typeof credentials == 'undefined') credentials = {};
        if (typeof credentials == 'function') {
          callback = credentials;
          credentials = {};
        }

        var cloneOpts = {};
        Object.keys(_this.opts).forEach(function (key) {
          cloneOpts[key] = _this.opts[key];
        });

        ['username', 'password', 'token', 'info'].forEach(function (key) {
          if (credentials[key]) {
            cloneOpts[key] = credentials[key];
          }
        });

        if (typeof callback !== 'function') {
          callback = function () {
          }
        }

        // TODO: when removing old login, ensure this still returns
        //       the promise of a logged in client

        initialize(_this, cloneOpts, function (e, client) {

          if (e && e.handled) {

            // when client script defines listener for 'login/error', 'login/deny'
            // then it is assumed the client is not using the promise and any
            // rejection will result in 'unhandled rejection errors' so the
            // promise is not rejected
            //
            // but the error still goes to callback
            callback(e);
            return
          }

          if (e) {
            callback(e);
            reject(e);
            return
          }

          // TODO: login resolves something useful...
          //       already have the client on the outside

          _this.clientInstance = client;

          callback();
          resolve(); // PENDING (also in event('login/allow')) something useful in login result

        });
      }, 0);
    });
  };

  MeshClient.prototype.disconnect = function (opts, cb) {
    try {

      if (typeof opts == 'function'){
        cb = opts;
        opts = null;
      }

      if (this.clientInstance && this.clientInstance.data) {
        if (typeof cb == 'function') return this.clientInstance.data.disconnect(opts, cb);
        return this.clientInstance.data.disconnect(opts);
      }
      if (typeof cb == 'function') return setImmediate(cb);
    } catch (e) {
      if (this.log) this.log.warn('client disconnection failed: ', e);
    }
  };

  var initialize = function (instance, opts, callback) {

    // protect from not running `new MeshClient(...)`
    // TODO: remove this when the deprecated old login is removed

    if (!(instance instanceof MeshClient )) instance = new EventEmitter();

    var defer = Promise.defer();

    var client = {
      _mesh: {},
      log: opts.log,
      updateSession: function (session) {
        var _this = this;
        _this.session = session;
        if (_this._mesh && _this._mesh.endpoints) {
          Object.keys(_this._mesh.endpoints).forEach(function (endpointName) {
            _this._mesh.endpoints[endpointName].messenger.updateSession(session);
          });
        }
      }
    };

    var warned = false;
    Object.defineProperty(client, 'api', {
      get: function () {
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
      allowSelfSignedCerts: opts.allowSelfSignedCerts,
    };

    if (opts.username) config.username = opts.username;
    if (opts.password) config.password = opts.password;
    if (opts.token) config.token = opts.token;
    if (opts.pubsub) config.pubsub = opts.pubsub;

    if (instance.data && instance.data.initialized)
      instance.data.disconnect(createClient);
    else
      createClient();

    function createClient() {
      HappnClient.create({config: config, info: opts.info, Logger: opts.log}, function (e, fbclient) {

        if (e) {

          if (e.name && e.name.indexOf('AccessDenied') == 0) {
            instance.emit('login/deny', e);
            if (typeof instance._events !== 'undefined' && typeof instance._events['login/deny'] !== 'undefined') {
              e.handled = true;
              return callback(e);
            }
            return callback(e);
          }

          // TODO: Error called back from HappnClient is not of much use in browser (possibly in nodejs too)
          //       Two page refreshes produces a null Error (it has no message)
          //       But in the background the actual error fires unreachably:
          //       WebSocket connection to 'ws://10.0.0.44:50505/primus/?_primuscb=L7lGmx-' failed: Error in connection establishment: net::ERR_ADDRESS_UNREACHABLE
          //       No page refresh leaves us hanging, then produces a slightly more usefull error after a time.

          instance.emit('login/error', e);
          if (typeof instance._events !== 'undefined' && typeof instance._events['login/error'] !== 'undefined') {
            e.handled = true;
            return callback(e);
          }
          return callback(e);

        }

        client.data = fbclient;
        client.session = fbclient.session;

        // We need the data here
        instance.data = client.data;

        client.data.onEvent('reconnect-scheduled', function (data) {
          if (instance._events && instance._events['reconnect-scheduled']) {
            if (!deprecatedReconnectScheduledEventWarned) {
              client.log.warn('DEPRECATION WARNING: please use event:\'reconnect/scheduled\' and not event:\'reconnect-scheduled\'');
              deprecatedReconnectScheduledEventWarned = true;
            }
            instance.emit('reconnect-scheduled', data);
          }
          instance.emit('reconnect/scheduled', data);
        });

        client.data.onEvent('reconnect-successful', function (data) {

          client.updateSession(fbclient.session);

          if (instance._events && instance._events['reconnect-successful']) {
            if (!deprecatedReconnectSuccessfulEventWarned) {
              client.log.warn('DEPRECATION WARNING: please use event:\'reconnect/successful\' and not event:\'reconnect-successful\'');
              deprecatedReconnectSuccessfulEventWarned = true;
            }
            instance.emit('reconnect-successful', data);
          }
          instance.emit('reconnect/successful', data);
        });

        client.data.onEvent('connection-ended', function (data) {
          if (instance._events && instance._events['connection-ended']) {
            if (!deprecatedConnectionEndedEventWarned) {
              client.log.warn('DEPRECATION WARNING: please use event:\'connection/ended\' and not event:\'connection-ended\'');
              deprecatedConnectionEndedEventWarned = true;
            }
            instance.emit('connection-ended', data);
          }
          instance.emit('connection/ended', data);
        });

        var buzy = false;
        var interval;
        var initializeLoop = function () {

          if (buzy) return; // initialize is called on interval, ensure only one running at a time.

          buzy = true;

          client.data.get('/mesh/schema/*', function (e, response) {

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

            response.map(function (configItem) {
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

            Internals._initializeLocal(
              client,
              client._mesh.description,
              client._mesh.config,
              isServer,
              function (e) {
                if (e) {
                  clearInterval(interval);
                  buzy = false;
                  defer.reject(e);
                  return callback(e);
                }

                clearInterval(interval);
                buzy = false;

                // Assign api
                instance.event = client.event;
                instance.exchange = client.exchange;
                instance.token = client.session.token;

                instance.info = {};
                Object.defineProperty(instance.info, 'name', {
                  enumerable: true,
                  value: client._mesh.config.name
                });

                Object.defineProperty(instance.info, 'version', {
                  enumerable: true,
                  value: client._mesh.config.version
                });

                subscribe();
              });
          });
        };

        interval = setInterval(initializeLoop, 2000); // Does not cause 'thundering herd'.
        //
        // This retry loop is applicable only
        // to new connections being made BETWEEN
        // server start and server ready.
        initializeLoop();

        var subscribe = function () {

          // TODO: subscribe to config? does it matter

          var exchange = client.exchange;
          var event = client.event;

          client.data.on('/mesh/schema/description',

            function (description) {

              // call api assembly with updated subscription

              var endpointName = description.name;
              var endpoint = client._mesh.endpoints[endpointName];

              if (!endpoint) {
                // crash prevention, see https://github.com/happner/happner/issues/172
                client.log.warn('happner #172 - could not find endpoint ' + endpointName);
                return;
              }

              var previousDescription = endpoint.description;
              var previousComponents = Object.keys(previousDescription.components);

              endpoint.previousDescription = previousDescription;
              endpoint.description = description;

              Internals._updateEndpoint(
                client,
                endpointName,
                exchange,
                event,
                function (err) {

                  if (err) return client.log.error('api update failed', err); // Not much can be done...

                  client.log.info('api updated!');

                  var updatedComponents = Object.keys(description.components);

                  // TODO?: changed components/""hotswap""

                  var create = updatedComponents.filter(function (name) {
                    return previousComponents.indexOf(name) == -1
                  }).map(function (name) {
                    return {
                      description: JSON.parse( // deep copy description
                        JSON.stringify(       // (prevent accidental changes to live)
                          description.components[name]
                        )
                      )
                    }
                  });

                  var destroy = previousComponents.filter(function (name) {
                    return updatedComponents.indexOf(name) == -1
                  }).map(function (name) {
                    return {
                      description: JSON.parse(
                        JSON.stringify(
                          previousDescription.components[name]
                        )
                      )
                    }
                  });

                  if (destroy.length > 0) {
                    instance.emit('components/destroyed', destroy);
                    instance.emit('destroy/components', destroy);
                  }
                  if (create.length > 0) {
                    instance.emit('components/created', create);
                    instance.emit('create/components', create);
                  }
                }
              )
            },

            function (e) {

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

              if (instance._events && instance._events['destroy/components']) {
                if (!deprecatedDestroyComponentsWarned) {
                  deprecatedDestroyComponentsWarned = true;
                  client.log.warn('DEPRECATION WARNING: please use event:\'components/destroyed\' and not event:\'destroy/components\'');
                }
              }
              if (instance._events && instance._events['create/components']) {
                if (!deprecatedCreateComponentsWarned) {
                  deprecatedCreateComponentsWarned = true;
                  client.log.warn('DEPRECATION WARNING: please use event:\'components/created\' and not event:\'create/components\'');
                }
              }

              var components = client._mesh.description.components;
              var payload = Object.keys(components).map(
                function (name) {
                  return {
                    description: JSON.parse(JSON.stringify(components[name])),
                  }
                }
              );

              instance.emit('components/created', payload);
              instance.emit('create/components', payload);

              defer.resolve(instance);
            }
          );
        }
      });
    }

    return defer.promise;
  };

})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
