module.exports = function () {
  return new Proxy();
};

function Proxy() {
	var _this = this;

	_this.register = function($happn, config, callback){
		$happn.emit('proxy-registered', config, function(e, response){
			if (!e){
				console.log('proxy was registered ok', config, $happn);
			}
			callback(e);
        });
	}

};