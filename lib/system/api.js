// mesh api
// this is used in both server and browser
// TODO: logger with formatStr + args

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


var Messenger = function (endpoint, mesh, callback){

  var exchange = mesh.exchange;

  this.log = (typeof mesh.log == 'object' && mesh.log.createLogger)
    ? mesh.log.createLogger('Messenger/' + endpoint.name)
    : createLogger('Messenger/' + endpoint.name);

  Object.defineProperty(this, '_endpoint', {value: endpoint});
  Object.defineProperty(this, '_exchange', {value: exchange});
  Object.defineProperty(this, '_meshDescription', {value: endpoint.description});

  if (typeof __serializer !== 'undefined') this.serializer = __serializer
  else if (typeof mesh.serializer !== 'undefined') this.serializer = mesh.serializer;

  this.handlers = {};
  this.responseHandlers = {};
  this.eventRegister = 0;

  this.id = endpoint.data.session.id;

  if (!this._meshDescription.setOptions)
    this._meshDescription.setOptions = {noStore:true}

  var _this = this;

  for (var componentName in _this._meshDescription.components){
    var componentDescription = _this._meshDescription.components[componentName];

    for (var methodName in componentDescription.methods){

      var methodDescription = componentDescription.methods[methodName];
      var responseAddress = '/' + _this._endpoint.name + '/' + _this.id + '/' + componentName + '/' + methodName;
      var requestAddress = '/' + _this._endpoint.name + '/' + componentName + '/' + methodName;


      // Create requestors for each remote component / method combo.
      // - using a function closure to keep the vars static despite the for loops

      (function(methodDescription, requestAddress, responseAddress, componentName, methodName){

        // New requestor.

        _this.handlers[requestAddress] = function(){

          var message, requestPath;

          try{

            message = _this.prepareMessage(responseAddress, methodDescription, arguments[0]);

          }catch(e){
            return _this.discardMessage(responseAddress, methodDescription, arguments[0], e);
          }

          requestPath = '/mesh/system/requests' +  requestAddress;

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
                endpoint: _this._endpoint.name,
                component: componentName,
                method: methodName,
              },
              addr: message.callbackAddress,
              opts: _this._meshDescription.setOptions,
            });
          }

          _this.log.$$TRACE('data.set( %s', requestPath);

          endpoint.data.set(requestPath, message,
            _this._meshDescription.setOptions,
            _this._createPubResponseHandle(message)
          );
        }

      })(methodDescription, requestAddress, responseAddress, componentName, methodName);
      ////// enclosed.

      exchange[requestAddress] = _this;
    }
  };

  var responseMask = '/mesh/system/responses/' + endpoint.description.name + '/' + _this.id + '/*';

  this._endpoint.data.on(responseMask, {event_type:'set', count:0}, 
    _this._createSubResponseHandle(_this),
    function(e){
      _this.log.$$DEBUG('data.on( %s', responseMask);
      callback(e);
    }
  );
}

Messenger.prototype.deliver = function(address, arg, u, ments){

  // remove address and pass args to handler as array

  this.log.$$TRACE('deliver( %s', address);
  
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  this.handlers[address](args);
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

  var message = {"callbackAddress":'/mesh/system/responses' + address + '/' + this.eventRegister++, args:[]};

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
      }.bind(callbackHandler), _this._meshDescription.setOptions.timeout || 5000);

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
      
      responseHandler.handleResponse([error]);
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

var happn, async, Promise;
var mode = 'node:server';


