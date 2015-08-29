/**
 * Created by Johan on 4/14/2015.
 */

var API = require('./api');
var happn = require('@smc/happn');
var happnServer = happn.service;
var dataLayer;
var happn_client = happn.client;
var async = require('async');
var MeshError = require('./error');
var Utilities = require('./utilities');
var ComponentInstance = require('./componentInstance');
var path = require("path");
// var Messenger = require('./messenger');

module.exports = function () {
  return new Mesh();
}

// One step start with both args optional
// node -e 'require("happngin").start()'
module.exports.start = function(config, callback) {

  var mesh;
  config = config || {};
  callback = callback || (typeof config == 'function' ? config : function(err) {
    if (err) {
      console.error(err.stack);
      process.exit(err.errno || 1);
    }
  });

  (mesh = new Mesh()).initialize(config, function(err) {
    if (err) return callback(err);
    return mesh.start(function(err) {
      if (err) return callback(err);
      callback(null, mesh);
    });
  });
}

module.exports.Mesh = Mesh;
module.exports.MeshClient = API;

function Mesh() {}

// Step1 of two step start with mandatory args (initialize({},function Callback(){ start() }))
Mesh.prototype.initialize = function(config, callback){

  global.UTILITIES = global.UTILITIES || new Utilities(config.util);
  
  this.log = UTILITIES.createLogger('Mesh');
  this.log.$$DEBUG('start');
  




  this._mesh = {
    config: config,
    modules: {},
    components: {},
    description: {},
    endpoints: {},
    exchange: {},
  };

  this.attachSystemComponents(config);

  var _this = this;
  async.series([
    function(callback) {
      _this._initializeDataLayer(config, callback);
    },
    function(callback) {
      _this.log.$$DEBUG('initialized data layer');
      _this._initializeModules(config, callback);
    },
    function(callback) {
      _this.log.$$DEBUG('initialized modules');
      _this._happnizeModules(callback);
    },
    function(callback) {
      _this.log.$$DEBUG('happnized modules');
      _this._instantiateComponents(config, callback);
    },
    function(callback) {
      _this.log.$$DEBUG('initialized components');
      _this._registerSchema(config, callback);
    },
    function(callback) {
      _this.log.$$DEBUG('registered schema');
      API._initializeEndpoints(_this, _this.describe(), happn, config, callback);
    },
    function(callback) {
      _this.log.$$DEBUG('initialized endpoints');
      API._createExchangeAPILayer(_this, callback);
    },
    function(callback) {
      _this.log.$$DEBUG('initialized exchange api');
      API._createEventAPILayer(_this, callback);
    },
    function(callback) {
      _this.log.$$DEBUG('initialized events api');
      API._attachProxyPipeline(_this, _this.describe(), happn, config, callback);
    },
    function(callback) {
      _this.log.$$DEBUG('attached to proxy pipeline');
      callback();
    }
  ], function(e){
    if (!e) _this.log.info('up');
    callback(e);
  });
}

// Step2 of two step start (initialize({},function callback(){ start() }))
Mesh.prototype.start = function(callback){
  this._startComponents(callback); //BUG - callback not always called!!
}

Mesh.prototype.stop = function(options, callback){

  if (!options)
    options = {};

  if (options.force && !options.forceWaitMilliseconds)
    options.forceWaitMilliseconds = 10000;

  var timeout;

  if (options.force){
    timeout = setTimeout(function(){
      process.exit(1);
    }, options.forceWaitMilliseconds);
  }
  
  var _this = this;
  this._stopComponents(function(e){
    if (e){
      _this.log.error("Failure to stop components ", e);
      process.exit(1);
    }else{
      _this.log.info("Stopped components successfully");
      process.exit(0);
    }
  });
}

Mesh.prototype.describe = function(cached){
  if (this._mesh.description && cached == true) return this._mesh.description;

  var description = {
    name: this._mesh.config.name, 
    components: {},
    setOptions: this._mesh.config.dataLayer.setOptions
  };

  for (var componentName in this._mesh.components){
    description.components[componentName] = this._mesh.components[componentName].instance.describe();
  }

  return this._mesh.description = description;
}

