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

	_this.addGroup = function($happn, group, callback){
		this.securityService.upsertGroup(_transformMeshPermissions($happn, group), {overwrite:false}, callback);
	};

	_this.updateGroup = function($happn, group, callback){
		this.securityService.upsertGroup(_transformMeshPermissions($happn, group), callback);
	};

	_this.addUser = function($happn, user, callback){
		this.securityService.upsertUser(user, {overwrite:false}, callback);
	};

	_this.updateUser = function($happn, user, callback){
		this.securityService.upsertUser(user, callback);
	};

	_this.linkGroup = function($happn, group, user, callback){
		this.securityService.linkGroup(group, user, {}, callback);
	};
};