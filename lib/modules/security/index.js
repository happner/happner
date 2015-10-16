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

	/*
	turns the mesh groups permissions to happn permissions, uses 
	the mesh description to verify
	*/
	var _transformMeshPermissions = function($happn, meshGroup){
		var permissions = {};

		meshGroup.permissions = permissions;
		return meshGroup;
	}

	/*
	turns the mesh groups permissions to happn permissions, uses 
	the mesh description to verify
	*/
	var _transformHappnPermissions = function($happn, happnGroup){

		var permissions = {
			methods:[],
			events:[]
		}

		happnGroup.permissions = permissions;
		return happnGroup;
	}

	_this.upsertGroup = function($happn, group, options, callback){

		var _this = this;

		_this.securityService.upsertGroup(_transformMeshPermissions(group), options, callback);

	};

	_this.upsertUser = function($happn, user, options, callback){
		
		var _this = this;

		_this.securityService.upsertUser(group, options, callback);
	};

	_this.linkGroup = function($happn, group, user, options, callback){
		
		var _this = this;

		_this.securityService.linkGroup(group, user, options, callback);

	};
};