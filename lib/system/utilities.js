$debug('required lib/system/utilities.js');

var moment = require('moment');
var shortId = require('shortid');

module.exports = function (config) {
  return new Util(config);
}

function Util(config) {
  var _this = this;
  _this.node = require('util');

  var log4js = require('log4js');
  var pattern

  config = config || {};

  config.dateFormat = config.dateFormat || 'yyyy-MM-dd hh:mm:ss';

  if (process.stdout.isTTY) {
    // to console, no date in log
    pattern = "[%[%4.5p%]] - %m"
  } 
  else {
    // piped to file, display date, no colour
    pattern = "%d{"+config.dateFormat+"} [%4.5p] - %m"
  }

  config.logger = config.logger || {
    appenders: [
      {
        type: "console",
        layout: {
          type: 'pattern',
          pattern: pattern
        }
      },{
        "type": "file",
        "absolute": true,
        "filename": __dirname + "/activity.log",
        "maxLogSize": 20480,
        "backups": 10
      }
    ]
  };
  config.log_level = config.log_level || ['trace','debug','info','warn','error','fatal'];
  config.logStackTraces = config.logStackTraces; // breaking news


  if (!config){
    config = {
      logger: {
        appenders: [
          {
            type: "console",
            layout: {
              type: 'pattern',
              pattern: "[%r] [%[%4.5p%]] - %m"
            }
          },{
            "type": "file", 
            "absolute": true,
            "filename": __dirname + "/activity.log",
            "maxLogSize": 20480,
            "backups": 10
          }
        ]
      },
      log_level:['trace','debug','info','warn','error','fatal'],
      logStackTraces:true
    };
  }

  if (!config.log_component)
    config.log_component = [];

  _this.config = config;

  log4js.configure(_this.config.logger);
  _this.logger = log4js.getLogger();

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

  _this.log = function(message, level, component, data){

    try {
      if (!level)
        level = 'info';

      if (!message)
        throw 'Blank message';

      if (_this.config.log_level.indexOf(level) > -1 || _this.config.log_component.indexOf(component) > -1) {
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

  _this.generateID = function(){
    return shortId.generate();
  }
}