// mesh api

var happn, async, Promise;
var mode = 'node:server';

if (typeof window === 'undefined' && typeof document === 'undefined') {
  HappnClient = require('happn').client;
  EventEmitter = require('events').EventEmitter;
  Promise = require('bluebird');
} else {
  EventEmitter = Primus.EventEmitter;
  mode = 'browser';
  // Others in preceding scripts, see http://...:./api/client
}

//browser utilities
var createUtilities = function(){
  return {
    getFunctionParameters:function(fn){
      var args = [];
      var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
      var FN_ARG_SPLIT = /,/;
      var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
      var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

      if (typeof fn == 'function') {
        fnText = fn.toString().replace(STRIP_COMMENTS, '');
        argDecl = fnText.match(FN_ARGS);
        argDecl[1].split(FN_ARG_SPLIT).map(function(arg) {
          arg.replace(FN_ARG, function(all, underscore, name) {
            args.push(name);
          });
        });
        return args;
      } else return null;
    }
  }
}

// Browser Logger
var createLogger = function(component) {

  var coerce = function(xargs) {
    var args = Array.prototype.slice.call(xargs);
    var msg = '(%s) ' + args.shift();
    args.unshift(component);
    args.unshift(msg);
    return args;
  }

  return {
    $$TRACE: function() {
      if (typeof LOG_LEVEL == 'string' && LOG_LEVEL == 'trace') {
        if ('object' === typeof console) {
          if (console.log) {
            Function.prototype.apply.call(console.log, console, coerce(arguments));
            // hack for IE8/9 (console.log has no apply)
          }
        }
      }
    },
    $$DEBUG: function() {
      if (typeof LOG_LEVEL == 'string' && (LOG_LEVEL == 'trace' || LOG_LEVEL == 'debug')) {
        if ('object' === typeof console) {
          if (console.log) {
            Function.prototype.apply.call(console.log, console, coerce(arguments));
          }
        }
      }
    },
    info: function() {
      if (typeof LOG_LEVEL == 'string' && (LOG_LEVEL == 'trace' || LOG_LEVEL == 'debug' || LOG_LEVEL == 'info')) {
        if ('object' === typeof console) {
          if (console.log) {
            Function.prototype.apply.call(console.log, console, coerce(arguments));
          }
        }
      }
    },
    warn: function() {
      if ('object' === typeof console) {
        if (console.warn) {
          Function.prototype.apply.call(console.warn, console, coerce(arguments));
        }
        else if (console.log) {
          Function.prototype.apply.call(console.log, console, coerce(arguments));
        }
      }
    },
    error: function() {
      if ('object' === typeof console) {
        if (console.error) {
          Function.prototype.apply.call(console.error, console, coerce(arguments));
        }
        else if (console.log) {
          Function.prototype.apply.call(console.log, console, coerce(arguments));
        }
      }
    }
  }
}

function MeshError(message, data) {
  this.name = 'MeshError';
  this.message = message;
  this.data = data;
}

MeshError.prototype = Object.create(Error.prototype);
MeshError.prototype.constructor = MeshError;


var Messenger = function (endpoint, mesh){

  var exchange = mesh.exchange;

  this.log = (typeof mesh.log == 'object' && mesh.log.createLogger)
    ? mesh.log.createLogger('Messenger/' + endpoint.name)
    : createLogger('Messenger/' + endpoint.name);

  this.log.$$TRACE('creating new messenger for endpoint \'%s\'', endpoint.name);

  Object.defineProperty(this, '_endpoint', {value: endpoint});
  Object.defineProperty(this, '_exchange', {value: exchange});
  // Object.defineProperty(this, '_meshDescription', {value: endpoint.description});

  if (typeof __serializer !== 'undefined') this.serializer = __serializer
  else if (typeof mesh.serializer !== 'undefined') this.serializer = mesh.serializer;

  this.requestors = {};
  this.initialized = {};
  this.responseHandlers = {};
  this.eventRegister = 0;
  this.listening = false;

  this.id = endpoint.data.session.id;

  if (!this._endpoint.description.setOptions)
    this._endpoint.description.setOptions = {noStore:true}

}

