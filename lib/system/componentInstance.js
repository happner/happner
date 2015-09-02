
var MeshError = require('./error');
var serveStatic = require('serve-static');
var util = require('util');
var path = require('path');
var warned = false;

module.exports = ComponentInstance;

function ComponentInstance(opts) {
  this.name = opts.name;
  this.log = UTILITIES.createLogger(this.name);
  this.emit = this.emit; 
  this.describe = this.describe;
  this.exchange = opts.mesh.exchange;
  this.event = opts.mesh.event;
  this.data = opts.mesh.data;

  this.log.$$DEBUG('create instance');

  var _this = this
  Object.defineProperty(this, 'mesh', {
    get: function() {
      if (!warned) {
        _this.log.warn('Use of $happn.mesh.* is deprecated. Use $happn.*');
        warned = true;
      }
      return _this;
    }
  });
}

ComponentInstance.prototype.initialize = function(module, config, callback){
  var defaults;

  if (typeof (defaults = module.instance.$happner) == 'object') {

    if (defaults.config && defaults.config.component) {
      Object.keys(defaults = defaults.config.component)
      .forEach(function(key) {
        // - Defaulting applies only to the 'root' keys nested immediately 
        //   under the 'component' config
        // - Does not merge. 
        // - Each key in the default is only used if the corresponding key is 
        //   not present in the inbound config.
        if (typeof config[key] == 'undefined') {
          config[key] = JSON.parse(JSON.stringify(defaults[key]));
        }
      })
    }
  }

  try{
    this.config = config;
    this._loadModule(module);
    this._attach(config, callback);
  }catch(err){
    callback(new MeshError('Failed to initialize component', err));
  }
}

ComponentInstance.prototype.emit = function(key, data, callback){
  this.stats.component[this.name].emits++;
  var eventKey = '/events/' + this.config.meshName + '/' + this.name + '/';
  this.mesh.data.set(eventKey + key, data, {noStore:true}, callback);
}

ComponentInstance.prototype.describe = function(cached){

  if (!cached || !this.description) {

    Object.defineProperty(this, 'description', {
      value: {"methods":{}},
      configurable: true
    });

    // get method's config definition

    var getMethodDefn = function(config, methodName) {
      if (!config.schema) return;
      if (!config.schema.methods) return;
      if (!config.schema.methods[methodName]) return;
      return config.schema.methods[methodName];
    }

    for (var methodName in this.module.instance){

      var method = this.module.instance[methodName];
      var methodDefined = getMethodDefn(this.config, methodName);

      if (typeof method !== 'function') continue;
      if (method.$happner && method.$happner.ignore && !methodDefined) continue;
      if (methodName.indexOf('_') == 0 && !methodDefined) continue;

      if (!this.config.schema || (this.config.schema && !this.config.schema.exclusive)) {

        // no schema or not exclusive, allow all (except those filtered above)

        this.description.methods[methodName] = methodDefined = methodDefined || {};
        if (!methodDefined.parameters) {
          this._defaultParameters(method, methodDefined);
        }
        continue;
      }

      if (methodDefined) {

        // got schema and exclusive is true (per filter in previous if) and have definition

        this.description.methods[methodName] = methodDefined;
        if (!methodDefined.parameters) {
          this._defaultParameters(method, methodDefined);
        }
      }
    }
  }
  return this.description;
}

ComponentInstance.prototype._loadModule = function(module){

  var _this = this;
  Object.defineProperty(this, 'module', { // property: to remove internal components from view.
    value: module
  });

  Object.defineProperty(this, 'operate', {
    value: function(methodName, parameters, callback){
      try{

        _this.stats.component[_this.name].calls++;

        var methodSchema = _this.description.methods[methodName];
        var methodDefn = _this.module.instance[methodName];

        _this.log.$$TRACE('operate( ' + methodName);
        _this.log.$$TRACE('parameters ', parameters);
        _this.log.$$TRACE('methodSchema ', methodSchema);

        if (typeof methodDefn !== 'function') 
          throw new MeshError('Missing ' + _this.name + '.' + methodName + '()', {parameters: parameters});

        if (callback){

          callbackIndex = -1;

          for(var i in methodSchema.parameters) {
            if(methodSchema.parameters[i].type == 'callback') callbackIndex = i
          };

          var callbackProxy = function(){
        
            var returnArgs = [];
            for (var argIndex in arguments)
              returnArgs.push(arguments[argIndex]);

            callback(null, returnArgs);

          }

          if(callbackIndex == -1) {
            parameters.push(callbackProxy)
          }
          else parameters.splice(callbackIndex, 1, callbackProxy);

        }

        if (typeof methodDefn.$happnSeq !== 'undefined') {
          parameters.splice(methodDefn.$happnSeq, 0, _this)
        }

        methodDefn.apply(_this.module.instance, parameters);

      }catch(e){

        _this.log.error('Call to method ' + methodName + ' failed', e);
        _this.stats.component[_this.name].errors++;
        
        if (callback)
          callback(e);

        //else throw error;
        //
        //TODO - for syncronous calls may still want to throw, but it takes down the mesh
      }
    } 
  });
}

