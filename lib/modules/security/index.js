module.exports = function () {
  return new Security();
};

function Security() {
	var _this = this;

	_this.initialize = function($happn, callback){

		try{
			
			_this.securityService = $happn._mesh.data.securityService;
			callback();
			
		}catch(e){
			callback(e);
		}
	}
};