Messenger.prototype.updateRequestors = function(createComponents, destroyComponents, callback) {

  var endpoint = this._endpoint;
  var _this = this;

  this.createRequestors(createComponents)

  .then(function() {
    return _this.destroyRequestors(destroyComponents)
  })

  .then(function() {

    if (_this.listening) return callback();

    // Set to listening for responses
    // ------------------------------

    _this.listening = true; // set to true BEFORE listening success to avoid 
                           // race condition (multiple going to listen) 

    // Wildcard listen on response path

    var responseMask = '/_exchange/responses' +
                       '/' + endpoint.name +
                       '/' + _this.id +
                       '/*';
    _this.log.$$TRACE('subscribe START - data.on( %s', responseMask);
    endpoint.data.on(responseMask, {event_type:'set', count:0}, 
      _this._createSubResponseHandle(_this),
      function(e){
        if (e) {

          // TODO: Consider configable retry!
          //       This subscription is Vital.

          _this.listening = false;
          _this.log.$$TRACE('subscribe ERROR - data.on( %s', responseMask, e);
          return callback(e);


        }
        _this.log.$$TRACE('subscribe OK - data.on( %s', responseMask);
        return callback();
      }
    );

  })

  .catch(callback);
  
}

Messenger.prototype.createRequestors = Promise.promisify(function(componentNames, callback) {

  var endpoint = this._endpoint;
  var components = endpoint.description.components;

  var _this = this;
  componentNames.forEach(function(componentName) {

    var componentDescription = components[componentName];
    Object.keys(componentDescription.methods).forEach(function(methodName) {

      var responseAddress = '/' + endpoint.name + 
                            '/' + _this.id + 
                            '/' + componentName + 
                            '/' + methodName;

      var requestAddress  = '/' + endpoint.name + 
                            '/' + componentName + 
                            '/' + methodName;

      var description = componentDescription.methods[methodName];

      _this.log.$$DEBUG('creating requestor at %s', requestAddress);


      // The requestor()
      // ---------------

      var requestor = function() {

        var requestPath = '/_exchange/requests' + requestAddress;
        var message;

        try {
          message = _this.prepareMessage(responseAddress, description, arguments[0]);
        }
        catch(e) {
          return _this.discardMessage(responseAddress, description, arguments[0], e);
        }

        if (_this.serializer && typeof _this.serializer.__encode == 'function') {
          message.args = _this.serializer.__encode(   message.args,  {
            req: true,
            res: false,
            src: {
              mesh: mesh.config.name,
              browser: mode == 'browser',
              //////// component: 'possible?'
            },
            dst: {
              endpoint: endpoint.name,
              component: componentName,
              method: methodName,
            },
            addr: message.callbackAddress,
            opts: endpoint.description.setOptions,
          });
        }

        _this.log.$$TRACE('data.set( %s', requestPath);

        endpoint.data.set(requestPath, message,
          endpoint.description.setOptions,
          _this._createPubResponseHandle(message)
        );
      }


      // Assign specific requestor for this requestAddress

      _this.requestors[requestAddress] = requestor;

      // Assign `this` as messenger on the exchange

      _this._exchange[requestAddress] = _this;

    });

    // Mark component as initialized in this messenger

    _this.initialized[componentName] = Date.now();

  });

  callback(); // no particular need.

});

Messenger.prototype.destroyRequestors = Promise.promisify(function(componentNames, callback) {

  // TODO: Deal with inprogress requests, don't leave client hanging on callback...

  if (componentNames.length == 0) return callback();

  var endpoint = this._endpoint;
  var components = endpoint.previousDescription.components;

  var _this = this;
  componentNames.forEach(function(componentName) {

    var componentDescription = components[componentName];
    Object.keys(componentDescription.methods).forEach(function(methodName) {

      var requestAddress  = '/' + endpoint.name + 
                            '/' + componentName + 
                            '/' + methodName;

      _this.log.$$DEBUG('destroying requestor at %s', requestAddress);

      delete _this.requestors[requestAddress];
      delete _this._exchange[requestAddress];

    });

    delete _this.initialized[componentName]; // <-- had timestamp, could do component uptime

  });

  callback();
});