if (typeof window === 'undefined' && typeof document === 'undefined') {
  HappnClient = require('happn').client;
  Promise = require('bluebird');
} else {
  mode = 'browser';
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

    if (typeof arg == 'object') params = arg
    else if (typeof arg == 'number') port = arg
    else if (typeof arg == 'string' && !host) host = arg
    else if (typeof arg == 'string') secret = arg
    else if (typeof arg == 'function') callback = arg

  }
  // xx
  host = host || opts.host;
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
  } 
  else {
    if (typeof UTILITIES == 'undefined') {
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
}

if (mode != 'browser') {
  module.exports = MeshClient;
  module.exports.Messenger = Messenger;
}

var initialize = function(opts, callback) {

  var defer = Promise.defer();
  var host = opts.host;
  var port = opts.port;
  var secret = opts.secret;

  var client = {
    log: opts.log
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

  HappnClient.create({"config":{"host":host, "port":port, "secret":secret}, "info": opts.info}, function(e, fbclient){

    if (e) return callback(e);

    client.data = fbclient;
    client.data.get('/mesh/schema*', function(e, response){

      if (e) return callback(e);

      client._mesh = {};

      response.map(function(configItem){
        if (configItem._meta.path == '/mesh/schema/config') {
          client._mesh.config = configItem;
        }
        else if (configItem._meta.path == '/mesh/schema/description') {
          client._mesh.description = configItem;
        }
      });
     
      MeshClient._initializeLocal(client, client._mesh.description, client._mesh.config, function(e) {
        if (e) {
          defer.reject(e);
          return callback(e);
        }
        client.log.info('ready');
        defer.resolve(client);
        callback(null, client);
      });
    });
  });

  return defer.promise;
}


Object.defineProperty(MeshClient, '_initializeLocal', {
  value: function(_this, description, config, callback) {
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
        "data": mode == 'browser' ? _this.data : mode == 'node:client' ? _this.data : _this._mesh.data,
        "description":description,
        "name":config.name
      }
    }

    // Externals
    var exchangeAPI = _this.exchange = (_this.exchange || {});
    var eventAPI = _this.event = (_this.event || {});
    
    // Internals
    _this._mesh = _this._mesh || {};
    _this._mesh.exchange = _this._mesh.exchange || {};

    MeshClient._createEndpoint(_this, config.name, exchangeAPI, eventAPI, callback);
  }
});

Object.defineProperty(MeshClient, '_createEndpoint', {
  value: function(_this, endpointName, exchangeAPI, eventAPI, done) {
    _this.log.$$TRACE('_createEndpoint( %s', endpointName);

    MeshClient._createExchangeAPILayer(_this, endpointName, exchangeAPI)
    
    .then(function() {
      return MeshClient._createEventAPILayer(_this, endpointName, eventAPI)
    })

    .then(function(result){
      done(null, result);
    })

    .catch(function(error) {
      done(error);
    })
  }
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


Object.defineProperty(MeshClient, '_createExchangeAPILayer', {
  value: Promise.promisify(function(_this, endpointName, exchangeAPI, callback) {
    _this.log.$$TRACE('_createExchangeAPILayer( %s', endpointName);

    var endPoint = _this._mesh.endpoints[endpointName];

    exchangeAPI[endpointName] = {};

    for(var componentName in endPoint.description.components) {

      var componentDescription = endPoint.description.components[componentName];

      (function(componentDescription, componentName){
        exchangeAPI[endpointName][componentName] = {};
             
        for(var methodName in componentDescription.methods) {

          var methodDescription = componentDescription.methods[methodName];

          (function(methodDescription, methodName){

            var methodHandler = Promise.promisify(function() {
              var newArguments = ['/' + endpointName + '/' + componentName + '/' + methodName];
              for(var i in arguments) newArguments.push(arguments[i]);
              _this.post.apply(null, newArguments);
            });

            exchangeAPI[endpointName][componentName][methodName] =  methodHandler;
            if (methodDescription.alias) { 
              exchangeAPI[endpointName][componentName][methodDescription.alias] =  methodHandler;
            }
          
            if(endpointName == _this._mesh.config.name){
              if (!exchangeAPI[componentName]) exchangeAPI[componentName] = {};
              exchangeAPI[componentName][methodName] =  methodHandler;
              if (methodDescription.alias) exchangeAPI[componentName][methodDescription.alias] =  methodHandler;
            }

          })(methodDescription, methodName)
        }
      })(componentDescription, componentName)
    }

    new Messenger(_this._mesh.endpoints[endpointName], _this._mesh, callback);
  })
});


Object.defineProperty(MeshClient, '_createEventAPILayer', {
  value: Promise.promisify(function(_this, endpointName, eventAPI, callback) {
    _this.log.$$TRACE('_createEventAPILayer( %s', endpointName);

    var endPoint = _this._mesh.endpoints[endpointName];

    eventAPI[endpointName] = {};

    for(var componentName in endPoint.description.components) {
      var componentDescription = endPoint.description.components[componentName];

      (function(componentDescription, componentName){
        var eventKey = '/events/' + endpointName + '/' + componentName + '/';

        (function(eventKey){

          var eventHandler = {
            on:function(key, handler, onDone){
              endPoint.data.on(eventKey + key, {event_type:'set'}, handler, onDone);
            },
            off:function(key, offDone){
              endPoint.data.off(eventKey + key, offDone);
            }
          };

          eventAPI[endpointName][componentName] = eventHandler;
          if(endpointName == _this._mesh.config.name) eventAPI[componentName] = eventHandler;
          
        })(eventKey)
      })(componentDescription, componentName)
    }
    callback();
  })
});