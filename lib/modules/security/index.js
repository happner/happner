var async = require('async');
var shortId 
module.exports = function () {
  return new Security();
};

function Security() {
	
	Security.prototype.__initialized = false;

	Security.prototype.__adminUser = null;

	Security.prototype.__systemGroups = {};
	
	Security.prototype.__createUsersAndGroups = function($happn, callback){

		//TODO - add _MESH_ADMIN user and _MESH_GUEST and _MESH_ADMIN groups
		var _this = this;

		if (!$happn._mesh.config.datalayer.adminPassword)
			return callback(new Error('you need to configure an admin password for this mesh'));

		_this.__securityService.upsertUser({username:'_MESH_ADM', password:$happn._mesh.config.datalayer.adminPassword}, function(e, adminUser){
			if (e) return callback(e);

			_this.__adminUser = adminUser;

			async.eachSeries(['_MESH_ADM', '_MESH_GST'], function(groupName, eachCallback){

				var group = {name:groupName};

				if (groupName == '_MESH_ADM') 
					group.permissions = {
						'/mesh/*':{actions:['*']},
						'/_exchange/*':{actions:['*']},
						'/_events/*':{actions:['*']}
					};

				if (groupName == '_MESH_GST') 
					group.permissions = {
						'/mesh/schema/*':{actions:['get','on']},
						'/_exchange/responses/*':{actions:['on']}
					};

				_this.__securityService.upsertGroup(group, function(e, upsertedGroup){

					if (e)
						eachCallback(e);

					_this.__systemGroups[groupName] = upsertedGroup;

					if (groupName == '_MESH_ADM') 
						_this.__securityService.linkGroup(upsertedGroup, adminUser, eachCallback); 
					else
						eachCallback();
					

				});

			}, function(e){
				if (e) return callback(e);

				_this.__initialized = true;
				callback();

			});

		});

	}

	Security.prototype.initialize = function($happn, callback){

		try{
			//_mesh.datalayer.server
			//_this.__securityService = $happn._mesh.data.__securityService;
			var _this = this;

			if (!$happn._mesh.config.datalayer.secure){
				$happn.log.warn('data layer is not set to secure in config');
			 	return callback();
			}

			_this.__securityService = $happn._mesh.datalayer.server.services.security;
			_this.__createUsersAndGroups($happn, callback);

		}catch(e){
			callback(e);
		}
	}

	Security.prototype.__synchronizeEndpointGroups = function(){

	}

	Security.prototype.__synchronizeChildGroups = function(){

	}

	Security.prototype.__validateRequest = function(methodName, callArguments, callback){

		if (!this.__initialized)
			return callback(new Error('security module not initialized, is your datalayer configured to be secure?'));
		

		callback();
	}

	/*
	This will return possible assignable system permissions by iterating through the mesh description
	*/
	Security.prototype.__cachedSystemPermissions = null;
	Security.prototype.getSystemPermissions = function($happn, params, callback) {

		try{

			this.__validateRequest('getSystemPermissions', arguments, function(e){

				if (e) return callback(e);

				if (!params) params = {};

				if (!this.__cachedSystemPermissions || params.nocache){

					var _this = this;
					var permissions = {events:{}, methods:{}, web:{}};

					var meshName = $happn._mesh.config.name;

					for (var componentName in $happn.exchange[meshName]){
						permissions.methods['/' + meshName + '/' + componentName + '/*'] = {actions:['*'], description:"system permission"};
						for (var methodName in $happn.exchange[meshName][componentName]) {
							permissions.methods['/' + meshName + '/' + componentName + '/' + methodName] = {actions:['*'], description:"system permission"};
						}
					}

					for (var componentName in $happn.event[meshName]){
						permissions.events['/' + meshName + '/' + componentName + '/*'] = {actions:['on']};
						for (var eventName in $happn.event[meshName][componentName]) {
							permissions.events['/' + meshName + '/' + componentName + '/' + eventName] = {actions:['on'], description:"system permission"};
						}
					}

					for (var componentName in $happn._mesh.config.components) {
						permissions.web['/' + meshName + '/' + componentName + '/*'] = {actions:['*']};
						if ($happn._mesh.config.components[componentName].web && $happn._mesh.config.components[componentName].web.routes)
						for (var webMethod in $happn._mesh.config.components[componentName].web.routes) {
							permissions.web['/' + meshName + '/' + componentName + '/' + webMethod] = {actions:['*'], description:"system permission"};
						}
					}

					this.__cachedSystemPermissions = permissions;
				}
				
				callback(null, this.__cachedSystemPermissions);

			});

		}catch(e){
			callback(e);
		}

	}

	Security.prototype.__getPermissionPath = function($happn, rawPath, prefix){
		var meshName = $happn._mesh.config.name;

		if (rawPath.substring(0,1) != '/')
			rawPath = '/' + rawPath;

		if (rawPath.indexOf('/' + meshName) == -1)
			rawPath = rawPath.replace('/', '/' + meshName);

		return '/' + prefix + rawPath;
	}

	Security.prototype.__transformMeshGroup = function($happn, group){
		var transformed = group;

		transformed.permissions = this.__transformMeshPermissions($happn, group.permissions);

		return transformed;
	}

	Security.prototype.__transformHappnGroup = function($happn, group){

		var transformed = group;

		transformed.permissions = this.__transformHappnPermissions($happn, group.permissions);

		return transformed;
	}

	/*
	turns the mesh groups permissions to happn permissions, uses 
	the mesh description to verify
	*/
	Security.prototype.__transformMeshPermissions = function($happn, meshGroupPermissions){

		var permissions = {};

		for (var permissionPath in meshGroupPermissions.events)
			permissions[this.__getPermissionPath($happn, permissionPath, '_events')] = {actions:meshGroupPermissions.events[permissionPath].actions};

		for (var permissionPath in meshGroupPermissions.methods)
			permissions[this.__getPermissionPath($happn, permissionPath, '_exchange/requests')] = {actions:meshGroupPermissions.methods[permissionPath].actions};

		for (var permissionPath in meshGroupPermissions.web)
			permissions[this.__getPermissionPath($happn, permissionPath, '_web')] = {actions:meshGroupPermissions.web[permissionPath].actions};

		
		return permissions;
	}

	/*
	turns the mesh groups permissions to happn permissions, uses 
	the mesh description to verify
	*/
	Security.prototype.__transformHappnPermissions = function($happn, happnGroupPermissions){

		var permissions = {
			methods:{},
			events:{},
			web:{}
		}

		for (var happnPermissionPath in happnGroupPermissions){
			if (happnPermissionPath.indexOf('/_events/') == 0)
				permissions.events[happnPermissionPath.replace('/_events/','')] = happnGroupPermissions[happnPermissionPath];
			
			if (happnPermissionPath.indexOf('/_exchange/') == 0)
				permissions.methods[happnPermissionPath.replace('/_exchange/','')] = happnGroupPermissions[happnPermissionPath];

			if (happnPermissionPath.indexOf('/_web/') == 0)
				permissions.web[happnPermissionPath.replace('/_web/','')] = happnGroupPermissions[happnPermissionPath];
		}

		return permissions;
	}

	Security.prototype.addGroup = function($happn, group, callback){

		var _this = this;

		_this.__validateRequest('addGroup', arguments, function(e){
			if (e) return callback(e);

			_this.__securityService.upsertGroup(_this.__transformMeshGroup($happn, group), {overwrite:false}, function(e, addedGroup){

				if (e) return callback(e);

				return callback(null, _this.__transformHappnGroup($happn, addedGroup));

			});
		});

	};

	Security.prototype.updateGroup = function($happn, group, callback){

		var _this = this;

		_this.__validateRequest('updateGroup', arguments, function(e){
			if (e) return callback(e);

			_this.__securityService.upsertGroup(_this.__transformMeshGroup($happn, group), function(e, updatedGroup){

				if (e) return callback(e);

				return callback(null, _this.__transformHappnGroup($happn, updatedGroup));

			});
		});

	};

	Security.prototype.addUser = function($happn, user, callback){
		var _this = this;

		_this.__validateRequest('addUser', arguments, function(e){
			if (e) return callback(e);
			_this.__securityService.upsertUser(user, {overwrite:false}, function(e, upsertedUser){

				if (e) return callback(e);

				_this.linkGroup($happn, _this.__systemGroups['_MESH_GST'], upsertedUser, function(e){

					if (e) return callback(e);

					callback(null, upsertedUser);

				});

			});

		});
	};

	Security.prototype.updateUser = function($happn, user, callback){

		this.__validateRequest('updateUser', arguments, function(e){

			if (e) return callback(e);
			this.__securityService.upsertUser(user, callback);

		}.bind(this));
	};

	Security.prototype.linkGroup = function($happn, group, user, callback){

		this.__validateRequest('linkGroup', arguments, function(e){

			if (e) return callback(e);
			this.__securityService.linkGroup(group, user, {}, callback);

		}.bind(this));

	};

	Security.prototype.listGroups = function($happn, groupName, callback){

		this.__validateRequest('listGroups', arguments, function(e){

			if (e) return callback(e);
			this.__securityService.listGroups(groupName, {}, callback);

		}.bind(this));
	};

	Security.prototype.listUsers = function($happn, userName, callback){
		this.__validateRequest('listUsers', arguments, function(e){

			if (e) return callback(e);
			this.__securityService.listUsers(userName, {}, callback);

		}.bind(this));
	};

	Security.prototype.getUser = function($happn, userName, callback){
		this.__validateRequest('getUser', arguments, function(e){

			if (e) return callback(e);
			this.__securityService.getUser(userName, {}, callback);

		}.bind(this));
	}

	Security.prototype.getGroup = function($happn, groupName, callback){

		var _this = this;

		_this.__validateRequest('getGroup', arguments, function(e){
			if (e) return callback(e);

			_this.__securityService.getGroup(groupName, {}, function(e, group){

				if (e) return callback(e);
				if (group)
					return callback(null, _this.__transformHappnGroup($happn, group))

			}.bind(this));
		});
	}

	Security.prototype.deleteGroup = function(group, callback){
		this.__validateRequest('deleteGroup', arguments, function(e){

			if (e) return callback(e);
			this.__securityService.deleteGroup(group, {}, callback);

		}.bind(this));
	}

	Security.prototype.deleteUser = function(user, callback) {
		this.__validateRequest('deleteUser', arguments, function(e){

			if (e) return callback(e);
			this.__securityService.deleteUser(user, {}, callback);

		}.bind(this));
	}

};