Messenger.prototype.deliver = function(address){

  // remove address and pass args to requestor as array

  this.log.$$TRACE('deliver( %s', address);
  
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  this.requestors[address](args);
}


Messenger.prototype._systemEvents = function(event, data) {
  this.log.warn(event, data);
}


Messenger.prototype.discardMessage = function(address, methodDescription, args, error){
  //TODO - fix discarded message
  this.log.warn('Message discarded', arguments);
}


Messenger.prototype._validateMessage = function(methodDescription, args){

  try{

    if (!methodDescription)
      throw new MeshError('Missing methodDescription');
      // throw new MeshError('Component does not have the method: ' + method);

    //do some schema based validation here
    var schemaValidationFailures = [];
   
    methodDescription.parameters.map(function(parameterDefinition, index){

       if (parameterDefinition.required && !args[index])
        schemaValidationFailures.push({"parameterDefinition":parameterDefinition, "message":"Required parameter not found"});

    });

    if (schemaValidationFailures.length > 0)
      throw new MeshError('Schema validation failed', schemaValidationFailures);

  }catch(e){
    throw new MeshError('Validation failed', e);
  }
}

Messenger.prototype.prepareMessage = function(address, methodDescription, args){

  this._validateMessage(methodDescription, args);

  var message = {"callbackAddress":'/_exchange/responses' + address + '/' + this.eventRegister++, args:[]};

  var _this = this;
  methodDescription.parameters.map(function(parameterDescription, index){

    if (parameterDescription["type"] == 'callback' || typeof(args[index]) == 'function'){

      if (!args[index])
        throw new MeshError('Callback for ' + address + ' was not defined');

      if (typeof (args[index]) != 'function')
        throw new MeshError('Invalid callback for ' + address + ', callback must be a function');
      
      var callbackHandler = {
        "handler":args[index],
        "callbackAddress":message.callbackAddress
      };

      callbackHandler.handleResponse = function(argumentsArray){
        clearTimeout(this.timedout);
        delete _this.responseHandlers[this.callbackAddress];
        try{
          return this.handler.apply(this.handler, argumentsArray);
        }catch(e){
          _this.log.error('error in response handler', e);
          return;
        }
        
      }.bind(callbackHandler);

      callbackHandler.timedout = setTimeout(function(){
        delete _this.responseHandlers[this.callbackAddress];
        return this.handler("Request timed out");
      }.bind(callbackHandler), _this._endpoint.description.setOptions.timeout || 5000);

      _this.responseHandlers[message.callbackAddress] = callbackHandler;

    }
    else
      message.args.push(args[index]);
  });

  return message;
}

Messenger.prototype.responseHandler = function(response, meta) {

  this.log.$$TRACE('responseHandler( %s', meta.path);

  if (this.serializer && typeof this.serializer.__decode == 'function') {
    response.args = this.serializer.__decode(response.args, {
      req: false,
      res: true,
      meta: meta,
    });
  }

  var responseHandler = this.responseHandlers[meta.path];

  if (responseHandler){
    if (response.status == 'ok'){
      responseHandler.handleResponse(response.args);
    }
    else{
      var error;
      var serializedError = response.args[0];

      if (error instanceof Error) {
        error = serializedError;
      }
      else {
        error = new Error(serializedError.message);
        error.name = serializedError.name;
        delete serializedError.message;
        delete serializedError.name;
        Object.keys(serializedError).forEach(function(key){
          error[key] = serializedError[key];
        });
      }

      response.args[0] = error;
      responseHandler.handleResponse(response.args);
    }
  } else {
    this._systemEvents('nohandler', response);
  }
}

