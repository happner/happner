var async = require('async');

module.exports = Security;

function Security() {
	
	this.__initialized = false;

	this.__adminUser = null;

	this.__systemGroups = {};
	
	Security.prototype.__createUsersAndGroups = function($happn, callback){

		var _this = this;

		var createSystemGroups = function(adminUser, done){

			async.eachSeries(['_MESH_ADM', '_MESH_GST'], function(groupName, eachCallback){

				var group = {name:groupName};

				if (groupName == '_MESH_ADM') 
					group.permissions = {
						'/mesh/*':{actions:['*'], description:"mesh system permission"},
						'/_exchange/*':{actions:['*'], description:"mesh system permission"},
						'/_events/*':{actions:['*'], description:"mesh system permission"}
					};

				if (groupName == '_MESH_GST') 
					group.permissions = {
						'/mesh/schema/*':{actions:['get','on'], description:"mesh system guest permission"},
						//'/_exchange/responses/*':{actions:['on'], description:"mesh system quest permission"}
					};

				_this.__securityService.upsertGroup(group, {}, function(e, upsertedGroup){

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
				done();

			});

		}

		_this.__securityService.getUser('_ADMIN', {}, function(e, userFound){

			if (e) return callback(e);

			if (!userFound)
				return callback(new Error('admin user not found, happn may have been incorrectly configured'));
			else {

				_this.__adminUser = userFound;
				createSystemGroups(_this.__adminUser, callback);

			}

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

	Security.prototype.getComponentId = function(){
		return this.__componentId;
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
	this.__cachedSystemPermissions = null;
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
						permissions.methods['/' + meshName + '/' + componentName + '/*'] = {authorized:true, description:"system permission"};
						for (var methodName in $happn.exchange[meshName][componentName]) {
							permissions.methods['/' + meshName + '/' + componentName + '/' + methodName] = {authorized:true, description:"system permission"};
						}
					}

					for (var componentName in $happn.event[meshName]){
						permissions.events['/' + meshName + '/' + componentName + '/*'] = {authorized:true, description:"system permission"};
						for (var eventName in $happn.event[meshName][componentName]) {
							permissions.events['/' + meshName + '/' + componentName + '/' + eventName] = {authorized:true, description:"system permission"};
						}
					}

					for (var componentName in $happn._mesh.config.components) {
						permissions.web['/' + meshName + '/' + componentName + '/*'] = {authorized:true, description:"system permission"};
						if ($happn._mesh.config.components[componentName].web && $happn._mesh.config.components[componentName].web.routes)
						for (var webMethod in $happn._mesh.config.components[componentName].web.routes) {
							permissions.web['/' + meshName + '/' + componentName + '/' + webMethod] = {authorized:true, description:"system permission"};
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

	Security.prototype.__getPermissionPath = function($happn, rawPath, prefix, wildcard){
		var meshName = $happn._mesh.config.name;

		//we add a wildcard to the end of the path 
		if (wildcard)
			rawPath = rawPath.replace(/[\/*]+$/, "") + '/*';
		
		if (rawPath.substring(0,1) != '/')
			rawPath = '/' + rawPath;

		if (rawPath.indexOf('/' + meshName) == -1)
			rawPath = rawPath.replace('/', '/' + meshName);

		return '/' + prefix + rawPath;
	}

	Security.prototype.__transformMeshGroup = function($happn, group){

		if (!group) return group;

		var transformed = JSON.parse(JSON.stringify(group));

		transformed.permissions = this.__transformMeshPermissions($happn, group.permissions);

		return transformed;

		

		/*
		var transformed = group;

		transformed.permissions = this.__transformMeshPermissions($happn, group.permissions);

		return transformed;
		*/
	}

	Security.prototype.__transformHappnGroups = function($happn, happnGroups){

		var transformed = [];
		var _this = this;

		happnGroups.forEach(function(happnGroup){
			transformed.push(_this.__transformHappnGroup($happn, happnGroup));
		});

		return transformed;
	}


	Security.prototype.__transformHappnGroup = function($happn, group){

		if (!group) return group;

		var transformed = group;

		transformed.permissions = this.__transformHappnPermissions($happn, group.permissions);

		return transformed;

		/*

		var transformed = JSON.parse(JSON.stringify(group));

		transformed.permissions = this.__transformHappnPermissions($happn, group.permissions);

		return transformed;

		*/
	}

	/*
	turns the mesh groups permissions to happn permissions, uses 
	the mesh description to verify
	*/
	Security.prototype.__transformMeshPermissions = function($happn, meshGroupPermissions){

		var permissions = {};

		for (var permissionPath in meshGroupPermissions.events){
			if (meshGroupPermissions.events[permissionPath].authorized)
				permissions[this.__getPermissionPath($happn, permissionPath, '_events')] = {actions:['on'], description:meshGroupPermissions.events[permissionPath].description};
		}
			
		for (var permissionPath in meshGroupPermissions.methods){
			if (meshGroupPermissions.methods[permissionPath].authorized){
				permissions[this.__getPermissionPath($happn, permissionPath, '_exchange/requests')] = {actions:['set'], description:meshGroupPermissions.methods[permissionPath].description};
				permissions[this.__getPermissionPath($happn, permissionPath, '_exchange/responses', true)] = {actions:['on','set'], description:meshGroupPermissions.methods[permissionPath].description};
			}
		}

		for (var permissionPath in meshGroupPermissions.web){
			if (meshGroupPermissions.web[permissionPath].authorized)
				permissions[this.__getPermissionPath($happn, permissionPath, '_web')] = {actions:['get'], description:meshGroupPermissions.web[permissionPath].description};
		}

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

			if (happnPermissionPath.indexOf('/_events/') == 0){
				var happnPermission = happnGroupPermissions[happnPermissionPath];
				if (happnPermission.actions.indexOf('on') > -1)
					permissions.events[happnPermissionPath.replace('/_events/','')] = {authorized:true, description:happnPermission.description};
			}
				
			if (happnPermissionPath.indexOf('/_exchange/') == 0){
				var happnPermission = happnGroupPermissions[happnPermissionPath];
				if (happnPermission.actions.indexOf('set') > -1)
					permissions.methods[happnPermissionPath.replace('/_exchange/','')] = {authorized:true, description:happnPermission.description};
			}
				

			if (happnPermissionPath.indexOf('/_web/') == 0){
				var happnPermission = happnGroupPermissions[happnPermissionPath];
				if (happnPermission.actions.indexOf('get') > -1)
					permissions.web[happnPermissionPath.replace('/_web/','')] = {authorized:true, description:happnPermission.description};
			}
				
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

		var _this = this;

		_this.__validateRequest('linkGroup', arguments, function(e){

			if (e) return callback(e);

			_this.__securityService.linkGroup(_this.__transformMeshGroup($happn, group), user, {}, callback);

		}.bind(this));

	};

	Security.prototype.listGroups = function($happn, groupName, callback){

		var _this = this;

		_this.__validateRequest('listGroups', arguments, function(e){

			if (e) return callback(e);
			_this.__securityService.listGroups(groupName, {}, function(e, happnGroups){
				if (e) return callback(e);

				callback(null, _this.__transformHappnGroups($happn, happnGroups))
			});

		});
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