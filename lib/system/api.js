// mesh api

function MeshError(message, data) {
  this.name = 'MeshError';
  this.message = message;
  this.data = data;
}

MeshError.prototype = Object.create(Error.prototype);
MeshError.prototype.constructor = MeshError;


var Messenger = function (endpoint, exchange, callback){

  this.log = (typeof UTILITIES == 'object' && UTILITIES.createLogger)
    ? UTILITIES.createLogger('Messenger/' + endpoint.name)
    : {
      $$TRACE: function() {},
      $$DEBUG: function() {},
      info: function(msg, obj) {
        if (obj) return console.info('Messenger/' + endpoint.name, msg, obj);
        console.info('Messenger/' + endpoint.name, msg);
      },
      warn: function(msg, obj) {
        if (obj) return console.warn('Messenger/' + endpoint.name, msg, obj);
        console.info('Messenger/' + endpoint.name, msg);
      },
      error: function(msg, obj) {
        if (obj) return console.error('Messenger/' + endpoint.name, msg, obj);
        console.info('Messenger/' + endpoint.name, msg);
      }
    }

  Object.defineProperty(this, '_endpoint', {value: endpoint});
  Object.defineProperty(this, '_exchange', {value: exchange});
  Object.defineProperty(this, '_meshDescription', {value: endpoint.description});

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

      (function(methodDescription, requestAddress, responseAddress){
        _this.handlers[requestAddress] = function(){

          var message;

          try{
            message = _this.prepareMessage(responseAddress, methodDescription, arguments[0]);
          }catch(e){
            return _this.discardMessage(responseAddress, methodDescription, arguments[0], e);
          }

          endpoint.data.set(
            '/mesh/system/requests' +  requestAddress,
            message,
            _this._meshDescription.setOptions,
            _this._createPubResponseHandle(message)
          );
        }

      })(methodDescription, requestAddress, responseAddress);

      exchange[requestAddress] = _this;
    }
  };

  this._endpoint.data.on('/mesh/system/responses/' + endpoint.description.name + '/' + _this.id + '/*', 
    {event_type:'set', count:0}, 
    _this._createSubResponseHandle(),
    function(e){
      //if the on worked
      callback(e);
    }
  );
}

