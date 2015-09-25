/**
 * Created by Johan on 4/14/2015.
 */

// process.env.NO_EXIT_ON_UNCAUGHT (not recommended - unless your boot-time is v/long and your confidence is v/high)
// process.env.NO_EXIT_ON_SIGTERM
// process.env.STOP_ON_SIGINT (just stops components and disconnects network, no exit) <--- functionality pending
// process.env.START_AS_ROOTED (exposes all mesh nodes in process at global.$happner)
// process.env.UNROOT_ON_REPL (removes $happner from global and attaches it to repl server context during startup)

var root = {
  nodes: {},
  utils: {}
}

var depWarned0 = false; // mesh.api
var depWarned1 = false; // componentConfig.meshName
var depWarned2 = false; // componentConfig.setOptions
var depWarned3 = false; // module.directory

if (process.env.START_AS_ROOTED) global.$happner = root;

var API = require('./system/api')
  , Happn = require('happn')
  , DataLayer = require('./system/dataLayer')
  , Config = require('./system/config')
  , async = require('async')
  , MeshError = require('./system/error')
  , ComponentInstance = require('./system/componentInstance')
  , path = require("path")
  , repl = require('./system/repl')
  , warned = false
  , moment = require('moment')
  , readFileSync = require('fs').readFileSync
  , Promise = require('bluebird')
  , Packager = require('./system/packager')
  ;

module.exports = function () {
  return new Mesh();
}

module.exports.WELCOME = true;
module.exports.About = 'https://github.com/happner/happner/blob/master/docs/starting.md';
module.exports.Mesh = Mesh;
module.exports.MeshClient = API;

Object.defineProperty(module.exports, 'Promise', {
  get: function () {return Promise;},
  enumerable: true
});



// Quick start.

module.exports.start = Promise.promisify(function (config, callback) {


  // node -e 'require("happner").start()'

  config = config || {};
  callback = callback || (typeof config == 'function' ? config : function(err) {
    if (err) {
      console.error(err.stack);
      process.exit(err.errno || 1);
    }
  });


  // node -e 'require("happner").start(9999)'

  if (typeof config == 'number') config = {
    datalayer: {
      port: config
    }
  };


  // node -e 'require("happner").start("5.6.7.88:7654")'

  if (typeof config == 'string') {
    var parts = config.split(':');
    config = {
      datalayer: {}
    };
    config.datalayer.host = parts[0];
    if (parts[1]) config.datalayer.port = parseInt(parts[1]);
  }

  ;(new Mesh()).initialize(config, function(err, mesh) {
    if (err) return callback(err, mesh);
    return mesh.start(function(err, mesh) {
      if (err) return callback(err, mesh);
      callback(null, mesh);
    });
  });
});

function Mesh(config) {

  var _this = this;

  this._mesh = {
                           // (all false) - runlevel 0
    initializing: false,  // true         - runlevel 10
    initialized: false,  // true          - runlevel 20 
    starting: false,    // true           - runlevel 30
    started: false,    // true            - runlevel 40

    config: config || {},
    modules: {},
    components: {},
    description: {},
    endpoints: {},
    exchange: {},
    datalayer: {},
  };

  this._stats = {
    proc:{
      up:moment.utc()
    },
    component:{}
  };


  // candidate feature
  Object.defineProperty(this, 'tools', {
    value: {}
  });


  Object.defineProperty(this, 'runlevel', {
    get: function() {
      if (_this._mesh.started) return 40;
      if (_this._mesh.starting) return 30;
      if (_this._mesh.initialized) return 20;
      if (_this._mesh.initializing) return 10;
      return 0;
    },
    // set: function(n) {
    // 
    // },
    enumerable: true
  });


  this.initialize = this.initialize; // make function visible in repl (console)
  this.start = this.start;
  this.stop = this.stop;
  this.describe = this.describe;
  this.test = this.test;


  Object.defineProperty(this, 'api', {
    get: function() {
      if (depWarned0) return _this;
      _this.log.warn('Use of mesh.api.* is deprecated. Use mesh.*');
      try {
        _this.log.warn(' - at %s', _this.getCallerTo('mesh.js'));
      } catch (e) {}
      depWarned0 = true;
      return _this;
    }
  });
}

