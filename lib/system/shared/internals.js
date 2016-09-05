;(function (isBrowser) {

  var Promisify, Messenger, MeshError;
  var Internals = {};

  if (isBrowser) {
    window.Happner = window.Happner || {};
    window.Happner.Internals = Internals;
    Promisify = Happner.Promisify;
    Messenger = Happner.Messenger;
    MeshError = Happner.MeshError;
  }

  else {
    module.exports = Internals;
    Promisify = require('./promisify');
    Messenger = require('./messenger');
    MeshError = require('./mesh-error');
  }

  Internals._initializeLocal = function (_this, description, config, isServer, callback) {
    _this.log.$$TRACE('_initializeLocal()');

    if (!_this.post)
    Object.defineProperty(_this, 'post', {
      value: function (address) {
        _this.log.$$TRACE('post( %s', address);
        if (address.substring(0, 1) != '/')
          address = '/' + address;

        if (address.split('/').length == 3)
          address = '/' + _this._mesh.config.name + address;

        if (!_this._mesh.exchange[address])
          throw new MeshError('missing address ' + address);

        var messenger = _this._mesh.exchange[address];
        messenger.deliver.apply(messenger, arguments);
      }
    });

    _this._mesh = _this._mesh || {};
    _this._mesh.endpoints = _this._mesh.endpoints || {};

    if (config.name) {
      _this._mesh.endpoints[config.name] = {
        description: description,
        local: isServer,
        name: config.name,
        data: isBrowser ? _this.data : _this.data || _this._mesh.data,
      }
    }

    // Externals
    var exchangeAPI = _this.exchange = (_this.exchange || {});
    var eventAPI = _this.event = (_this.event || {});

    // Internals
    _this._mesh = _this._mesh || {};
    _this._mesh.exchange = _this._mesh.exchange || {};

    Internals._updateEndpoint(_this, config.name, exchangeAPI, eventAPI, callback);
  };


  Internals._updateEndpoint = function (_this, endpointName, exchangeAPI, eventAPI, callback) {
    _this.log.$$TRACE('_updateEndpoint( %s', endpointName);

    Internals._updateExchangeAPILayer(_this, endpointName, exchangeAPI)

      .then(function () {
        return Internals._updateEventAPILayer(_this, endpointName, eventAPI)
      })

      .then(function (result) {
        callback(null, result);
      })

      .catch(function (error) {
        callback(error);
      });
  };


  Internals._updateExchangeAPILayer = Promisify(function (_this, endpointName, exchangeAPI, callback) {
    _this.log.$$TRACE('_updateExchangeAPILayer( %s', endpointName);

    exchangeAPI[endpointName] = exchangeAPI[endpointName] || {};

    var endpoint = _this._mesh.endpoints[endpointName];
    var components = endpoint.description.components;
    var messenger = endpoint.messenger;

    if (endpoint.local && !components) {
      // - InitializeLocal on server occurs before components are created.
      //
      // - So on the first call this endpoint's component descriptions are empty.
      //
      // - Subsequent calls are made here with each component creation
      //   assembling it's APIs component by component (to allow runtime
      //   insertion of new components to initialize along the same code path)
      //
      // - The loop uses the messenger.initialized list to determine which
      //   are new components to configure into the messenger.
      return callback();
    }

    if (!messenger) {
      messenger = endpoint.messenger = new Messenger(endpoint, _this._mesh);
    }

    var runningComponents = Object.keys(messenger.initialized);
    var intendedComponents = Object.keys(components);
    var createComponents;
    var destroyComponents;

    // Initialize components into this endpoint's messenger

    createComponents = intendedComponents

    // Filter out components that are already initialized in the messenger.

      .filter(function (componentName) {
        return typeof messenger.initialized[componentName] == 'undefined';
      })

      .map(function (componentName) {

        // New Component

        var componentExchange = exchangeAPI[endpointName][componentName] = {};
        var componentDesciption = components[componentName];

        if (endpointName == _this._mesh.config.name) {
          exchangeAPI[componentName] = exchangeAPI[componentName] || {};
        }

        // Create exchangeAPI 'Requestors' for each method

        Object.keys(componentDesciption.methods)

          .forEach(function (methodName) {

            var remoteRequestor, localRequestor;
            var requestPath = '/' + endpointName + '/' + componentName + '/' + methodName;
            var description = componentDesciption.methods[methodName];
            var alias = description.alias;

            remoteRequestor = Promisify(function () {
              _this.post.apply(this, arguments);
            }, {
              unshift: requestPath
            });

            if (endpoint.local) {
              localRequestor = Promisify(function() {
                var args = Array.prototype.slice.call(arguments);
                var origin = _this._mesh.exchange[requestPath].session;
                var operate = _this._mesh.elements[componentName].component.instance.operate;
                var callback = args.pop();
                operate(methodName, args, function(meshError, results) {
                  if (meshError) return callback(meshError); // unlikely since bypassing most of exchange
                  callback.apply(this, results); // results = [error, results...]
                }, origin);
              });
            }

            componentExchange[methodName] = remoteRequestor;
            if (alias) {
              componentExchange[alias] = remoteRequestor;
            }

            if (endpointName == _this._mesh.config.name) {
              exchangeAPI[componentName] = exchangeAPI[componentName] || {};
              exchangeAPI[componentName][methodName] = localRequestor || remoteRequestor;
              if (alias) {
                exchangeAPI[componentName][alias] = localRequestor || remoteRequestor;
              }
            }

          });

        // Return componentName for the .map to create the
        // array of newComponents.

        return componentName;
      });

    destroyComponents = runningComponents

    // Filter for components no longer inteded

      .filter(function (componentName) {
        return intendedComponents.indexOf(componentName) == -1;
      })

      .map(function (componentName) {

        // TODO: consider leaving a stub that callsback with a ComponentDeletedError
        // var componentDesciption = endpoint.previousDescription;

        delete exchangeAPI[endpointName][componentName];
        delete _this.event[endpointName][componentName];

        if (endpointName == _this._mesh.config.name) {
          delete exchangeAPI[componentName];
          delete _this.event[componentName];
        }

        return componentName;
      })

    messenger.updateRequestors(createComponents, destroyComponents, callback);
  });


  Internals._updateEventAPILayer = Promisify(function (_this, endpointName, eventAPI, callback) {
    _this.log.$$TRACE('_updateEventAPILayer( %s', endpointName);

    eventAPI[endpointName] = eventAPI[endpointName] || {};

    var endpoint = _this._mesh.endpoints[endpointName];
    var components = endpoint.description.components;

    if (endpoint.local && !components) return callback();

    Object.keys(components)

      .filter(function (componentName) {
        return typeof eventAPI[endpointName][componentName] == 'undefined';
      })

      .forEach(function (componentName) {

        var eventKey = '/_events/' + endpointName + '/' + componentName + '/';

        var subscriber = {

          // TODO: once()
          on: function (key, handler, onDone) {
            if (!onDone) {
              onDone = function (e) {
                if (e) _this.log.warn('subscribe to \'%s\' failed', key, e);
              }
            }
            endpoint.data.on(eventKey + key, {event_type: 'set'}, handler, onDone);
          },

          onAsync: function (key, handler) {
            // return the promise from happn
            return endpoint.data.on(eventKey + key, {event_type: 'set'}, handler);
          },

          off: function (key, offDone) {
            if (!offDone) {
              offDone = function (e) {
                if (e) _this.log.warn('unsubscribe from \'%s\' failed', key, e);
              }
            }
            if (typeof key == "number") {
              endpoint.data.off(key, offDone);
            }
            else {
              endpoint.data.off(eventKey + key, offDone);
            }
          },

          offAsync: function (key) {
            return endpoint.data.off(eventKey + key);
          },
        }

        eventAPI[endpointName][componentName] = subscriber;
        if (endpointName == _this._mesh.config.name) {
          eventAPI[componentName] = subscriber;
        }

      })

    callback();
  });


  Internals._attachProxyPipeline = function (_this, description, happn, config, callback) {
    _this.log.$$TRACE('_attachProxyPipeline()');

    if (!config.endpoints || isBrowser)
      return callback();

    Promise.all(Object.keys(config.endpoints).map(function (endpointName) {
        return new Promise(function (resolve, reject) {

          var endpointConfig = config.endpoints[endpointName];
          try {
            if (endpointConfig.proxy) {
              _this._mesh.exchange[endpointName].proxy.register(config, function (e) {
                eachCallback(e);
              });
            } else
              resolve();

          } catch (e) {
            reject(e);
          }
        });
      }))

      .then(function (res) {
        callback(null);
      })

      .catch(function (err) {
        _this.log.error('Failed to attach to the proxy pipeline', err);
        callback(err);
      });
  }

})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