Messenger.prototype.deliver = function(address){
  var args = [];
  for (var argIndex in arguments){
    if (argIndex > 0)
      args[argIndex - 1] = arguments[argIndex];
  }

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
        return this.handler.apply(this.handler, argumentsArray);
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

Messenger.prototype.responseHandler = function(response) {
  var responseHandler = this.responseHandlers[response.payload.path];

  if (responseHandler){
    if (response.payload.data.status == 'ok'){
      responseHandler.handleResponse(response.payload.data.arguments);
    }
    else{
      var error;
      var serializedError = response.payload.data.arguments[0];

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
  return function(e, response) {
    if (e) {
      var assembledFailure = {
        payload: {
          path: message.callbackAddress,
          data: {
            status: 'error',
            arguments: [
              e instanceof Error ? e : {
                message: e.toString(),
                name: e.name
              }
            ]
          }
        }
      }
      return this.responseHandler(assembledFailure);
    }
  }
}

Messenger.prototype._createSubResponseHandle = function() {
  return this.responseHandler;
}

var happn;
var mode = 'node';

if (typeof window === 'undefined') {
  happn = require('@smc/happn');
  async = require('async');
} else {
  mode = 'browser';
  module = {exports:{}}

  function getScript(url, success){
   var script=document.createElement('script');
   script.src=url;
   var head=document.getElementsByTagName('head')[0];
   var done=false;
   // Attach handlers for all browsers
   script.onload=script.onreadystatechange = function(){
     if ( !done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') ) {
      done=true;
      success();
      script.onload = script.onreadystatechange = null;
      head.removeChild(script);
     }
   };
   head.appendChild(script);
  }
}

var logger;

var getLogger = function() {
  return logger || (logger = (typeof UTILITIES == 'object' && UTILITIES.createLogger)
  ? UTILITIES.createLogger('Api')
  : {
    $$TRACE: function() {},
    $$DEBUG: function() {},
    info: function(msg, obj) {
      if (obj) return console.info('Api', msg, obj);
      console.info('Api', msg);
    },
    warn: function(msg, obj) {
      if (obj) return console.warn('Api', msg, obj);
      console.info('Api', msg);
    },
    error: function(msg, obj) {
      if (obj) return console.error('Api', msg, obj);
      console.info('Api', msg);
    }
  });
}

function MeshClient(host, port, secret, callback) {
  getLogger().$$TRACE('MeshClient()');

  if (mode == 'browser') delete module.exports; // in the browser, async will use it instead of window

  // defaults
  if (mode == 'browser') {
    if (typeof host == 'string' && typeof port == 'function') {
      // MeshClient('password', callback)
      callback = port;
      secret = host;
      host = window.location.hostname;
      port = window.location.port;
    }
    else if (typeof host == 'function') {
      // MeshClient(callback)
      callback = host;
      secret = 'mesh'; // same default password as server
      host = window.location.hostname;
      port = window.location.port;
    }
  }

  var loadResources = function() {
    async.parallel([
      function(cb) {
        if (typeof $ === 'undefined') {
          getScript('/resources/bower/jquery/dist/jquery.min.js', function() {
            getLogger().info('loaded jquery');
            cb();
          });
        }
        else cb();
      },
      function(cb) {
        if (typeof happn === 'undefined') {
          if (typeof HappnClient === 'undefined') {
            return getScript('/browser_client', function() {
              getLogger().info('loaded happn');
              happn = new HappnClient();
              cb();
            });
          }
          happn = new HappnClient();
          cb();
        }
        else cb();
      }
    ],
    function(e) {
      if (e) return callback(e);
      initialize(host, port, secret, happn, callback);
    });
  }

  if (mode == 'browser') {
    if (typeof async === 'undefined') {
      return getScript('/resources/bower/async/lib/async.js', function(){
        getLogger().info('loaded async');
        loadResources();
      });
    }
    loadResources();
  } else initialize(host, port, secret, happn, callback);
}

module.exports = MeshClient;
module.exports.Messenger = Messenger;

var initialize = function(host, port, secret, happn, callback) {

  var client = {
    api: {}
  }

  new happn.client({"config":{"host":host, "port":port, "secret":secret}}, function(e, fbclient){

    if (e) return callback(e);

    client.api.data = fbclient;
    client.api.data.get('/mesh/schema*', {}, function(e, response){

      if (e) return callback(e);

      response.payload.map(function(configItem){
        if (configItem.path == '/mesh/schema/config')
          client.config = configItem.data;

         if (configItem.path == '/mesh/schema/description')
          client.description = configItem.data;
      });
     
      MeshClient._initializeEndpoints(client, client.description, happn, client.config, function(e) {
        if (e) return callback(e);
        MeshClient._createExchangeAPILayer(client, function(e) {
          if (e) return callback(e);
          MeshClient._createEventAPILayer(client, function(e) {
            if (e) return callback(e);
            callback(null, client);
          });
        });
      });
    });
  })
}


Object.defineProperty(MeshClient, '_initializeEndpoints', {
  value: function(_this, description, happn, config, callback) {
    getLogger().$$TRACE('_initializeEndpoints()');
    _this.api.post = function(address){

      if (address.substring(0,1) != '/')
        address = '/' + address; 

      if (address.split('/').length == 3)
       address = '/' + _this.config.name + address; 

      if (!_this.exchange[address])
        throw new MeshError('missing address ' + address);

      var messenger = _this.exchange[address];
      messenger.deliver.apply(messenger, arguments);

    }

    _this.endpoints = {};

    if (config.name) {
      _this.endpoints[config.name] = {
        "data":_this.api.data,
        "description":description,
        "name":config.name
      }
    }

    if (!config.endpoints || mode == 'browser')
      return callback();
   
    async.eachSeries(Object.keys(config.endpoints), function(endpointName, eachCallback) {

      var endpointConfig = config.endpoints[endpointName];

      new happn.client(endpointConfig, function(e, client){

        if (e) return eachCallback(e);
        //provided the remote endpoint is started, we can immediately pull out its description from its data
        client.get('/mesh/schema/description', {}, function(e, response){

          if (e) return eachCallback(e);
          //make sure if the description changes, we know it
          client.on('/mesh/schema/description', {}, function(eventData){
            _this.endpoints[endpointName].description = eventData.payload.data;
          }, function(e){
            if (e) getLogger().warn('Unable to conect to remote endpoint \''+endpointName+'\' describe event.', e);
            //we now have a local copy of the distant meshes description

            try {
              _this.endpoints[endpointName] = {
                "data":client,
                "description":response.payload[0].data, //.description,
                "name":endpointName
              }

            } catch (e) {
              getLogger().warn('Malformed describe from mesh \''+endpointName+'\' ignored.', e);
            }
            eachCallback();
          });
        });
      });
    }, 
    function(err){
        if (err){
          //message, level, component, data
          getLogger().error('Failed to initialize remote endpoints', err);
          return  callback(err); 
        }
        callback();
    });
  }
});

Object.defineProperty(MeshClient, '_attachProxyPipeline', {
  value: function(_this, description, happn, config, callback) {
    getLogger().$$TRACE('_attachProxyPipeline()');

    if (!config.endpoints || mode == 'browser')
      return callback();
   
    async.eachSeries(Object.keys(config.endpoints), function(endpointName, eachCallback) {
      var endpointConfig = config.endpoints[endpointName];
      try{
        if (endpointConfig.proxy){
          _this.api.exchange[endpointName].proxy.register(config, function(e){
             eachCallback(e);
          });
        }else
          eachCallback();

      }catch(e){
        eachCallback(e);
      }
    }, 
    function(err){
        if (err){
          //message, level, component, data
          getLogger().error('Failed to attach to the proxy pipeline', err);
          return  callback(err); 
        }
        callback();
    });
  }
});


Object.defineProperty(MeshClient, '_createExchangeAPILayer', {
  value: function(_this, callback) {
    getLogger().$$TRACE('_createExchangeAPILayer()');

    var exchangeAPI = _this.api.exchange = (_this.api.exchange || {});
    _this.exchange = (_this.exchange || {});

    //we loop through the endpoints and register messengers for them
    async.eachSeries(Object.keys(_this.endpoints), function(endpointName, eachCallback){

      var endPoint = _this.endpoints[endpointName];

      exchangeAPI[endpointName] = {};

      (function(endPoint, endpointName){

        for(var componentName in endPoint.description.components) {

          var componentDescription = endPoint.description.components[componentName];

          (function(componentDescription, componentName){
            exchangeAPI[endpointName][componentName] = {};
             
            for(var methodName in componentDescription.methods) {

              var methodDescription = componentDescription.methods[methodName];
              (function(methodDescription, methodName){
                var methodHandler = function() {
                  newArguments = ['/' + endpointName + '/' + componentName + '/' + methodName];
                  for(var i in arguments) newArguments.push(arguments[i]);
                  _this.api.post.apply(null, newArguments);
                }

                exchangeAPI[endpointName][componentName][methodName] =  methodHandler;
                if (methodDescription.alias) exchangeAPI[endpointName][componentName][methodDescription.alias] =  methodHandler;
              
                if(endpointName == _this.config.name){
                  if (!exchangeAPI[componentName]) exchangeAPI[componentName] = {};
                  exchangeAPI[componentName][methodName] =  methodHandler;
                  if (methodDescription.alias) exchangeAPI[componentName][methodDescription.alias] =  methodHandler;
                }

              })(methodDescription, methodName)
            }
          })(componentDescription, componentName)
        }
      })(endPoint, endpointName)

      new Messenger(_this.endpoints[endpointName], _this.exchange, eachCallback);

    }, callback);
  }
});


Object.defineProperty(MeshClient, '_createEventAPILayer', {
  value: function(_this, callback) {
    getLogger().$$TRACE('_createEventAPILayer()');

    var eventAPI = _this.api['event'] = (_this.api['event'] || {});
    _this.exchange = (_this.exchange || {});

    async.eachSeries(Object.keys(_this.endpoints), function(endpointName, eachCallback){

      var endPoint = _this.endpoints[endpointName];

      eventAPI[endpointName] = {};

      (function(endPoint, endpointName){
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
              if(endpointName == _this.config.name) eventAPI[componentName] = eventHandler;
              
            })(eventKey)
          })(componentDescription, componentName)
        }
      })(endPoint, endpointName)

      eachCallback();
    }, callback);
  }
});