// Step1 of two step start with mandatory args (initialize(function Callback(){ start() }))

Mesh.prototype.initialize = Promise.promisify(function(config, callback){

  this._mesh.initialized = false;
  this._mesh.initializing = true;

  this._mesh.caller = this.getCallerTo('mesh.js');

  if (typeof config == 'function') {
    callback = config;
    config = this._mesh.config; // assume config came on constructor
  } else if (!config) {
    config = this._mesh.config; // again
  } else if (config) {
    this._mesh.config = config;
  } else {
    config = this._mesh.config;
  }

  Object.defineProperty(this, 'version', {
    value: JSON.parse(readFileSync(__dirname + '/../package.json')).version,
    enumerable: true,
  })

  var _this = this;

  // Async config step for (ask what i should do)ness <--- functionality pending

  var configer = new Config();

  configer.process(this, config, function(e, config) {

    if (e) return callback(e);

    root.nodes[config.name] = _this;

    _this.log.createLogger('Mesh', _this.log);
    _this.log.$$DEBUG('initialize');

    if (!config.home) {
      config.home = config.home || _this._mesh.caller.file ? path.dirname(_this._mesh.caller.file) : null
    }

    if (!config.home) {
      _this.log.warn('home unknown, require() might struggle');
    } else {
      _this.log.info('home %s', config.home);
    }

    // Need to add the caller's module path as first for module searches.
    _this.updateSearchPath(config.home);

    _this.log.info('happner v%s', _this.version);
    _this.log.info('config v%s', (config.version || '..'));
    _this.log.info('localnode \'%s\' at pid %d', config.name, process.pid);

    Object.defineProperty(_this._mesh, 'log', {
      value: _this.log
    });

    if (process.env.START_AS_ROOTED && !config.repl) {
      config.repl = {
        socket: '/tmp/socket.' + config.name
      }
    }

    _this.exchange = {};
    _this.event = {};
    _this.data = {};  // Need to filter access to the data object
                     //  eg. $happn.data.pubsub.happn.server.close();
                    //   (stops the http server in happn, taking down the whole system)
                   // 

    [ 'on',
      'off',
      'get',
      'getPaths',
      'set',
      'setSibling',
      'session',
      'remove',
    ].forEach(function(name) {
      Object.defineProperty(_this.data, name, {
        value: function() {
          if (typeof _this._mesh.data[name] == 'function') {
            return _this._mesh.data[name].apply(_this._mesh.data, arguments);
          }
          return _this._mesh.data[name];
        },
        enumerable: name == 'session' ? false : true
      })
    });

    // Object.defineProperty(_this, 'data', {
    //   get: function() {
    //     return _this._mesh.data;
    //   },
    //   enumerable: true
    // });

    repl.create(_this);

    if (Object.keys(root.nodes).length == 1) {

      // only one listener for each below
      // no matter how many mesh nodes in process

      process.on('uncaughtException', function(err) {

        // only first mesh node will log this

        _this.log.fatal('uncaughtException (or set NO_EXIT_ON_UNCAUGHT)', err);
        if (process.env.NO_EXIT_ON_UNCAUGHT) return;
        process.exit(1);

      });

      process.on('exit', function(code) {

        // call stop into all mesh nodes

        Object.keys(root.nodes).forEach(
          function(name) {
            root.nodes[name].stop();
            root.nodes[name].log.info('exit %s', code);
          }
        )
      });

      var stopmesh = function(mesh) {
        if (!mesh._mesh.initialized) process.exit(0)
        mesh.stop({exitCode: 0, kill: true}, function(e) {
          mesh._mesh.initialized = false;
          if (e) mesh.log.warn('error during stop', e);
        });
      }

      var pausemesh = function(mesh) {
        mesh.stop(function(e) {
          mesh._mesh.initialized = false;
          if (e) mesh.log.warn('error during stop', e)
        });
      }

      process.on('SIGTERM', function(code) {
        console.log();
        if (process.env.NO_EXIT_ON_SIGTERM) {
          _this.log.warn('SIGTERM ignored');
          return;
        }
        Object.keys(root.nodes).forEach(
          function(name) {
            root.nodes[name].log.warn('SIGTERM');
            stopmesh(root.nodes[name]);
          }
        );
      });

      process.on('SIGINT', function() {
        console.log();
        if (process.env.STOP_ON_SIGINT) {
          Object.keys(root.nodes).forEach(
            function(name) {
              root.nodes[name].log.warn('SIGINT without exit');
              pausemesh(root.nodes[name]);
            }
          );          
          return;
        }
        Object.keys(root.nodes).forEach(
          function(name) {
            root.nodes[name].log.warn('SIGINT');
            stopmesh(root.nodes[name]);
          }
        );  
      });

      // process.on('SIGHUP', function() {
      //   _this.log.info('SIGHUP ignored');
      // });

    }

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
        _this._initializePackager(callback);
      },
      function(callback) {
        _this.log.$$DEBUG('initialized packager');
        _this._instantiateComponents(config, callback);
      },
      function(callback) {
        _this.log.$$DEBUG('initialized components');
        _this._registerSchema(config, callback);
      },
      function(callback) {
        _this.log.$$DEBUG('registered schema');
        API._initializeLocal(_this, _this.describe(), config, callback);
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
      if (!e) _this.log.info('initialized!');
      _this._mesh.initialized = true;
      _this._mesh.initializing = false;
      callback(e, _this);
    });
  });
});

