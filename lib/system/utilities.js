global.$debug = global.$debug || require('debug')('happngin');
$debug('required lib/system/utilities.js');

// var moment = require('moment');
var shortId = require('shortid');
var levels = ['trace','debug','info','warn','error','fatal'];

module.exports = function (config) {
  return new Util(config);
}

function Util(config) {
  var _this = this;
  _this.node = require('util');
  _this.components = {};

  var log4js = require('log4js');
  var logLayout, fileAppender;

  config = config || {};

  if (!config.logger) {

    if (config.logDateFormat && !config.logLayout) {
      // assemble default layout with date format
      config.logLayout = {
        type: 'pattern',
        pattern: '%d{'+config.logDateFormat+'} [%4.5p] - %m'
      };
    } 

    if (process.stdout.isTTY) {
      // to console, no date in log
      logLayout = logLayout || config.logLayout || {
        type: 'pattern',
        pattern: '[%[%4.5p%]] - %m'
      };
    }
    
    else {
      // piped to file, display date, no colour
      config.logDateFormat = config.logDateFormat || 'yyyy-MM-dd hh:mm:ss';
      logLayout = logLayout || config.logLayout || {
        type: 'pattern',
        pattern: '%d{'+config.logDateFormat+'} [%4.5p] - %m'
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
  config.logLevel = config.logLevel || levels;
  config.logStackTraces = config.logStackTraces; // breaking news

  if (!config.log_component)
    config.log_component = [];

  if (config.logger.appenders) {
    log4js.configure(config.logger);
    _this.logger = log4js.getLogger();
  }

  _this.config = config;

  _this.log = function(message, level, component, data){

    if (!_this.logger) return;

    try {
      if (!level)
        level = 'info';

      if (!message)
        throw 'Blank message';

      if (_this.config.logLevel.indexOf(level) > -1 || _this.config.log_component.indexOf(component) > -1) {

         message = '('+ (component ? component : '') +') ' + message;

        _this.logger[level](message);

        if (data)
          _this.logger[level](data);

        if (data && data.stack && _this.config.logStackTraces)
          _this.logger[level](data.stack);
      }
    } catch(e) {
      console.log('logger failed! But here is the message anyways:');
      console.log(message);
      console.log(level);
      console.log(e);
    }
  }

  _this.createLogger = function(component, obj) {
    obj = obj || {};
    levels.forEach(function (level) {
      obj[level] = function(message, data) {
        _this.log(message, level, component, data);
      }
    });
    return obj;
  }

  _this.generateID = function(){
    return shortId.generate();
  }

  _this.getFunctionParameters = function(fn){
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
}