Messenger.prototype._createPubResponseHandle = function(message) {
  var _this = this;
  return function(e, response) {
    if (e) {
      var assembledFailure = {
        status: 'error',
        args: [
          e instanceof Error ? e : {
            message: e.toString(),
            name: e.name
          }
        ]
      }
      return _this.responseHandler(assembledFailure);
    }
    _this.log.$$TRACE('request successful');
  }
}

Messenger.prototype._createSubResponseHandle = function() {
  return this.responseHandler.bind(this);
}

function MeshClient(/* opts */  /* host, port, secret, callback */) {

  if (mode != 'browser') mode = 'node:client';

  var log;

  var args = Array.prototype.slice.call(arguments);
  var arg;

  var opts = {};
  var host;     // first string arg
  var port;     // the only number arg
  var secret;   // second string arg
  var callback; // the only arg that's a function

  while (arg = args.shift()) {

    if (typeof arg == 'object') opts = arg
    else if (typeof arg == 'number') port = arg
    else if (typeof arg == 'string' && !host) host = arg
    else if (typeof arg == 'string') secret = arg
    else if (typeof arg == 'function') callback = arg

  }
  // xx
  host = host || opts.host || opts.address;
  port = port || opts.port;
  secret = secret || opts.secoptsret;

  if (!host) {
    host = mode == 'browser' ? window.location.hostname : 'localhost';
  }

  if (!port) {
    if (mode == 'browser') {
                   // possible cross browser issues here
                  // expecting no port in the case of port
                 // unspecified (ie the default 80)
                // 
      if (!window.location.port) {
        port = 80;
      } else {
        port = window.location.port; // use the port that the page came from
      }
    }
  }

  if (!secret) {
    secret = 'mesh';
  }

  opts.host = opts.host || host;
  opts.port = opts.port || port || 55000;
  opts.secret = opts.secret || secret;

  if (!callback) {
    callback = function(e, client) {
      if (e) return log.warn('error connecting to %s:%s', host, port, e);
    }
  }

  if (mode == 'browser') {
    log = createLogger('MeshClient');
    UTILITIES = createUtilities();
  } 
  else {
    if (opts.logger && opts.logger.createLogger) {
      log = opts.logger.createLogger('MeshClient');
    }
    else if (typeof UTILITIES == 'undefined') {
      this.utils = require('./utilities')();
      log = this.utils.createContext('client').createLogger('MeshClient');
    }
    else if (typeof UTILITIES.createContext == 'function') {
      log = UTILITIES.createContext('client').createLogger('MeshClient');
    } 
    else {
      log = createLogger('MeshClient');
    }
  }

  log.info('connecting to %s:%s', host, port);

  // These should be loaded ahead of this script
  // Use http://__your.server__/api/client  (for entire package)
  if (!Promise) console.error('Missing bluebird for Promise.');
  if (!HappnClient) console.error('Missing HappnClient.');

  opts.log = log;

  return initialize(opts, callback);
};

if (mode != 'browser') {
  module.exports = MeshClient;
  module.exports.Messenger = Messenger;
}

