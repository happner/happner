
var MeshError = require('./error');
var serveStatic = require('serve-static');
var util = require('util');
var path = require('path');
var depWarned0 = false;  // $happn.mesh.*

module.exports = ComponentInstance;

function ComponentInstance(opts) {
  this.README = this.README; // make visible
  this.name = opts.name;
  this.config = {};
  this.info = {
    
    mesh: {},      // name, 
    datalayer: {}, // address, 

  };
  this.log = opts.mesh.log.createLogger(this.name);
  this.emit = this.emit;
  this.exchange = opts.mesh.exchange;
  this.event = opts.mesh.event;
  this.data = opts.mesh.data;

  this.log.$$DEBUG('create instance');

  Object.defineProperty(this, 'tools', {
    value: opts.mesh.tools
  })

  var _this = this;
  Object.defineProperty(this, 'mesh', {
    get: function() {
      if (depWarned0) return _this;
      _this.log.warn('Use of $happn.mesh.* is deprecated. Use $happn.*');
      try {
        _this.log.warn(' - at %s', opts.mesh.getCallerTo('componentInstance.js'));
      } catch (e) {}
      depWarned0 = true;
      return _this;
    }
  });
}

ComponentInstance.prototype.initialize = function(root, mesh, module, config, callback){
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

  Object.defineProperty(this.info.mesh, 'name', {
    enumerable: true,
    value: mesh.config.name,
  });

  Object.defineProperty(this.info.datalayer, 'address', {
    enumerable: true,
    get: function() {
      return mesh.datalayer.server.server.address();
    }
  });

  Object.defineProperty(this.info.datalayer, 'options', {
    enumerable: true,
    get: function() {
      return mesh.config.datalayer.setOptions; // TODO: should rather point to actual datalayer options,
                                              //        it may have defaulted more than we passed in.
    }
  });

  if (mesh.serializer) {
    Object.defineProperty(this, 'serializer', {
      value: mesh.serializer
    });
  }

  if (config.accessLevel == 'root') {
    Object.defineProperty(this, '_root', {
      get: function() {
        return root
      },
      enumerable: true
    });
  }

  if (config.accessLevel == 'mesh' || config.accessLevel == 'root') {
    Object.defineProperty(this, '_mesh', {
      get: function() {
        return mesh
      },
      enumerable: true
    });
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
  var eventKey = '/events/' + this.info.mesh.name + '/' + this.name + '/';
  this.data.set(eventKey + key, data, {noStore:true}, callback);
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
        var error;

        if (!methodSchema) {
          error = new Error('Call to unconfigured method \'' + _this.name + '.' + methodName + '()\'');
          _this.log.error('Missing method config', error);
          if (callback) return callback(error);
          // throw error
          return;
        }

        _this.log.$$TRACE('operate( %s', methodName);
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
            callback(null, Array.prototype.slice.apply(arguments));
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

        _this.log.error('Call to method %s failed', methodName, e);
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
  this.log.error("message discarded: %s", reason, message);
}

ComponentInstance.prototype.attachRouteTarget = function(meshRoutePath, componentRoutePath, targetMethod, route){

  var directory, serve, methodDefn = this.module.instance[targetMethod];

  if (targetMethod == 'static'){

    if (this.module.home == '__NONE__') return;

    if (this.name == 'resources' && route == 'resources') {
      directory = path.normalize(__dirname + '/../../resources/');
      this.log.$$TRACE('serving static %s', directory);
      this.log.$$TRACE(' - at %s', componentRoutePath);
      this.log.$$TRACE(' - at %s', meshRoutePath);
      serve = serveStatic(directory);
      this.data.context.connect.use(meshRoutePath.replace(/\/resources$/,''), serve);
      this.data.context.connect.use(componentRoutePath.replace(/\/resources$/,''), serve);
      return;
    };

    directory = this.module.home + '/' + route;

    if (this.name == 'www' && route == 'static') {
      componentRoutePath = '/';
      this.log.$$TRACE('serving www %s', directory);
      this.log.$$TRACE(' - at %s', componentRoutePath);
      serve = serveStatic(directory);
      this.data.context.connect.use(componentRoutePath, serve);
      return;
    }

    this.log.$$TRACE('serving static %s', directory);
    this.log.$$TRACE(' - at %s', componentRoutePath);
    this.log.$$TRACE(' - at %s', meshRoutePath);

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

    serve = function() {
      var args = Array.prototype.slice.call(arguments);
      args.splice(methodDefn.$happnSeq, 0, _this);
      methodDefn.apply(context, args);
    }

    if (this.name == 'www') {

      if (route == 'global') {
        this.log.$$TRACE('global $happn method %s()', targetMethod);
        this.data.context.connect.use(serve);
        return;
      }

      if (route == 'static') {
        componentRoutePath = '/';
      }
      else {
        componentRoutePath = '/' + route;
      }
      
      this.log.$$TRACE('serving $happn method %s()', targetMethod);
      this.log.$$TRACE('- at ' + componentRoutePath);
      this.data.context.connect.use(componentRoutePath, serve);
      return;
    }

    this.data.context.connect.use(meshRoutePath, serve);
    this.data.context.connect.use(componentRoutePath, serve);

    this.log.$$TRACE('serving $happn method %s()', targetMethod);
    this.log.$$TRACE(' - at %s', componentRoutePath);
    this.log.$$TRACE(' - at %s', meshRoutePath);
    return;
  }

  if (this.name == 'www') {
    if (route == 'global') {
      this.log.$$TRACE('global _ method %s()', targetMethod);
      serve = methodDefn.bind(context);
      this.data.context.connect.use(serve);
      return;
    }
    componentRoutePath = '/' + route;
    this.log.$$TRACE('service _ method %s()', targetMethod);
    this.log.$$TRACE('- at %s', componentRoutePath);
  }


  this.log.$$TRACE('serving _ method %s()', targetMethod);
  this.log.$$TRACE(' - at %s',componentRoutePath);
  this.log.$$TRACE(' - at %s',meshRoutePath);

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
        var meshRoutePath = '/' + this.info.mesh.name +'/'+this.name+'/'+route;
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

  var listenAddress = '/mesh/system/requests/' + this.info.mesh.name +  '/' + this.name + '/';
  var subscribeMask = listenAddress + '*';

  _this.log.$$TRACE('data.on( ' + subscribeMask);

  this.data.on(subscribeMask, {event_type:'set'}, function(publication){

      _this.log.$$TRACE('received request at %s', subscribeMask);

      var pathParts = publication.payload.path.replace(listenAddress, '').split('/');
      var message = publication.payload.data;
      var method = pathParts[0];

      if (_this.serializer && typeof _this.serializer.__decode == 'function') {
        message.args = _this.serializer.__decode(message.args, {
          req: true,
          res: false,
          at: {
            mesh: _this.info.mesh.name,
            component: _this.name,
          },
          addr: message.callbackAddress,
          event: publication,
        });
      }

      var args = message.args.slice(0, message.args.length);

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

          _this.log.$$TRACE('operate( data.set( ERROR %s', message.callbackAddress);

          return _this.data.set(message.callbackAddress, {
            status:'failed',
            args:[serializedError]
          }, _this.info.datalayer.options);
        }


        var response = {
          status: 'ok',
          args: responseArguments
        };


        if (_this.serializer && typeof _this.serializer.__encode == 'function') {
          response.args = _this.serializer.__encode(response.args, {
            req: false,
            res: true,
            src: {
              mesh: _this.info.mesh.name,
              component: _this.name,
            },
            addr: message.callbackAddress,
            opts: _this.info.datalayer.options,
          });
        }

        // Populate response to the callback address

        _this.log.$$TRACE('operate( data.set( RESULT %s', message.callbackAddress);

        _this.data.set(message.callbackAddress, response, _this.info.datalayer.options, function(e){
          if (e)
            this.log.error("Failure to set callback data", e);
        });
      });
    },
    function(e){

      callback(e);
    }
  );
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


// terminal: inline help $local.README
ComponentInstance.prototype.README = function() {/*
  </br>
  ## This is the Component Instance

  It is available in the terminal at **$local**. From modules, it is optionally 
  injected into functions as **$happn**.

  *Note:* **$local** and **$happn** are instances of the same thing.

  It has access to the **Exchange**, **Event** and **Data** APIs as well as some
  built in utilities and informations.

  ### Examples

      __node> $local.name
      'terminal'

      __node> $local.constructor.name
      'ComponentInstance'

      __node> $local.log.warn('blah blah')
  **[ WARN]** - 13398ms home (terminal) blah blah

      __node> $local.info
      __node> $local.config
      __node> $local.data.README
      __node> $local.event.README
      __node> $local.exchange.README
      __node> $local._mesh.*  // only with 'mesh'||'root' accessLevel
      __node> $local._root.*  // only with 'root' accessLevel

*/}