Mesh.prototype._initializeDataLayer = function(config, callback){
  try{

    if (typeof config.name != 'string') {
      config.name = require('sillyname')().split(' ')[0].toLowerCase();
    }
    this.log.info('using name "'+config.name+'"');

    config.dataLayer = (config.dataLayer || {});
    config.dataLayer.authTokenSecret = (config.dataLayer.authTokenSecret || 'mesh');
    config.dataLayer.systemSecret = (config.dataLayer.systemSecret || 'mesh');
    config.dataLayer.log_level = (config.dataLayer.log_level || 'info|error|warning');
    config.dataLayer.setOptions = (config.dataLayer.setOptions || {});
    config.dataLayer.setOptions.timeout = (config.dataLayer.setOptions.timeout || 10000);
    if (typeof config.dataLayer.setOptions.noStore != 'boolean') {
      config.dataLayer.setOptions.noStore = true;
    }

    var _this = this;
    happnServer.initialize({
        port: config.dataLayer.port?config.dataLayer.port:8000,
        host: config.dataLayer.host?config.dataLayer.host:"localhost",
        mode:'embedded', 
        services:{
          auth:{
            path:'./services/auth/service.js',
            config:{
              authTokenSecret:config.dataLayer.authTokenSecret,
              systemSecret:config.dataLayer.systemSecret
            }
          },
          data:{
            path:'./services/data_embedded/service.js'
          },
          pubsub:{
            path:'./services/pubsub/service.js'
          }
        },
        utils:{
          log_level:config.dataLayer.log_level
        }
      }, 
      function(e, happnInstance){

        if (e)
          return callback(e);

        //so now all components can talk to the data layer
        new happn.client({plugin:happn.client_plugins.intra_process, context:happnInstance}, function(e, client){
          if (e) return callback(e);
          _this.data = client;
          callback();
        });

      });
  }catch(e){
    callback(new Error(e));
  }
}

Mesh.prototype._initializeModules = function(config, callback){
  // find components that refer to modules not listed and default them
  Object.keys(config.components)
  .map(function(name){
    return [name, config.components[name]]
  }).forEach(function(array) {
    var componentName = array[0];
    var componentConfig = array[1];
    var moduleName = componentConfig.moduleName || componentName;
    if (!config.modules[moduleName]) {
      config.modules[moduleName] = {};
    }
  });

  var _this = this;
  async.eachSeries(Object.keys(config.modules), function(moduleName, eachCallback) {
    _this._mesh.modules[moduleName] = {};
    var moduleConfig = config.modules[moduleName];
    var moduleBase;
    var callbackIndex = -1;

    if (!moduleConfig.path) moduleConfig.path = moduleName;

    _this._mesh.modules[moduleName].config = config.modules[moduleName];

    try {

      var modulePath = moduleConfig.path;
      if (moduleConfig.path.indexOf('system:') == 0){
        var pathParts = moduleConfig.path.split(':');
        modulePath = __dirname + '/components/' + pathParts[1];
      }
      try {
        moduleBase = require(modulePath);
      } catch (e) {
        try {
          moduleBase = require('happngin-' + modulePath);
          modulePath = 'happngin-' + modulePath;
        } catch (f) {
          throw e;
        }
      }

      var directory = path.dirname(require.resolve(modulePath));
      Object.defineProperty(_this._mesh.modules[moduleName], 'directory', {
        get: function() {
          return directory;
        }
      })
    } catch (e) {
      return eachCallback(new Error(e));
    }

    var getParameters = function() {
      try {
        var parameters = (moduleConfig.construct || moduleConfig.create).parameters;
        return parameters.map(function(p, i) {
          if (p.parameterType == 'callback'){
            callbackIndex = i;
            return;
          }
          if (p.value) return p.value;
          else return null
        });
      } catch (e) {
        return [];
      }
    }

    var parameters = getParameters();

    if (moduleConfig.construct) {
      if (moduleConfig.construct.name)
        moduleBase = moduleBase[moduleConfig.construct.name];

      var moduleInstance = new (Function.prototype.bind.apply(moduleBase, [null].concat(parameters)));
      _this._mesh.modules[moduleName].instance = moduleInstance;
      return eachCallback();
    }


    if (moduleConfig.create) {
      if (moduleConfig.create.name)
        moduleBase = moduleBase[moduleConfig.create.name];

      if (moduleConfig.create.type != 'async') {
        var moduleInstance = moduleBase.apply(null, parameters);
        _this._mesh.modules[moduleName].instance = moduleInstance;
        return eachCallback();
      }

      var constructorCallBack = function(){
        var callbackParameters;
        try {
          callbackParameters = moduleConfig.create.callback.parameters;
        } catch (e) {
          callbackParameters = [
            {parameterType: 'error'},
            {parameterType: 'instance'}
          ];
        }
      
        for (var index in arguments){
          var value = arguments[index];

          var callBackParameter = callbackParameters[index];
          if (callBackParameter.parameterType == 'error' && value){
            return eachCallback(new MeshError('Failed to construct module: ' + moduleName, value));
          }
            
          if (callBackParameter.parameterType == 'instance' && value){
            _this._mesh.modules[moduleName].instance = value;
            return eachCallback();
          }
        }
      }

      if (callbackIndex > -1) parameters[callbackIndex] = constructorCallBack;
      else parameters.push(constructorCallBack);

      return moduleBase.apply(moduleBase, parameters);
    }

    if (typeof moduleBase == 'function') {
      var moduleInstance = new (Function.prototype.bind.apply(moduleBase, [null].concat(parameters)));
      _this._mesh.modules[moduleName].instance = moduleInstance;
      return eachCallback();
    }

    _this._mesh.modules[moduleName].instance = moduleBase;
    return eachCallback();

  },
  function(err){
      if (err){
        _this.log.error('Failed to initialize modules', err);
      }
      callback(err);
  });
}

