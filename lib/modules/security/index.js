var async = require('async');
var shortId 
module.exports = function () {
  return new Security();
};

function Security() {
	var _this = this;

	Security.prototype.__adminUser = null;

	Security.prototype.__systemGroups = {};
	
	Security.prototype.__createUsersAndGroups = function($happn, callback){

		//TODO - add _MESH_ADMIN user and _MESH_GUEST and _MESH_ADMIN groups

		if (!$happn._mesh.config.datalayer.adminPassword)
			return callback(new Error('you need to configure an admin password for this mesh'));

		_this.securityService.upsertUser({username:'_MESH_ADM', password:$happn._mesh.config.datalayer.adminPassword}, function(e, adminUser){
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

				_this.securityService.upsertGroup(group, function(e, upsertedGroup){

					if (e)
						eachCallback(e);

					_this.__systemGroups[groupName] = upsertedGroup;

					if (groupName == '_MESH_ADM') 
						_this.securityService.linkGroup(upsertedGroup, adminUser, eachCallback); 
					else
						eachCallback();
					

				});

			}, callback);

		});

	}

	Security.prototype.initialize = function($happn, callback){

		try{
			//_mesh.datalayer.server
			//_this.securityService = $happn._mesh.data.securityService;

			if (!$happn._mesh.config.datalayer.secure) return callback();

			_this.securityService = $happn._mesh.datalayer.server.services.security;
			_this.__createUsersAndGroups($happn, callback);

		}catch(e){
			callback(e);
		}
	}

	/*
	This will return possible assignable system permissions by iterating through the mesh description
	*/
	Security.prototype.__cachedSystemPermissions = null;
	Security.prototype.getSystemPermissions = function($happn, params, callback) {

		try{

			if (!params) params = {};

			if (!this.__cachedSystemPermissions || params.nocache){

				var _this = this;
				var permissions = {events:{}, methods:{}, web:{}};

				/*
				var permissions = {

					//we have versioning every permission update
					_version:0,

					events: {
						'/meshname/componentname/eventname': {},
						'/happner-cloud/componentname/eventname': {}
					},

					// Methods: A list representing raw pathways to functionality on
					// the exchange and accessable by web.
					// - For assignment of users directly to functions.
					// - NB: TODO: Only paths to local components.

					methods: {
						'/happner-cloud/*':{
							description:'anything on this mesh'
						}
					},

					// Groups: Present list of pre configured mesh groups.
					// - Internally the mesh's components present a list of groups and
					//   their allowed paths, the mesh config should then map it's groups 
					//   to the component groups. 

					groups: {
						admin: {
							name: 'admin',
							description: 'Crane 9-1-9 Admin',
							network: '/harbour/quay9/berth1/crane9',
							groupType: 'builtin'
						},
						operator: {
							name: 'operator',
							description: 'Crane 9-1-9 Operator',
							network: '/harbour/quay9/berth1/crane9',
							groupType: 'configured',
						},
						technician: {
							name: 'technician',
							description: 'Crane 9-1-9 Technician',
							network: '/harbour/quay9/berth1/crane9',
							groupType: 'configured',
						}
					}
				};*/

				var meshName = $happn._mesh.config.name;

				for (var componentName in $happn.exchange[meshName]){
					permissions.methods['/' + meshName + '/' + componentName + '/*'] = {action:['*']};
					for (var methodName in $happn.exchange[meshName][componentName]) {
						permissions.methods['/' + meshName + '/' + componentName + '/' + methodName] = {action:['*']};
					}
				}

				for (var componentName in $happn.event[meshName]){
					permissions.events['/' + meshName + '/' + componentName + '/*'] = {action:['on']};
					for (var eventName in $happn.event[meshName][componentName]) {
						permissions.events['/' + meshName + '/' + componentName + '/' + eventName] = {action:['on']};
					}
				}

				for (var componentName in $happn._mesh.config.components) {
					permissions.web['/' + meshName + '/' + componentName + '/*'] = {action:['*']};
					if ($happn._mesh.config.components[componentName].web && $happn._mesh.config.components[componentName].web.routes)
					for (var webMethod in $happn._mesh.config.components[componentName].web.routes) {
						permissions.web['/' + meshName + '/' + componentName + '/' + webMethod] = {action:['*']};
					}
				}

				this.__cachedSystemPermissions = permissions;
			}
			
			callback(null, this.__cachedSystemPermissions);

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
		var _this = this;

		_this.securityService.upsertUser(user, {overwrite:false}, function(e, upsertedUser){

			if (e) return callback(e);

			_this.linkGroup($happn, _this.__systemGroups['_MESH_GST'], upsertedUser, function(e){

				if (e) return callback(e);

				callback(null, upsertedUser);

			});

		});
	};

	_this.updateUser = function($happn, user, callback){
		this.securityService.upsertUser(user, callback);
	};

	_this.linkGroup = function($happn, group, user, callback){
		this.securityService.linkGroup(group, user, {}, callback);
	};

	_this.listGroups = function($happn, groupName, callback){
		this.securityService.listGroups(groupName, {}, callback);
	};

	_this.listUsers = function($happn, userName, callback){
		this.securityService.listUsers(userName, {}, callback);
	};

	_this.getUser = function($happn, userName, callback){
		this.securityService.getUser(userName, {}, callback);
	}

	_this.getGroup = function($happn, groupName, callback){
		this.securityService.getGroup(groupName, {}, callback);
	}

};