// Step2 of two step start (initialize({},function callback(){ start() }))
Mesh.prototype.start = Promise.promisify(function(callback){
  if (!this._mesh.initialized) return console.warn('missing initialize()');

  this._mesh.starting = true;
  this._mesh.started = false;

  var _this = this;
  var waiting = setInterval(function() {
    Object.keys(_this._mesh.calls.starting).forEach(function(name) {
      _this.log.warn('awaiting startMethod \'%s\'', name);
    });
  },10*1000);

  var impatient = setTimeout(function() {
    Object.keys(_this._mesh.calls.starting).forEach(function(name) {
      _this.log.fatal('startMethod \'%s\' did not respond', name, new Error('timeout'));
    });
    _this.stop({
      kill: true,
      wait: 200
    })
  }, this._mesh.config.startTimeout || 60 * 1000);

  this.__startComponents(function(error) {
    clearInterval(waiting);
    clearTimeout(impatient);
    if (error) return callback(error, _this);
    _this._mesh.starting = false;
    _this._mesh.started = true;
    _this.log.info('started!');
    callback(null, _this);
  });
});

Mesh.prototype.stop = Promise.promisify(function(options, callback){

  if (!this._mesh.initialized) return;

  this._mesh.initialized = false;
  this._mesh.initializing = false;
  this._mesh.starting = false;
  this._mesh.started = false;

  // TODO: more thought/planning on runlevels
  //       this stop sets to 0 irrespective of success

  this.log.$$DEBUG('initiating stop');

  if (typeof options === 'function'){
     callback = options;
     options = {};
  }

  if (options.kill && !options.wait)
    options.wait = 10000;

  var timeout;

  var kill = function(){
     process.exit((typeof options.exitCode == 'number') ? options.exitCode : 1);
  }

  var _this = this;
  if (options.kill){
    timeout = setTimeout(function(){
      _this.log.error("failed to stop components, force true");
      kill();
    }, options.wait);
  }
  
  var _this = this;
  this.__stopComponents(function(e){
      //
     // TODO: Only one error!
    //        Multiple components may have failed to stop.

    if (e){
      // component instance already logged the err
      _this.log.error("failure to stop components");

      /*if (timeout) {

        // Kill is pending.

        // Stop network even tho some components
        // have failed to stop

        // Dont wait for callback.

        console.log(_this._mesh.datalayer);

        _this._mesh.datalayer.server.stop(options, function(e) {

          if (e) return _this.log.error('datalayer stop error', e);

          _this.log.info('datalayer stopped');

        });

        _this.log.warn('datalayer not pending');

        // Give the caller to stop the error,
        // they still some time to do something with it.

        if (callback) return callback(e, _this);

        return;

      }*/

      // Kill is not pending.

      // Some components failed to stop.

      // Dont stop the network.

      // TODO: enable a second call to stop() 
      //       that does not stop components that
      //       are already stopped.

     /* _this.log.warn('datalayer not stopped');

      if (callback) return callback(e, _this);

      return;*/

    }

    // All components stopped ok

    _this._mesh.datalayer.server.stop(options, function(e) {

      // Stop the pending kill (if present)
      // clearTimeout(timeout);
      if (e) {
        _this.log.error('datalayer stop error', e);
        if (options.kill) return kill();
        return;
      }

      _this.log.$$DEBUG('stopped datalayer');
      _this.log.info('stopped!');

      if (options.kill) kill();
      if (callback) callback(e, _this);

    });
  });
});

