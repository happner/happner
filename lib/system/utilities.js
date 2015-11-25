var EventEmitter = require('events').EventEmitter;
var shortId = require('shortid');
var util = require('util');
var fs = require('fs');
var path = require('path');
var levels = ['trace','debug','info','warn','error','fatal'];

var guard = {
  trace: 'isTraceEnabled',
  debug: 'isDebugEnabled',
  info: 'isInfoEnabled',
  warn: 'isWarnEnabled',
  error: 'isErrorEnabled',
  fatal: 'isFatalEnabled',
};

var path = require('path');
var Promise = require('bluebird');
var glob = Promise.promisify(require("glob"));

module.exports = function (config) {
  return new Util(config);
}

module.exports.getFunctionParameters = function(fn){
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
};

function Util(config) {

  var emitter = new EventEmitter();
  var _this = this;
  _this.node = util;

  var log4js = require('log4js');
  var logLayout, fileAppender;

  config = config || {};

  if (!config.logger) {

    if (config.logDateFormat && !config.logLayout) {
      // assemble default layout with date format
      config.logLayout = {
        type: 'pattern',
        pattern: '%d{'+config.logDateFormat+'} [%5.5p] - %m'
      };
    } 

    if (process.stdout.isTTY) {
      // to console, no date in log
      logLayout = logLayout || config.logLayout || {
        type: 'pattern',
        pattern: '[%[%5.5p%]] - %m'
      };
    }
    
    else {
      // piped to file, display date, no colour
      config.logDateFormat = config.logDateFormat || 'yyyy-MM-dd hh:mm:ss';
      logLayout = logLayout || config.logLayout || {
        type: 'pattern',
        pattern: '%d{'+config.logDateFormat+'} [%5.5p] - %m'
      };
    }

    config.logger = config.logger || {
      appenders: [{
        type: "console",
        layout: typeof logLayout == 'object' ? logLayout : {
          type: 'pattern',
          pattern: logLayout
        }
      }]
    };

    if (config.logFile) {
      config.logger.appenders.push(fileAppender = {
        "type": "file",
        "absolute": true,
        "filename": config.logFile,
        "maxLogSize": 20480,
        "backups": 10,
      });
      if (config.logLayout) {
        fileAppender.layout = typeof logLayout == 'object' ? logLayout : {
          type: 'pattern',
          pattern: config.logLayout
        };
      }
    }
  }

  config.logCache = 50;
  config.logLevel = process.env.LOG_LEVEL || config.logLevel || 'info';
  config.logTimeDelta = (typeof config.logTimeDelta == 'boolean') ? config.logTimeDelta : true;
  config.logStackTraces = (typeof config.logStackTraces == 'boolean') ? config.logStackTraces : true;
  config.logComponents = process.env.LOG_COMPONENTS ? process.env.LOG_COMPONENTS.split(',') : config.logComponents || [];
  config.logMessageDelimiter = config.logMessageDelimiter || '\t';

  // if (['all', 'trace', 'debug'].indexOf(config.logLevel) > -1) {
  //   config.logTimeDelta = true;
  // }

  if (config.logger.appenders) {
    log4js.configure(config.logger);
    _this.logger = log4js.getLogger();
    _this.logger.setLevel(config.logLevel);
  }

  _this.logCache = [];
  _this.log = function(message, level, component, data, context){

    if (!_this.logger) return;
    if (config.logComponents.length > 0 &&
        config.logComponents.indexOf(component) < 0) return;

    var now, delim;

    try {

      level = level || 'info';

      if (_this.logger[guard[level]]()) {

        message = message || '';
        component = component || '';

        var originalMessage = message.toString();
        var originalComponent = component.toString();

        delim = config.logMessageDelimiter;

        emitter.emit('before');

        if (config.logTimeDelta) {
          message = ((now = Date.now()) - (_this.previous || now)) + 'ms' + delim + context + ' (' + component + ') ' + message;
          _this.previous = now;
        }
        else {
          message = context + ' (' + component + ') ' + message;
        }

        _this.logger[level](message);

        if (data) {
          if (data.name && data.name == 'MeshError') {
            if (data.data.stack && config.logStackTraces) {
              _this.logger[level](data.data.stack);
              return;
            }
          }
          if (data.stack && config.logStackTraces) {
            _this.logger[level](data.stack);
            return;
          }
          _this.logger[level](data);
        }

        while (_this.logCache.length > config.logCache)
          _this.logCache.pop();

        _this.logCache.unshift({timestamp:new Date(), "message":originalMessage, "component":originalComponent, "level":level});
        
        // used by the console to rewrite the prompt after a log message
        emitter.emit('after');

      }
    } catch(e) {
      console.warn('logger failed! But here is the message anyways:');
      console.warn(message);
      console.warn(level);
      console.warn(e);
    }
  }

  _this.log.on = function(event, fn) {
    emitter.on(event, fn);
  }

  _this.createContext = function(context) {
    var createLogger;  
    return {
      createLogger: createLogger = function(component, obj) {

        obj = obj || function Debug(message, data) {
          obj.$$DEBUG(message, data);
        };

        levels.forEach(function (level) {
          var on = guard[level];
          if (level == 'trace') {
            obj.$$TRACE = function(message, data) {
              if (!_this.logger) return;
              if (!_this.logger[on]()) return;
              if (config.logComponents.length > 0) { // can optimize with hash
                if (config.logComponents.indexOf(component.split('/')[0]) < 0) return;
              }
              var args = Array.prototype.slice.call(arguments);              
              if (args[args.length - 1] instanceof Error) {
                data = args.pop();
              } else {
                data = null;
              }
              message = util.format.apply(util, args);
              _this.log(message, level, component, data, context);
            }
            Object.defineProperty(obj.$$TRACE, '$happner', {value: {ignore: true}});
          }
          else if (level == 'debug') {
            obj.$$DEBUG = function(message, data) {
              if (!_this.logger) return;
              if (!_this.logger[on]()) return;
              if (config.logComponents.length > 0) {
                if (config.logComponents.indexOf(component.split('/')[0]) < 0) return;
              }
              var args = Array.prototype.slice.call(arguments);              
              if (args[args.length - 1] instanceof Error) {
                data = args.pop();
              } else {
                data = null;
              }
              message = util.format.apply(util, args);
              _this.log(message, level, component, data, context);
            }
            Object.defineProperty(obj.$$DEBUG, '$happner', {value: {ignore: true}});
          }
          else {
            obj[level] = function(message, data) {
              if (!_this.logger) return;
              if (!_this.logger[on]()) return;
              var args = Array.prototype.slice.call(arguments);              
              if (args[args.length - 1] instanceof Error) {
                data = args.pop();
              } else {
                data = null;
              }
              message = util.format.apply(util, args);
              _this.log(message, level, component, data, context);
            }
            Object.defineProperty(obj[level], '$happner', {value: {ignore: true}});
          }
        });
        obj.createLogger = createLogger;
        return obj;
      }
    }
  }

  _this.generateID = function(){
    return shortId.generate();
  }

  _this.getFunctionParameters = module.exports.getFunctionParameters;

  _this.findInModules = function(filename, modulePaths, callback) {
    if (typeof modulePaths == 'function') {
      callback = modulePaths;
      modulePaths = module.paths;
    }

    var results = [];

    var readdir = Promise.promisify(fs.readdir);
    var lstat = Promise.promisify(fs.lstat);
    var readFile = Promise.promisify(fs.readFile);

    var recurse = function(paths, callback) {

      Promise.all(paths.map(function(modulePath) {

        var isBaseModule = modulePaths.indexOf(modulePath) >= 0;

        return new Promise(function(resolve, reject) {

          readdir(modulePath).then(function(modulesDirs) {

            return Promise.all(modulesDirs.map(function(moduleName) {

              if (moduleName == '.bin') return;

              var targetFile = modulePath + path.sep + moduleName + path.sep + filename;
              var packageFile = modulePath + path.sep + moduleName + path.sep + 'package.json';

              return new Promise(function(resolve, reject) {

                var result = {};

                lstat(targetFile)

                .then(function() {

                  // console.log('GOT', target);

                  result.moduleName = moduleName;
                  result.filename = targetFile;
                  result.base = modulePaths.indexOf(modulePath) >= 0;
                  result.modulePath = modulePath;

                  results.push(result);

                  return readFile(packageFile);
                })

                .then(function(packageJson) {

                  var version = JSON.parse(packageJson).version;

                  result.version = version;

                  // Recurse into target's node_modules for more

                  recurse([modulePath + path.sep + moduleName + path.sep + 'node_modules'], resolve);

                })

                .catch(resolve); // ignore not got target

              });

            }));

          }).then(resolve).catch(resolve); // ignore readdir error - can't readdir, 
                                          // so can't load modules from there...
        });

      }))

      .then(function(result) {
        callback();
      })

      .catch(callback);
    }

    recurse(modulePaths, function(e) {

      // Sort from longest to shortest
      // Shallowest will win in iteration overwrites

      results = results.sort(function(a, b) {
        if (a.filename.length < b.filename.length) return  1;
        if (a.filename.length > b.filename.length) return -1;
        return 0;
      });

      callback(null, results);
    })

  }

  _this.findFiles = function(patterns, opts, callback){

    Promise.all(patterns.map(function(pattern){
      return glob(pattern, opts)
    })).then(function(matches){

      var result = matches[0];

      for (var i = 1; i < matches.length; i++){
        result = result.concat(matches[i]);
      }

      callback(null, result);

    }).catch(callback);

  }
}