/**
 * Created by Johan on 4/14/2015.
 */

global.$happngin = global.$happngin || {nodes: {}};

var API = require('./api');
var Happn = require('@smc/happn');
var DataLayer = require('./dataLayer');
var Config = require('./config');
var async = require('async');
var MeshError = require('./error');
var ComponentInstance = require('./componentInstance');
var path = require("path");
var repl = require('./repl');
var warned = false;
// var Messenger = require('./messenger');

module.exports = function () {
  return new Mesh();
}

module.exports.Mesh = Mesh;
module.exports.MeshClient = API;

// One step start with both args optional
// node -e 'require("happngin").start()'
module.exports.start = function(config, callback, secure) {

  var mesh;

  if (typeof secure == 'undefined') secure = false;
  config = config || {};
  callback = callback || (typeof config == 'function' ? config : function(err) {
    if (err) {
      console.error(err.stack);
      process.exit(err.errno || 1);
    }
  });

  (mesh = new Mesh()).initialize(config, function(err) {
    if (err) return callback(err);
    if (!secure) $happngin.nodes[config.name] = mesh;
    if (!secure && !config.repl) {
      config.repl = {
        socket: '/tmp/happngin.' + config.name + '.socket'
      }
    }
    return mesh.start(function(err) {
      if (err) return callback(err);
      callback(null, mesh);
    });
  });
}

// Start without exposing new mesh node in global.$happngin.nodes
module.exports.startSecure = function(config, callback) {
  return module.exports.start(config, callback, true);
}

function Mesh() {
  this.initialize_DOC = 'https://github.com/FieldServer/happngin/blob/master/docs/starting.md';
  this.initialize = this.initialize; // make visible
  Object.defineProperty(this, 'initialized', {
    value: false,
    configurable: true,
    writable: true
  });
  Object.defineProperty(this, 'initializing', {
    value: false,
    configurable: true,
    writable: true
  });
  this.start = this.start;
  this.stop = this.stop;
  this.describe = this.describe;
  this.test = this.test;
}

// Step1 of two step start with mandatory args (initialize({},function Callback(){ start() }))
Mesh.prototype.initialize = function(config, callback){
  this.initialized = false;
  this.initializing = true;

  var _this = this;
  Config.process(this, config, function(e, config) {

    if (e) return callback(e);

    _this.log = UTILITIES.createLogger('Mesh'); //' + '/' + config.name);
    _this.log.$$DEBUG('initialize');
    _this.log.info('using name \''+config.name+'\'');

    process.on('exit', function(code) {_this.log.info('exit ' + code);});
    
    Object.defineProperty(_this, 'api', {
      get: function() {
        if (!warned) {
          _this.log.warn('Use of mesh.api.* is deprecated. Use mesh.*');
          warned = true;
        }
        return _this;
      }
    });

    //_this.exchange_DOC = 'https://github.com/FieldServer/happngin/blob/master/docs/exchange.md';
    _this.exchange = {};

    //_this.event_DOC = 'https://github.com/FieldServer/happngin/blob/master/docs/event.md';
    _this.event = {};

    //_this.data_DOC = 'https://github.com/FieldServer/happngin/blob/master/docs/data.md';
    //_this.data_INFO = 'Same as _mesh.data';
    Object.defineProperty(_this, 'data', {
      get: function() {
        return _this._mesh.data;
      },
      enumerable: true
    });

    _this._mesh = {
      config: config,
      modules: {},
      components: {},
      description: {},
      endpoints: {},
      exchange: {},
    };

    _this.attachSystemComponents(config);

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
        API._initializeLocal(_this, _this.describe(), Happn, config, callback);
      },
      function(callback) {
        _this.log.$$DEBUG('initialized local');
        _this._initializeEndpoints(callback);
      },
      function(callback) {
        _this.log.$$DEBUG('initialized endpoints');
        API._attachProxyPipeline(_this, _this.describe(), Happn, config, callback);
      },
      function(callback) {
        _this.log.$$DEBUG('attached to proxy pipeline');
        callback();
      }
    ], function(e){
      if (!e) _this.log.info('up');
      repl.create(_this);
      _this.initialized = true;
      _this.initializing = false;
      callback(e);
    });


  });
}

// Step2 of two step start (initialize({},function callback(){ start() }))
Mesh.prototype.start = function(callback){
  if (!this.initialized) return console.warn('missing initialize()');
  this.log.$$DEBUG('start');

  this._startComponents(callback); //BUG - callback not always called!!
}

Mesh.prototype.stop = function(options, callback){
  if (!this.initialized) return console.warn('not started.');
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
  if (!this.initializing && !this.initialized) return console.error('beggaring description!');
  if (this._mesh.description && cached == true) return this._mesh.description;

  var description = {
    name: this._mesh.config.name, 
    components: {},
    setOptions: this._mesh.config.datalayer.setOptions
  };

  for (var componentName in this._mesh.components){
    description.components[componentName] = this._mesh.components[componentName].instance.describe();
  }

  return this._mesh.description = description;
}

Mesh.prototype._initializeDataLayer = function(config, callback){
  var _this = this;
  this._mesh.datalayer = DataLayer.create( config,
    function(err, client) {
      if (err) return callback(err);
      _this._mesh.data = client;
      callback();
    }
  );
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
    componentConfig.setOptions = config.datalayer.setOptions;
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

Mesh.prototype._initializeEndpoints = function(callback) {

  var config = this._mesh.config;
  var _this = this;

  // Externals
  var exchangeAPI = _this.exchange = (_this.exchange || {});
  var eventAPI = _this.event = (_this.event || {});
  
  // Internals
  _this._mesh = _this._mesh || {};
  _this._mesh.exchange = _this._mesh.exchange || {};


  async.parallel(Object.keys(config.endpoints).map(function(endpointName) {

    // return array of functions for parallel([])

    return function(done) {

      _this.log.$$DEBUG('initialize endpoint \'' + endpointName + '\'');
      
      var endpointConfig = config.endpoints[endpointName];
      endpointConfig.config = endpointConfig.config || {};
      endpointConfig.config.secret = endpointConfig.config.secret || 'mesh';
      endpointConfig.config.authTokenSecret = endpointConfig.config.authTokenSecret || 'mesh';

      new Happn.client(endpointConfig, function(error, client){

        if (error) {
          _this.log.error('failed connection to endpoint \'' + endpointName + '\'', error);
          return done(error);
        }

        client.get('/mesh/schema/description', {}, function(error, response) {

          if (error) {
            _this.log.error('failed getting description from \'' + endpointName + '\'', error);
            return done(error);
          }

          _this.log.$$TRACE('got description from \'' + endpointName + '\'');

          //make sure if the description changes, we know it
          client.on('/mesh/schema/description', {}, function(eventData){
            // TODO: handle changed description (rebuild build exchange / event)
            _this._mesh.endpoints[endpointName].description = eventData.payload.data;
          }, function(error) {

            if (error) {
              _this.log.warn('Unable to subscribe to remote endpoint \''+endpointName+'\' description.', error);
            }

            try {
              _this._mesh.endpoints[endpointName] = {
                "data":client,
                "description":response.payload[0].data,
                "name":endpointName
              }
              _this.log.$$DEBUG('assigned endpoint \'' + endpointName + '\'');

            } catch (error) {
              _this.log.warn('Malformed describe from mesh \''+endpointName+'\' ignored.', error);
            }

            API._createEndpoint(_this, endpointName, exchangeAPI, eventAPI, function(error) {
              if (error) return done(error);
              _this.log.info('ready endpoint \''+endpointName+'\'');
              done();
            });
          });
        });
      });
    }
  }), callback);
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