var initialize = function(opts, callback) {

  var defer = Promise.defer();
  var host = opts.host;
  var port = opts.port;
  var secret = opts.secret;
  var emitter = new EventEmitter();
  var started = false;

  var client = {
    _mesh: {},
    log: opts.log,

    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),

    start: function() {

      // For clients (browser) wishing to be informed of live 
      // changes to the API.
      // 
      //   eg.
      // 
      //     Components being added or removed from 
      //     the parent mesh.
      //
      //
      //   client.on('create/components');
      //   client.on('destroy/components');
      //   client.start();
      //
      //   First emit to 'create/components' receives 
      //   full list of components present at start()
      //

      if (started) return;
      started = true;
      start(); 
    }
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

  HappnClient.create({"config":{"host":host, "port":port, "secret":secret}, "info": opts.info, "Logger": opts.log}, function(e, fbclient){

    if (e) return callback(e);

    client.data = fbclient;

    var buzy = false;
    var interval;
    var initialize = function() {

      buzy = true; // initialize is called on interval, ensure only one running at a time.

      client.data.get('/mesh/schema/*', function(e, response){

        if (e) {
          clearInterval(interval);
          buzy = false;
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
       
        MeshClient._initializeLocal(client, client._mesh.description, client._mesh.config, isServer, function(e) {
          if (e) {
            clearInterval(interval);
            buzy = false;
            defer.reject(e);
            return callback(e);              
          }
          
          clearInterval(interval);
          buzy = false;

          // Golden...

          // Callback happens after successful subscribe() to description.
          // 
          // defer.resolve(client);
          // callback(null, client);

          subscribe();

        });
      });
    }

    interval = setInterval(initialize, 2000); // Does not cause 'thundering herd'.
                                             //
                                            // This retry loop is applicable only 
                                           // to new connections being made BETWEEN
                                          // server start and server ready.
    initialize();

    var subscribe = function() {

      // TODO: subscribe to config? does it matter

      var exchange = client.exchange;
      var event = client.event;

      client.data.on( '/mesh/schema/description',

        function(description) {
          
          // call api assembly with updated subscription

          var endpointName = description.name;
          var endpoint = client._mesh.endpoints[endpointName];

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

              if (destroy.length > 0) emitter.emit('destroy/components', destroy);
              if (create.length > 0) emitter.emit('create/components', create);
            }
          )
        },

        function(e) {
          if (e) {
            client.log.error('failed on subscribe', e);
            callback(e);
            defer.reject(e);
            return;
          }
          client.log.info('initialized!');
          callback(null, client);
          defer.resolve(client);
        }
      );
    }
  });

  var start = function() {
                               // TODO: Should access here fall away?
                              //
    var components = client._mesh.description.components;

    // Emit array of all present components' details

    emitter.emit('create/components', Object.keys(components).map(
      function(name) {
        return {
          description: JSON.parse(JSON.stringify(components[name])),
        }
      }
    ));
  }

  return defer.promise;
}


