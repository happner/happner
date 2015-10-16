module.exports = function () {
  return new Security();
};

function Security() {
	var _this = this;

	_this.initialize = function($happn, callback){

		try{
			
			var securityService = $happn._mesh.data.securityService;

			Object.keys(securityService, function(key){
				var securityProperty = securityService[key];
				if (typeof securityProperty == 'function'){
					_this[key] = function(){
						securityProperty.apply(securityService, arguments)
					}
				}
			});

			callback();
			
		}catch(e){
			callback(e);
		}
	}
};