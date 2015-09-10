module.exports = SubMethodModule;

function SubMethodModule() {}

SubMethodModule.prototype.methodParent = function() {
	this.method1 = function($happn, params, callback){
						if (!$happn)
							return callback(new Error('$happn was null'));

						callback(null, params);
					}
	this.method2 = function($happn, params, callback){
						if (!$happn)
							return callback(new Error('$happn was null'));

						callback(null, params);
					}
}