Object.defineProperty(MeshClient, '_initializeLocal', {
  value: function(_this, description, config, isServer, callback) {
    _this.log.$$TRACE('_initializeLocal()');
    
    Object.defineProperty(_this, 'post', {
      value: function(address){
        _this.log.$$TRACE('post( %s', address);
        if (address.substring(0,1) != '/')
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
        data: mode == 'browser' ? _this.data : mode == 'node:client' ? _this.data : _this._mesh.data,
      }
    }

    // Externals
    var exchangeAPI = _this.exchange = (_this.exchange || {});
    var eventAPI = _this.event = (_this.event || {});
  
    // Internals
    _this._mesh = _this._mesh || {};
    _this._mesh.exchange = _this._mesh.exchange || {};

    MeshClient._updateEndpoint(_this, config.name, exchangeAPI, eventAPI, callback);
  }
});

Object.defineProperty(MeshClient, '_updateEndpoint', {
  value: function(_this, endpointName, exchangeAPI, eventAPI, done) {
    _this.log.$$TRACE('_updateEndpoint( %s', endpointName);

    MeshClient._updateExchangeAPILayer(_this, endpointName, exchangeAPI)
    
    .then(function() {
      return MeshClient._updateEventAPILayer(_this, endpointName, eventAPI)
    })

    .then(function(result){
      done(null, result);
    })

    .catch(function(error) {
      done(error);
    })
  }
});

Object.defineProperty(MeshClient, '_updateExchangeAPILayer', {
  value: Promise.promisify(function(_this, endpointName, exchangeAPI, callback) {
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

    .filter(function(componentName) {
      return typeof messenger.initialized[componentName] == 'undefined';
    })

    .map(function(componentName) {

      // New Component

      var componentExchange = exchangeAPI[endpointName][componentName] = {};
      var componentDesciption = components[componentName];

      if (endpointName == _this._mesh.config.name) {
        exchangeAPI[componentName] = exchangeAPI[componentName] || {};
      }

      // Create exchangeAPI 'Requestors' for each method
      
      Object.keys(componentDesciption.methods)

      .forEach(function(methodName) {
        
        var requestPath = '/' + endpointName + '/' + componentName + '/' + methodName;
        var description = componentDesciption.methods[methodName];
        var alias = description.alias;

        var requestor = Promise.promisify(function() {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(requestPath);
          _this.post.apply(null, args);
        });

        componentExchange[methodName] = requestor;
        if (alias) { 
          componentExchange[alias] = requestor;
        }

        if (endpointName == _this._mesh.config.name) {
          exchangeAPI[componentName] = exchangeAPI[componentName] || {};
          exchangeAPI[componentName][methodName] = requestor;
          if (alias) { 
            exchangeAPI[componentName][alias] = requestor;
          }
        }

      });

      // Return componentName for the .map to create the
      // array of newComponents.

      return componentName;
    });

    destroyComponents = runningComponents

    // Filter for components no longer inteded

    .filter(function(componentName) {
      return intendedComponents.indexOf(componentName) == -1;
    })

    .map(function(componentName) {

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
  })
});


Object.defineProperty(MeshClient, '_updateEventAPILayer', {
  value: Promise.promisify(function(_this, endpointName, eventAPI, callback) {
    _this.log.$$TRACE('_updateEventAPILayer( %s', endpointName);

    eventAPI[endpointName] = eventAPI[endpointName] || {};

    var endpoint = _this._mesh.endpoints[endpointName];
    var components = endpoint.description.components;

    if (endpoint.local && !components) return callback();

    Object.keys(components)

    .filter(function(componentName) {
      return typeof eventAPI[endpointName][componentName] == 'undefined';
    })

    .forEach(function(componentName) {

      var eventKey = '/_events/' + endpointName + '/' + componentName + '/';

      var subscriber = {

        // TODO: once()
        on: function(key, handler, onDone){
          if (!onDone) {
            onDone = function(e) {
              if (e) _this.log.warn('subscribe to \'%s\' failed', key, e);
            }
          }
          endpoint.data.on(eventKey + key, {event_type:'set'}, handler, onDone);
        },

        onAsync: function(key, handler) {
          // return the promise from happn
          return endpoint.data.on(eventKey + key, {event_type:'set'}, handler);
        },

        off: function(key, offDone){
          if (!offDone) {
            offDone = function(e) {
              if (e) _this.log.warn('unsubscribe from \'%s\' failed', key, e);
            }
          }
          endpoint.data.off(eventKey + key, offDone);
        },

        offAsync: function(key) {
          return endpoint.data.off(eventKey + key);
        },
      }

      eventAPI[endpointName][componentName] = subscriber;
      if (endpointName == _this._mesh.config.name) {
        eventAPI[componentName] = subscriber;
      }

    })

    callback();
  })
});

Object.defineProperty(MeshClient, '_attachProxyPipeline', {
  value: function(_this, description, happn, config, callback) {
    _this.log.$$TRACE('_attachProxyPipeline()');

    if (!config.endpoints || mode == 'browser')
      return callback();

    Promise.all(Object.keys(config.endpoints).map(function(endpointName) {
      return new Promise(function(resolve, reject) {

        var endpointConfig = config.endpoints[endpointName];
        try{
          if (endpointConfig.proxy){
            _this._mesh.exchange[endpointName].proxy.register(config, function(e){
               eachCallback(e);
            });
          }else
            resolve();

        }catch(e){
          reject(e);
        }
      });
    }))

    .then(function(res) {
      callback(null);
    })

    .catch(function(err) {
      _this.log.error('Failed to attach to the proxy pipeline', err);
      callback(err); 
    });
  }
});
