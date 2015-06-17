module.exports = function (config) {
  return new Util(config);
}

function Util(config) {
	var _this = this;
	_this.node = require('util');

	var log4js = require('log4js');
		
	if (!config){
		config = {
					logger:{
						"appenders": [
						      { "type": "console"},
				              {
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
		

	_this.config = config;

	if (!_this.config.log_component)
		_this.config.log_component = [];

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
		    argDecl[1].split(FN_ARG_SPLIT).map(function(arg){
		        arg.replace(FN_ARG, function(all, underscore, name){
		          args.push(name);
		        });
		    });

		    return args;
		}else
			return null;

	};

	_this.log = function(message, level, component, data){

		try{

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

		}catch(e){
			console.log('logger failed! But here is the message anyways:');
			console.log(message);
			console.log(level);
			console.log(e);
		}
	
	}

	var shortId = require('shortid')

	_this.generateID = function(){
		return shortId.generate();
	}
}