Mesh.prototype.describe = function(cached){
  if (!this._mesh.initializing && !this._mesh.initialized) return console.warn('beggaring description!');
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

Mesh.prototype.getCallerTo = function(skip) {
  var stack, file, parts, name, result = {};
  var origPrep = Error.prepareStackTrace;
  Error.prepareStackTrace = function(e, stack){return stack;}
  try {
    stack = Error.apply(this, arguments).stack;
    stack.shift();
    stack.shift();
    for (var i = 0; i < stack.length; i++) {
      file = stack[i].getFileName();
      line = stack[i].getLineNumber();
      colm = stack[i].getColumnNumber();
      // func = stack[i].getFunction();

      // Since using bluebird some .getFileName()'s are coming up undefined
      if (file) {


        parts = file.split(path.sep);

        // skip calls from the promise implementation

        if (parts.indexOf('bluebird') !== -1) continue;

        if (!skip) {
          result = {
            file: file,
            line: line,
            colm: colm
          };
          break;
        }

        name = parts.pop();

        if (name !== skip) {
          result = {
            file: file,
            line: line,
            colm: colm
          };
          break;
        }
      }
    }
  }
  finally {
    Error.prepareStackTrace = origPrep;
    result.toString = function() {
      return result.file + ':' + result.line + ':' + result.colm
    }
    return result;
  }
}

Mesh.prototype.updateSearchPath = function(startAt) {

  var newPaths = [];

  if (!startAt) return;

  this.log.$$TRACE('updateSearchPath( before ', module.paths);

  var addPath = function(dir) {
    var add = path.normalize(dir + path.sep + 'node_modules');
    if (module.paths.indexOf(add) >= 0) return;
    newPaths.push(add);
  }

  var apply = function(paths) {
    paths.reverse().forEach(function (path) {
      module.paths.unshift(path);
    });
  }

  var recurse = function(dir) {
    addPath(dir);
    var next = path.dirname(dir);
    if (next.length < 2 ||
      (next.length < 4 && next.indexOf(':\\') != -1 )) {
      addPath(next);
      return apply(newPaths);
    }
    recurse(next);
  }

  recurse(startAt);

  this.log.$$TRACE('updateSearchPath( after ', module.paths);

}

Mesh.prototype._initializeDataLayer = function(config, callback){
  var _this = this;
  this._mesh.datalayer = DataLayer.create(this, config,
    function(err, client) {
      if (err) return callback(err, _this);
      _this._mesh.data = client;
      callback(null, _this);
    }
  );
}

Mesh.prototype._initializeModules = function(config, callback){

  // NB: If this functionality is moved into another module the
  //     module.paths (as adjusted in updateSearchPath(caller))
  //     will need to be done in the new module.
  //    
  //     Otherwise the require() won't search from the caller's
  //     perspective


  // Build list of modules that the components require
  // Won't start the rest (even if module in config)

  var needed = {};

  Object.keys(config.components).map(function(name){
    return [name, config.components[name]]
  }).forEach(function(array) {
    var componentName = array[0];
    var componentConfig = array[1];
    var moduleName = componentConfig.moduleName || componentName;
    
    needed[moduleName] = true;

    if (!config.modules[moduleName]) {
      // create default for missing module defintion
      config.modules[moduleName] = {};
    }
  });

  var _this = this;
  async.eachSeries(Object.keys(config.modules), function(moduleName, eachCallback) {

    if (!needed[moduleName]) {
      _this.log.$$DEBUG('skip unused module \'%s\'', moduleName);
      eachCallback();
      return;
    }

    _this._mesh.modules[moduleName] = {};
    var moduleInstance;
    var moduleConfig = config.modules[moduleName];
    var moduleBase;
    var callbackIndex = -1;
    var home;
    var ignore;

    if (moduleName == 'www') {
      ignore = 'www';
    }

    if (moduleConfig.instance) {
      moduleConfig.home = moduleConfig.home || '__NONE__';
      moduleBase = moduleConfig.instance;
      home = moduleConfig.home;
    }

    if (!moduleConfig.path) moduleConfig.path = moduleName;

    _this._mesh.modules[moduleName].config = config.modules[moduleName];

    try {

      var modulePath = moduleConfig.path;

      if (moduleConfig.path.indexOf('system:') == 0){
        var pathParts = moduleConfig.path.split(':');
        modulePath = __dirname + '/modules/' + pathParts[1];
      }

      var moduleBasePath;

      if (!home) {

        try {

          modulePath.replace(/\.js$/, '').split('.').map(function(part, ind){

            if (ind == 0){
              moduleBasePath = part;
              _this.log.$$DEBUG('requiring module %s', modulePath);
              moduleBase = require(part);
            }
            else
              moduleBase = moduleBase[part];

          });

        } catch (e) {
          try {
            _this.log.$$DEBUG('alt-requiring module happner-%s', modulePath);
            moduleBase = require('happner-' + modulePath);
            moduleBasePath = 'happner-' + modulePath;
          } catch (f) {
            _this.log.$$DEBUG('alt-requiring happner-%s failed', modulePath, f);
            throw e
          }
        }
      }

      home = home || path.dirname(require.resolve(moduleBasePath));
      Object.defineProperty(_this._mesh.modules[moduleName], 'directory', {
        get: function() {
          if (depWarned3) return home;
          _this.log.warn('Use of module.directory is deprecated. Use module.home');
          try {
            _this.log.warn(' - at %s', _this.getCallerTo('mesh.js'));
          } catch (e) {}
          depWarned3 = true;
          return home;
        }
      });

      Object.defineProperty(_this._mesh.modules[moduleName], 'home', {
        get: function() {
          return home;
        }
      });

    } catch (e) {
      if (ignore) {
        _this.log.info('missing or null module \'%s\'', ignore);
        delete config.modules[moduleName];
        delete config.components[moduleName];
        delete _this._mesh.modules[ignore];
        return eachCallback();
      } else {
        return eachCallback(new Error(e));
      }
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

    var errorIfNull = function(module) {
      if (!module) {
        _this.log.warn('missing or null module \'%s\'', moduleName);
        return {};
      }
      return module;
    }

    var parameters = getParameters();

    if (moduleConfig.construct) {

      _this.log.$$DEBUG('construct module \'%s\'', moduleName);

      if (moduleConfig.construct.name)
        moduleBase = moduleBase[moduleConfig.construct.name];

      try {
        moduleInstance = new (Function.prototype.bind.apply(moduleBase, [null].concat(parameters)));
        _this._mesh.modules[moduleName].instance = errorIfNull(moduleInstance);
      } catch (e) {
        _this.log.error('error constructing \'%s\'', moduleName, e);
        return eachCallback(e);
      }
      return eachCallback();

    }

    if (moduleConfig.create) {

      _this.log.$$DEBUG('create module \'%s\'', moduleName);

      if (moduleConfig.create.name)
        moduleBase = moduleBase[moduleConfig.create.name];

      if (moduleConfig.create.type != 'async') {
        var moduleInstance = moduleBase.apply(null, parameters);
        _this._mesh.modules[moduleName].instance = errorIfNull(moduleInstance);
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
            _this._mesh.modules[moduleName].instance = errorIfNull(value);
            return eachCallback();
          }
        }
      }

      if (callbackIndex > -1) parameters[callbackIndex] = constructorCallBack;
      else parameters.push(constructorCallBack);

      return moduleBase.apply(moduleBase, parameters);
    }

    if (typeof moduleBase == 'function') {
    
      _this.log.$$DEBUG('construct/create module \'%s\'', moduleName);

      try {
        moduleInstance = new (Function.prototype.bind.apply(moduleBase, [null].concat(parameters)));
      } catch (e) {
        _this.log.error('error construct/creating \'%s\'', moduleName, e);
        return eachCallback(e);
      }

      _this._mesh.modules[moduleName].instance = errorIfNull(moduleInstance);
      return eachCallback();
    }

    _this.log.$$DEBUG('assign module \'%s\'', moduleName);

    _this._mesh.modules[moduleName].instance = errorIfNull(moduleBase);
    return eachCallback();

  },
  function(err){
      if (err){
        _this.log.error('Failed to initialize modules', err);
      }
      callback(err, _this);
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

Mesh.prototype._initializePackager = function(callback) {
  var packager = new Packager(this);
  packager.initialize(callback);
}


Mesh.prototype._instantiateComponents = function(config, callback){
  var _this = this;

  async.eachSeries(Object.keys(config.components), function(componentName, eachCallback) {

    var componentConfig = config.components[componentName];
    var componentInstance = new ComponentInstance({name: componentName, mesh: _this});
    


    Object.defineProperty(componentConfig, 'meshName', {
      get: function() {
        if (depWarned1) return config.name;
        _this.log.warn('use of $happn.config.meshName is deprecated, use $happn.info.mesh.name');
        try {
          _this.log.warn(' - at %s', _this.getCallerTo('mesh.js'));
        } catch (e) {}
        depWarned1 = true;
        return config.name;
      }
    });


    Object.defineProperty(componentConfig, 'setOptions', {
      get: function() {
        if (depWarned2) return config.datalayer.setOptions;
        _this.log.warn('use of $happn.config.setOptions is deprecated, use $happn.info.datalayer.options');
        try {
          _this.log.warn(' - at %s', _this.getCallerTo('mesh.js'));
        } catch (e) {}
        depWarned2 = true;
        return config.datalayer.setOptions;
      }
    });

    _this.log.$$TRACE('created component \'%s\'', componentName, componentConfig);

    _this._stats.component[componentName] = {errors:0, calls:0, emits:0};
    componentInstance.stats = _this._stats;  // TODO?: rather let the stats collector component
                                            //         have accessLevel: 'mesh' (config in component)
                                           //          and give each component it's own private stats store

    if (typeof componentConfig.moduleName == 'undefined') componentConfig.moduleName = componentName;

    // TODO: get rid of this secondary call to component, send the config in on construct ComponentInstance
    componentInstance.initialize(
      root,
      _this._mesh,
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
  var description = this.describe(false) ;
  var _this = this;

  _this.log.$$TRACE('_registerSchema( description with name: %s', description.name, description);

  this.data.set('/mesh/schema/description', description, function(e, response){

    if (e) return callback(e);
    _this.data.set('/mesh/schema/config', config, function(e, response){
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

      _this.log.$$DEBUG('initialize endpoint \'%s\'', endpointName);
      
      var endpointConfig = config.endpoints[endpointName];
      endpointConfig.config = endpointConfig.config || {};
      endpointConfig.config.secret = endpointConfig.config.secret || 'mesh';
      endpointConfig.config.authTokenSecret = endpointConfig.config.authTokenSecret || 'mesh';

      _this.log.$$TRACE('Happn.client.create( ', endpointConfig);

      endpointConfig.info = endpointConfig.info || {};
      endpointConfig.info.happner = {
        mesh: {
          name: _this._mesh.config.name
        }
      }

      Happn.client.create(endpointConfig, function(error, client){

        var description;

        if (error) {
          _this.log.error('failed connection to endpoint \'%s\'', endpointName, error);
          return done(error);
        }

        client.get('/mesh/schema/description', {}, function(error, response) {

          if (error) {
            _this.log.error('failed getting description from \'%s\'', endpointName, error);
            return done(error);
          }

          try {

            description = response;
            if (endpointName !== description.nae) {
              _this.log.warn('endpoint \'%s\' returned description for \'%s\'', endpointName, description.name);
            }

            _this.log.$$TRACE('got description from endpoint \'%s\'', endpointName, description);

            _this._mesh.endpoints[endpointName] = {
              "data":client,
              "description":response,
              "name":endpointName
            }
            _this.log.$$DEBUG('assigned endpoint \'%s\'', endpointName);
          } catch (error) {
            _this.log.warn('Malformed describe from mesh \'%s\' ignored.', endpointName, error);
          }

          API._createEndpoint(_this, endpointName, exchangeAPI, eventAPI, function(error) {
            if (error) return done(error);
            _this.log.info('initialized endpoint \'%s\'', endpointName);
            done();
          });
        });
      });
    }
  }), function(e) {
    callback(e, _this);
  });
}

   /*    // Lets only register for changes to remote descriptions when we're ready to use those changes.
    *    // - Avoid writing future^code.
    *    // - 9 times out of 10 it turns into confusion, not functionality.
    *
    *      //make sure if the description changes, we know it
    *      client.on('/mesh/schema/description', {}, function(eventData){
    *        // TODO: handle changed description (rebuild build exchange / event)
    *        _this._mesh.endpoints[endpointName].description = eventData.payload.data;
    *      }, function(error) {
    *
    *        if (error) {
    *          _this.log.warn('Unable to subscribe to remote endpoint \''+endpointName+'\' description.', error);
    *        }
    *
    *        try {
    *          _this._mesh.endpoints[endpointName] = {
    *            "data":client,
    *            "description":response.payload[0].data,
    *            "name":endpointName
    *          }
    *          _this.log.$$DEBUG('assigned endpoint \'' + endpointName + '\'');
    *
    *        } catch (error) {
    *          _this.log.warn('Malformed describe from mesh \''+endpointName+'\' ignored.', error);
    *        }
    *
    *        // var registerPath = '/mesh/system/endpoints/' + _this._mesh.config.name
    *        // client.set(registerPath, {}, {}, function(e, result) {
    *        //   // not a requirement
    *        // });
    *
    *        API._createEndpoint(_this, endpointName, exchangeAPI, eventAPI, function(error) {
    *          if (error) return done(error);
    *          _this.log.info('initialized endpoint \''+endpointName+'\'');
    *          done();
    *        });
    *      });
    *    });
    *
    *
    */

Mesh.prototype._eachComponent = function(flow, operator, callback){
  var _this = this;
  async[flow](
    Object.keys(this._mesh.components).map(function(componentName) {
      return function(done) {
        var component = _this._mesh.components[componentName];
        operator(componentName, component, done);
      }
    }),
    function(e) {
      callback(e, _this);
    }
  )
}

Mesh.prototype._eachComponentDo = function(options, callback){

  if (!options.methodCategory && !options.methodName)
    return callback(new MeshError("methodName or methodCategory not included in options"));

  if (!options.flow) options.flow = 'series';

  var calls, _this = this;
  
  this._mesh.calls = this._mesh.calls || {};
  this._mesh.calls.starting = calls = {};

  this._eachComponent(options.flow, function(componentName, component, done){

    var call, config = component.config;

    if (options.methodCategory)
      options.methodName = config[options.methodCategory];

    if (!options.methodName) {
      return done(); // error?
    }

    call = componentName+'.'+options.methodName+'()';

    // default assume async with no args and callback as (error){} only
    if (!config.schema || !config.schema.methods || !config.schema.methods[options.methodName]) {

      calls[call] = Date.now();
      _this.log.$$DEBUG('calling %s \'%s\' as default async', options.methodCategory, call);
      return component.instance.operate(options.methodName, [], function(e, responseArgs) {
        delete calls[call];
        if (e) return done(e);
        _this.log.info('%s component \'%s\'', (options.log || ''), componentName);
        done.apply(_this, responseArgs);
      });
    }

    var methodConfig = config.schema.methods[options.methodName];
    var methodParameters = (
      methodConfig.parameters?methodConfig.parameters:[]
    ).map(function(p) {return p.value;})
    .filter(function(p) {
      // Assumes startMthod and stopMethod schema either defines values
      // or are optional. Filter out undefines. 
      // IMPORTANT because otherwise method receives (undefined, undefined, undefined, callback)
      return typeof p !== 'undefined';
    });


    if (methodConfig.type == "sync") {
      try{
        _this.log.$$DEBUG('calling %s \'%s\' as configured sync', options.methodCategory, call);
        component.instance.operate(options.methodName, methodParameters);
        _this.log.info('%s component \'%s\'', (options.log || ''), componentName);
        done();
      }catch(e){
        done(new Error(e));
      }
      return;
    }

    calls[call] = Date.now();
    _this.log.$$DEBUG('calling %s \'%s\' as configured async', options.methodCategory, call);
    component.instance.operate(options.methodName, methodParameters, function(e, responseArgs){
      delete calls[call];
      if (e) return done(e);
      _this.log.info('%s component \'%s\'', (options.log || ''), componentName);
      done.apply(_this, responseArgs);
    });

  }, function(e) {
    callback(e, _this);
  });
}

Mesh.prototype.__startComponents = function(callback){
  this.log.$$DEBUG('start');
  this._eachComponentDo({
    methodCategory:'startMethod',
    flow: 'series',
    log: 'started'
  }, callback);
}

Mesh.prototype.__stopComponents = function(callback){
  this.log.$$DEBUG('stopping');
  this._eachComponentDo({
    methodCategory:'stopMethod',
    flow: 'parallel',
    log: 'stopped'
  }, callback);
}

Mesh.prototype.attachSystemComponents = function(config){
  
  if (!config.modules) config.modules = {};
  if (!config.components) config.components = {};

  config.modules.api = {
    path:"system:api"
  }

  config.modules.proxy = {
    path:"system:proxy"
  }

  config.modules.system = {
    path:"system:system"
  }

  config.components.api = {
    schema:{
      "exclusive":false
    },
    web:{
      routes:{
        "client":"handleRequest"
      }
    }
  };

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

  config.components.system = {
    accessLevel: 'mesh',
    startMethod: 'initialize',
    schema:{
      "exclusive":false
    }
  }
}

//if we are running this mesh in test mode, we iterate through the tests and run them, to return a test report
Mesh.prototype.test = function(callback){

}

