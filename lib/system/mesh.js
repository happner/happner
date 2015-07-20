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

function Mesh() {

  var _this = this;

  //the system is the 'global' variable passed around to all component instances for use
  
  _this.api = {};
  
  _this._initializeDataLayer = function(config, callback){
    try{

      if (!config.dataLayer) config.dataLayer = {};
      if (!config.dataLayer.authTokenSecret) config.dataLayer.authTokenSecret = 'a256a2fd43bf441483c5177fc85fd9d3';
      if (!config.dataLayer.systemSecret) config.dataLayer.systemSecret = 'mesh';
      if (!config.dataLayer.log_level) config.dataLayer.log_level = 'info|error|warning';
      if (!config.dataLayer.setOptions) config.dataLayer.setOptions = {noStore:true};

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
            _this.api.data = client;
            callback();
          });

        });
    }catch(e){
      callback(new Error(e));
    }
  }

  _this._initializeModules = function(config, callback){
    _this.modules = {};
    _this.modulePaths = {};

    var moduleManager = require('module');

    async.eachSeries(Object.keys(config), function(moduleName, eachCallback) {

        _this.modules[moduleName] = {};
        var moduleConfig = config[moduleName];
        var moduleBase;

        if (!moduleConfig.path) moduleConfig.path = moduleName;

        _this.modules[moduleName].config = config[moduleName];

        try {

          var modulePath = moduleConfig.path;
          if (moduleConfig.path.indexOf('system:') == 0){
            var pathParts = moduleConfig.path.split(':');
            modulePath = __dirname + '/components/' + pathParts[1];
          }
          moduleBase = require(modulePath);

          _this.modules[moduleName].directory = path.dirname(require.resolve(modulePath));

        } catch (e) {
          return eachCallback(new Error(e));
        }
        var constructorCallBack;

        if (moduleConfig.constructor && typeof moduleConfig.constructor !== 'function') {

          if (moduleConfig.constructor.name)
            moduleBase = moduleBase[moduleConfig.constructor.name];

          if (!moduleConfig.constructor.parameters)
            moduleConfig.constructor.parameters = [];

          var callParameters = [moduleConfig.constructor.parameters.length];
          var callbackIndex = -1;

          moduleConfig.constructor.parameters.map(function(parameter, index){
            if (parameter.parameterType == 'callback'){
              callbackIndex = index;
            }else if(parameter.value){
              callParameters[index] = parameter.value;
            }else
              callParameters[index] = null;
          });

          //we register our callback
          if (moduleConfig.constructor.type == 'async'){

            constructorCallBack = function(){
            
              for (var index in arguments){
                var value = arguments[index];

                var callBackParameter = moduleConfig.constructor.callback.parameters[index];
                if (callBackParameter.parameterType == 'error' && value){
                  return eachCallback(new MeshError('Failed to construct module: ' + moduleName, value));
                }
                  
                if (callBackParameter.parameterType == 'instance' && value){
                  _this.modules[moduleName].instance = value;
                  return eachCallback();
                }
              }
            }

            if (callbackIndex == -1) return eachCallback(new MeshError('No callback was specified for async constructor of module: ' + moduleName));

            callParameters[callbackIndex] = constructorCallBack;
            moduleBase.apply(moduleBase, callParameters);

          }else{
           
          
           var moduleInstance;

            if (moduleConfig.constructor.context == "new"){
              var constructor = moduleBase.bind.apply(moduleBase, callParameters);
              moduleInstance = new constructor();
            }
            else
              moduleInstance = moduleBase.apply(moduleBase, callParameters);

            _this.modules[moduleName].instance = moduleInstance;
            eachCallback();
          }
        }else{
          // default as instanciate class
          _this.modules[moduleName].instance = new moduleBase();
          eachCallback();
        }
      }, 
      function(err){
          if (err){
            UTILITIES.log('Failed to initialize modules', 'error', 'mesh', err);
          }
          callback(err);
      });
  }

  _this._happnizeModules = function(callback){

    // build proxy functions on the each module to perform $happn injection

    var createProxyFn = function(originalFn, happnSeq, argCount) {
      
      if (happnSeq == 0) return function(happn, argsArray) {
        // HAPPNGIN PROXY FUNCTION
        // see instead this.func.$originalFn.toString()
        if (happn instanceof ComponentInstance && argsArray instanceof Array) {
          argsArray.unshift(happn);
          originalFn.apply(this, argsArray);
          //argsArray.shift(); // Happn responder (ACK) receives args, circular reference with $happn unencodable.
          return;
        }
        // Handle calls not via happngin
        var argsArray = Array.prototype.slice.call(arguments);
        // if (!(argsArray[happnSeq] instanceof ComponentInstance)) {
        //   // asked for happn but dont have it,
        //   // put undefined into $happn arg position
        //   argsArray.unshift(undefined);
        // }
        return originalFn.apply(this, argsArray);
      }

      if (happnSeq == argCount - 1) return function(happn, argsArray) {
        // HAPPNGIN PROXY FUNCTION */
        // see instead this.func.$originalFn.toString()
        if (happn instanceof ComponentInstance) {
          argsArray.push(happn);
          originalFn.apply(this, argsArray);
          argsArray.pop();
          return;
        }
        var argsArray = Array.prototype.slice.call(arguments);
        // $happn is last, does not matter
        return originalFn.apply(this, argsArray);
      }
      
      return function(happn, argsArray) {
        // HAPPNGIN PROXY FUNCTION
        // see instead this.func.$originalFn.toString()
        if (happn instanceof ComponentInstance) {
          argsArray.splice(happnSeq, 0, happn);
          originalFn.apply(this, argsArray);
          argsArray.splice(happnSeq, 1);
          return;
        }
        // Handle calls not via happngin
        var argsArray = Array.prototype.slice.call(arguments);
        // if (!(argsArray[happnSeq] instanceof ComponentInstance)) {
        //   // asked for happn but dont have it
        //   // put undefined into $happn arg position
        //   argsArray.splice(happnSeq, 0, undefined);
        // }
        return originalFn.apply(this, argsArray);
      }
    }

    async.eachSeries(Object.keys(_this.modules), function(moduleName, eachCallback) {

      var args, happnSeq, originalFn;
      var module = _this.modules[moduleName].instance;

      for(var fnName in module) {
        originalFn = module[fnName];
        if (typeof originalFn !== 'function') continue;
        args = UTILITIES.getFunctionParameters(originalFn);
        happnSeq = args.indexOf('$happn');
        if (happnSeq < 0) continue;

        module[fnName] = createProxyFn(originalFn, happnSeq, args.length);
        Object.defineProperty(module[fnName],'$originalFn',{value: originalFn});
      }

      eachCallback(null);

    }, callback);

  }

  _this._instantiateComponents = function(config, callback){
    _this.components = {};

    async.eachSeries(Object.keys(config.components), function(componentName, eachCallback) {

      var componentConfig = config.components[componentName];
      var componentInstance = new ComponentInstance();
      
      componentInstance.mesh = _this.api;
      componentInstance.name = componentName;
      componentConfig.meshName = config.name;
      componentConfig.setOptions = config.dataLayer.setOptions;

      componentInstance.initialize(
        _this.modules[componentConfig.moduleName],
        componentConfig,
        function(e){

          if (e) return eachCallback(e);

          _this.components[componentName] = {"instance":componentInstance, "config":componentConfig};
          eachCallback();

        });
      },
      function(err){
        if (err){
          //message, level, component, data
          UTILITIES.log('Failed to initialize components', 'error', 'mesh', err);
        }
        callback(err);
      });
  }

  _this._registerSchema = function(config, callback){

    var description = _this.describe(false);
    _this.api.data.set('/mesh/schema/description', _this.describe(false), null, function(e, response){
      if (e) return callback(e);
       _this.api.data.set('/mesh/schema/config', config, null, function(e, response){
        callback(e);
       });
    });
  }

  _this._eachComponent = function(operator, callback){
     async.eachSeries(Object.keys(_this.components), function(componentName, eachCallback){

      var component = _this.components[componentName];
      operator(componentName, component, eachCallback);

    }, callback);
  }

  _this._eachComponentDo = function(options, callback){

    if (!options.methodCategory && !options.methodName)
      return callback(new MeshError("methodName or methodCategory not included in options"));

    _this._eachComponent(function(componentName, component, eachCallback){

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
      var methodParameters = methodConfig.parameters?methodConfig.parameters:[];

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

  _this._startComponents = function(callback){
    _this._eachComponentDo({methodCategory:'startMethod'}, callback);
  }

  _this._stopComponents = function(callback){
    _this._eachComponentDo({methodCategory:'stopMethod'}, callback);
  }

  _this.stop = function(options, callback){

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
      
    _this._stopComponents(function(e){
      if (e){
        UTILITIES.log("Failure to stop components ", "error", "mesh", e);
        process.exit(1);
      }else{
        UTILITIES.log("Stopped components successfully", "info", "mesh");
        process.exit(0);
      }
    });
  }

  _this.attachSystemComponents = function(config){
    if (!config.modules)
      config.modules = {};

    if (!config.components)
      config.components = {};

    config.modules.resources = {
      path:"system:resources",
      constructor:{
        type:"sync",
        parameters:[]
      }
    }

    config.modules.api = {
      path:"system:api",
      constructor:{
        type:"sync",
        parameters:[]
      }
    }

    config.modules.dashboard = {
      path:"system:dashboard",
      constructor:{
        type:"sync",
        parameters:[]
      }
    }

    config.components.resources = {
      moduleName:"resources",
      // scope:"component",//either component(mesh aware) or module - default is module
      schema:{
        "exclusive":false
      },
      web:{
        routes:{
          "client":"handleRequest",
          "lib":"static"
        }
      }
    }

    config.components.api = {
      moduleName:"api",
      // scope:"component",//either component(mesh aware) or module - default is module
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

    config.components.dashboard = {
      moduleName:"dashboard",
      // scope:"component",//either component(mesh aware) or module - default is module
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
  }

  _this.initialize = function(config, callback){

    global.UTILITIES = new Utilities(config.util);
    _this.config = config;

    _this.attachSystemComponents(config);

    async.series([
  
      function(callback) {                                            _this._initializeDataLayer(config, callback) },
      function(callback) { UTILITIES.log('initialized data layer'  ); _this._initializeModules(config.modules, callback) },
      function(callback) { UTILITIES.log('initialized modules'     ); _this._happnizeModules(callback) },
      function(callback) { UTILITIES.log('happnized modules'       ); _this._instantiateComponents(config, callback) },
      function(callback) { UTILITIES.log('initialized components'  ); _this._registerSchema(config, callback) },
      function(callback) { UTILITIES.log('registered schema'       ); API._initializeEndpoints(_this, _this.describe(), happn, config, callback) },
      function(callback) { UTILITIES.log('initialized endpoints'   ); API._createExchangeAPILayer(_this, callback) },
      function(callback) { UTILITIES.log('initialized exchange api'); API._createEventAPILayer(_this, callback) },
      function(callback) { UTILITIES.log('initialized events api'  ); callback() }

    ], function(e){
      if (!e){
        UTILITIES.log('mesh up...');
      }
      callback(e);
    });
  }

  _this.start = function(callback){
   _this._startComponents(callback);
  }

  _this.describe = function(cached){
    if (_this.description && cached == true) return _this.description;

    var description = {"name":_this.config.name, "components":{}, "setOptions":_this.config.dataLayer.setOptions?_this.config.dataLayer.setOptions:{noStore:true}};

    for (var componentName in _this.components){
      description.components[componentName] = _this.components[componentName].instance.describe();
    }

    _this.description = description;

    return _this.description;
  }

  //if we are running this mesh in test mode, we iterate through the tests and run them, to return a test report
  _this.test = function(callback){

  }
}