ComponentInstance.prototype._defaultParameters = function(method, methodSchema) {

  if (!methodSchema.parameters) methodSchema.parameters = [];
  UTILITIES.getFunctionParameters(method)
  .filter(function(argName){
    return argName != '$happn';
  })
  .map(function(argName){
    methodSchema.parameters.push({name:argName});
  });
}

ComponentInstance.prototype._discardMessage = function(reason, message){
  this.log.error("message discarded: " + reason, message);
}

ComponentInstance.prototype.attachRouteTarget = function(meshRoutePath, componentRoutePath, targetMethod, route){

  var directory, serve, methodDefn = this.module.instance[targetMethod];

  if (targetMethod == 'static'){

    if (this.name == 'resources' && route == 'resources') {
      directory = path.normalize(__dirname + '/../../resources/');
      this.log.$$TRACE('serving static ' + directory);
      this.log.$$TRACE(' - at ' + componentRoutePath);
      this.log.$$TRACE(' - at ' + meshRoutePath);
      serve = serveStatic(directory);
      this.data.context.connect.use(meshRoutePath.replace(/\/resources$/,''), serve);
      this.data.context.connect.use(componentRoutePath.replace(/\/resources$/,''), serve);
      return;
    };

    directory = this.module.home + '/' + route;

    this.log.$$TRACE('serving static ' + directory);
    this.log.$$TRACE(' - at ' + componentRoutePath);
    this.log.$$TRACE(' - at ' + meshRoutePath);

    serve = serveStatic(directory);
    this.data.context.connect.use(meshRoutePath, serve);
    this.data.context.connect.use(componentRoutePath, serve);
    
    return;
  }

  if (typeof methodDefn != 'function') {
    throw new MeshError('Expected "' + this.name + '" to define ' + targetMethod + '()')
  }

  var context = this.module.instance;
  var _this = this;
  if (typeof methodDefn.$happnSeq !== 'undefined') {

    this.log.$$TRACE('serving $happn method' + targetMethod + '()');
    this.log.$$TRACE(' - at ' + componentRoutePath);
    this.log.$$TRACE(' - at ' + meshRoutePath);

    serve = function() {
      var args = Array.prototype.slice.call(arguments);
      args.splice(methodDefn.$happnSeq, 0, _this);
      methodDefn.apply(context, args);
    }
    this.data.context.connect.use(meshRoutePath, serve);
    this.data.context.connect.use(componentRoutePath, serve);
    return;
  }

  this.log.$$TRACE('serving . method ' + targetMethod + '()');
  this.log.$$TRACE(' - at ' + componentRoutePath);
  this.log.$$TRACE(' - at ' + meshRoutePath);

  serve = methodDefn.bind(context);
  this.data.context.connect.use(meshRoutePath, serve);
  this.data.context.connect.use(componentRoutePath, serve);
}

ComponentInstance.prototype._attach = function(config, callback){
  //attach module to the transport layer
  var _this = this;
  if (config.web){
    try{
      for (var route in config.web.routes){
        var routeTarget = config.web.routes[route];
        var meshRoutePath = '/' + config.meshName+'/'+this.name+'/'+route;
        var componentRoutePath = '/' + this.name+'/'+route;

        if (UTILITIES.node.isArray(routeTarget)){
          routeTarget.map(function(targetMethod){
            _this.attachRouteTarget(meshRoutePath, componentRoutePath, targetMethod, route);
          });
        }else{
          this.attachRouteTarget(meshRoutePath, componentRoutePath, routeTarget, route);
        }
      }
    }catch(e){
      this.log.error("Failure to attach web methods", e);
      return callback(e);
    }
  }

  var listenAddress = '/mesh/system/requests/' + config.meshName +  '/' + this.name + '/';

  this.data.on(listenAddress + '*', 
    {event_type:'set'}, 
    function(publication){

      var pathParts = publication.payload.path.replace(listenAddress, '').split('/');
      var message = publication.payload.data;
      var args = message.args.slice(0, message.args.length);
      var method = pathParts[0];

      if (!message.callbackAddress)
        return _this._discardMessage('No callback address', message);

      _this.operate(method, args, function(e, responseArguments){

        if (e) {
          // error objects cant be sent / received  (serialize)
          var serializedError = {
            message: e.message,
            name: e.name,
          }
          Object.keys(e).forEach(function(key) {
            serializedError[key] = e[key];
          });
          return _this.data.set(message.callbackAddress, {"status":"failed", "arguments":[serializedError]}, _this.config.setOptions);
        }

        _this.data.set(message.callbackAddress, {"status":"ok", "arguments":responseArguments}, _this.config.setOptions, function(e){
          if (e)
            this.log.error("Failure to set callback data", e);
        });
      });
    },
    function(e){
      callback(e);
    });
}

ComponentInstance.prototype.runTestInternal = function(callback){
  try{

    if (!this.module.instance.runTest)
      return callback(new MeshError('Module is not testable'));

    var _this = this;
    this.module.instance.runTest(callback);
    this.operateInternal(data.message, data.parameters, function(e, result){

      if (e)
        return callback(e);

      if (_this.module.instance.verifyTestResults)
        return _this.module.instance.verifyTestResults(result, callback);

      callback(null, result);
      
    });

  }catch(e){
    callback(e);
  }
}