Mesh.prototype._happnizeModules = function(callback){
  var _this = this;
  async.eachSeries(Object.keys(this._mesh.modules), function(moduleName, eachCallback) {

    var args, happnSeq, originalFn;
    var module = _this._mesh.modules[moduleName].instance;

    for(var fnName in module) {
      originalFn = module[fnName];
      if (typeof originalFn !== 'function') continue;
      
      args = UTILITIES.getFunctionParameters(originalFn);
      happnSeq = args.indexOf('$happn');
      if (happnSeq < 0) continue;

      Object.defineProperty(module[fnName],'$happnSeq',{value: happnSeq});
    }

    eachCallback(null);

  }, callback);

}

Mesh.prototype._instantiateComponents = function(config, callback){
  var _this = this;
  async.eachSeries(Object.keys(config.components), function(componentName, eachCallback) {

    var componentConfig = config.components[componentName];
    var componentInstance = new ComponentInstance({name: componentName, mesh: _this});
    
    componentConfig.meshName = config.name;
    componentConfig.setOptions = config.dataLayer.setOptions;
    if (typeof componentConfig.moduleName == 'undefined') componentConfig.moduleName = componentName;

    componentInstance.initialize(
      _this._mesh.modules[componentConfig.moduleName],
      componentConfig,
      function(e){

        if (e) return eachCallback(e);

        _this._mesh.components[componentName] = {"instance":componentInstance, "config":componentConfig};
        eachCallback();

      });
    },
    function(err){
      if (err){
        //message, level, component, data
        _this.log.error('Failed to initialize components', err);
      }
      callback(err);
    });
}

Mesh.prototype._registerSchema = function(config, callback){
  var description = this.describe(false);
  var _this = this;
  this.data.set('/mesh/schema/description', this.describe(false), null, function(e, response){
    if (e) return callback(e);
     _this.data.set('/mesh/schema/config', config, null, function(e, response){
      callback(e);
     });
  });
}

Mesh.prototype._eachComponent = function(operator, callback){
  var _this = this;
   async.eachSeries(Object.keys(this._mesh.components), function(componentName, eachCallback){

    var component = _this._mesh.components[componentName];
    operator(componentName, component, eachCallback);

  }, callback);
}

Mesh.prototype._eachComponentDo = function(options, callback){

  if (!options.methodCategory && !options.methodName)
    return callback(new MeshError("methodName or methodCategory not included in options"));

  this._eachComponent(function(componentName, component, eachCallback){

    var config = component.config;

    if (options.methodCategory)
      options.methodName = config[options.methodCategory];

    if (!options.methodName) {
      return eachCallback();
    }

    // default assume sync with no args.
    if (!config.schema || !config.schema.methods || !config.schema.methods[options.methodName]) {
      component.instance.operate(options.methodName, []);
      return eachCallback();
    }

    var methodConfig = config.schema.methods[options.methodName];
    var methodParameters = (
      methodConfig.parameters?methodConfig.parameters:[]
    ).map(function(p) {return p.value;});

    if (methodConfig.type == "sync"){
      try{
         component.instance.operate(options.methodName, methodParameters);
         eachCallback();
      }catch(e){
        eachCallback(new Error(e));
      }
    }else{
      component.instance.operate(options.methodName, methodParameters, function(e, response){
        if (e){
          eachCallback(e);
        }else{
          eachCallback();
        }
      });
    }
  }, callback);
}

Mesh.prototype._startComponents = function(callback){
  this._eachComponentDo({methodCategory:'startMethod'}, callback);
}

Mesh.prototype._stopComponents = function(callback){
  this._eachComponentDo({methodCategory:'stopMethod'}, callback);
}

Mesh.prototype.attachSystemComponents = function(config){
  
  if (!config.modules) config.modules = {};
  if (!config.components) config.components = {};

  config.modules.api = {
    path:"system:api",
  }

  config.modules.resources = {
    path:"system:resources",
  }

  config.modules.dashboard = {
    path:"system:dashboard",
  }

  config.modules.proxy = {
    path:"system:proxy",
  }

  config.components.api = {
    schema:{
      "exclusive":false
    },
    web:{
      routes:{
        "client":"handleRequest",
        "app":"static"
      }
    }
  };

  config.components.resources = {
    schema:{
      "exclusive":false
    },
    web:{
      routes:{
        "client":"handleRequest",
        "resources":"static"
      }
    }
  }

  config.components.dashboard = {
    schema:{
      "exclusive":false
    },
    web:{
      routes:{
        "page":"handleRequest",
        "app":"static"
      }
    }
  }

  config.components.proxy = {
    schema:{
      "exclusive":false
    },
    web:{
      routes: {
        "app":"static"
      }
    }
  }
}

//if we are running this mesh in test mode, we iterate through the tests and run them, to return a test report
Mesh.prototype.test = function(callback){

}

