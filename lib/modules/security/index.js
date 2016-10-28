var async = require('async');

module.exports = Security;

function Security() {

  this.__initialized = false;
  this.__adminUser = null;
  this.__systemGroups = {};
  this.__attachToSecurityChangesActivated = false;
  this.__attachToSecurityChangesActivated = false;
}

Security.prototype.__createUsersAndGroups = function ($happn, callback) {

  var _this = this;

  var createSystemGroups = function (adminUser, addedGroups) {

    async.eachSeries(['_MESH_ADM', '_MESH_GST'], function (groupName, eachCallback) {

      var group = {name: groupName};

      if (groupName == '_MESH_ADM')
        group.permissions = {
          '/mesh/*': {actions: ['*'], description: "mesh system permission"},
          '/_exchange/*': {actions: ['*'], description: "mesh system permission"},
          '/_events/*': {actions: ['*'], description: "mesh system permission"}
        };

      if (groupName == '_MESH_GST')
        group.permissions = {
          '/mesh/schema/*': {actions: ['get', 'on'], description: "mesh system guest permission"},
          '/_exchange/requests/*/security/updateOwnUser': {actions: ['*'], description: "mesh system permission"},
          '/_exchange/responses/*/security/updateOwnUser': {
            actions: ['*'],
            description: "mesh system quest permission"
          }
        };

      _this.__securityService.upsertGroup(group, {}, function (e, upsertedGroup) {

        if (e)
          eachCallback(e);

        _this.__systemGroups[groupName] = upsertedGroup;

        if (groupName == '_MESH_ADM')
          _this.__securityService.linkGroup(upsertedGroup, adminUser, eachCallback);
        else
          eachCallback();

      });

    }, function (e) {

      if (e) return callback(e);

      _this.__initialized = true;
      addedGroups();

    });

  };

  _this.__securityService.getUser('_ADMIN', {}, function (e, userFound) {

    if (e) return callback(e);

    if (!userFound) return callback(new Error('admin user not found, happn may have been incorrectly configured'));

    _this.__adminUser = userFound;
    createSystemGroups(_this.__adminUser, callback);

  });

};

Security.prototype.initialize = function ($happn, callback) {

  try {

    var _this = this;

    if (!$happn._mesh.config.datalayer.secure) {
      if (typeof $happn._mesh.config.datalayer.secure != 'boolean') {
        // no warning if explicitly set to false
        $happn.log.warn('data layer is not set to secure in config');
      }
      return callback();
    }

    _this.__securityService = $happn._mesh.datalayer.server.services.security;
    _this.__pubsubService = $happn._mesh.datalayer.server.services.pubsub;

    _this.__createUsersAndGroups($happn, callback);

  } catch (e) {
    callback(e);
  }
};

Security.prototype.attachToSecurityChanges = function ($happn, callback) {

  var _this = this;

  try {

    if (!_this.__attachToSecurityChangesActivated) {

      _this.__securityService.onDataChanged(function (whatHappnd, changedData) {
        $happn.emit(whatHappnd, changedData);
        return true;
      });
      _this.__attachToSecurityChangesActivated = true;
    }

    callback();

  } catch (e) {
    callback(e);
  }
};

Security.prototype.attachToSessionChanges = function ($happn, callback) {

  var _this = this;

  try {

    if (!_this.__attachToSessionChangesActivated) {

      _this.__pubsubService.on('authentic', function (data) {
        $happn.emit('connect', data);
      });

      _this.__pubsubService.on('disconnect', function (data) {
        $happn.emit('disconnect', data);
      });

      _this.__attachToSessionChangesActivated = true;
    }

    callback();

  } catch (e) {
    callback(e);
  }
};


Security.prototype.getComponentId = function () {
  return this.__componentId;
};

Security.prototype.__validateRequest = function (methodName, callArguments, callback) {

  var _this = this;

  if (!this.__initialized)
    return callback(new Error('security module not initialized, is your datalayer configured to be secure?'));

  if (methodName == 'updateOwnUser') {

    var sessionInfo = callArguments[1];
    var userUpdate = callArguments[2];

    var session = _this.__pubsubService.getSession(sessionInfo.id);

    if (userUpdate.password && !userUpdate.oldPassword)
      return callback(new Error('missing oldPassword parameter'));

    if (!session)
      return callback(new Error('matching session was not found for security update'));

    if (session.user.username != sessionInfo.username)
      return callback(new Error('session with the matching id is for a different user'));

    if (sessionInfo.username != userUpdate.username)//cool we are modifying our own user
      return callback(new Error('attempt to update someone else\'s user details'));

    if (userUpdate.password) {
      // we need to validate against the previous password
      return _this.__securityService.getPasswordHash(userUpdate.username, function (e, hash) {

        if (e) return callback(e);

        _this.__securityService.matchPassword(userUpdate.oldPassword, hash, function (e, match) {
          if (e) return callback(e);
          if (!match) return callback(new Error('old password incorrect'));

          callback();
        });
      });
    }
  }

  if (['linkGroupName','unlinkGroupName'].indexOf(methodName) >= 0)
    if (!callArguments[1]) return callback(new Error('missing user argument'));

  callback();
};

this.__cachedSystemPermissions = null;

//Return possible assignable system permissions by iterating through the mesh description

Security.prototype.getSystemPermissions = function ($happn, params, callback) {

  try {

    this.__validateRequest('getSystemPermissions', arguments, function (e) {

      if (e) return callback(e);

      if (!params) params = {};

      if (!this.__cachedSystemPermissions || params.nocache) {

        var _this = this;
        var permissions = {events: {}, methods: {}, web: {}};

        var meshName = $happn._mesh.config.name;

        for (var componentName in $happn.exchange[meshName]) {
          permissions.methods['/' + meshName + '/' + componentName + '/*'] = {
            authorized: true,
            description: "system permission"
          };
          for (var methodName in $happn.exchange[meshName][componentName]) {
            permissions.methods['/' + meshName + '/' + componentName + '/' + methodName] = {
              authorized: true,
              description: "system permission"
            };
          }
        }

        for (var componentName in $happn.event[meshName]) {
          permissions.events['/' + meshName + '/' + componentName + '/*'] = {
            authorized: true,
            description: "system permission"
          };
          for (var eventName in $happn.event[meshName][componentName]) {
            permissions.events['/' + meshName + '/' + componentName + '/' + eventName] = {
              authorized: true,
              description: "system permission"
            };
          }
        }

        for (var componentName in $happn._mesh.config.components) {
          permissions.web['/' + meshName + '/' + componentName + '/*'] = {
            authorized: true,
            description: "system permission"
          };
          if ($happn._mesh.config.components[componentName].web && $happn._mesh.config.components[componentName].web.routes)
            for (var webMethod in $happn._mesh.config.components[componentName].web.routes) {
              permissions.web['/' + meshName + '/' + componentName + '/' + webMethod] = {
                authorized: true,
                description: "system permission"
              };
            }
        }

        this.__cachedSystemPermissions = permissions;
      }
      callback(null, this.__cachedSystemPermissions);
    });
  } catch (e) {
    callback(e);
  }
};

Security.prototype.__getPermissionPath = function ($happn, rawPath, prefix, wildcard) {
  var meshName = $happn._mesh.config.name;

  //we add a wildcard to the end of the path
  if (wildcard)
    rawPath = rawPath.replace(/[\/*]+$/, "") + '/*';

  if (rawPath.substring(0, 1) != '/')
    rawPath = '/' + rawPath;

  if (rawPath.indexOf('/' + meshName) == -1)
    rawPath = rawPath.replace('/', '/' + meshName + '/');

  return '/' + prefix + rawPath;
};

Security.prototype.__transformMeshGroup = function ($happn, group) {

  if (!group) return group;

  var transformed = JSON.parse(JSON.stringify(group));

  transformed.permissions = this.__transformMeshPermissions($happn, group.permissions);

  return transformed;
};

Security.prototype.__transformHappnGroups = function ($happn, happnGroups) {

  var transformed = [];
  var _this = this;

  happnGroups.forEach(function (happnGroup) {
    transformed.push(_this.__transformHappnGroup($happn, happnGroup));
  });

  return transformed;
};


Security.prototype.__transformHappnGroup = function ($happn, group) {

  if (!group) return group;

  var transformed = JSON.parse(JSON.stringify(group));

  transformed.permissions = this.__transformHappnPermissions($happn, group.permissions);

  return transformed;
};

/*
 turns the mesh groups permissions to happn permissions, uses
 the mesh description to verify
 */
Security.prototype.__transformMeshPermissions = function ($happn, meshGroupPermissions) {

  var permissions = {};

  for (var permissionPath in meshGroupPermissions.events) {
    if (meshGroupPermissions.events[permissionPath].authorized)
      permissions[this.__getPermissionPath($happn, permissionPath, '_events')] = {
        actions: ['on'],
        description: meshGroupPermissions.events[permissionPath].description
      };
  }

  for (var permissionPath in meshGroupPermissions.methods) {
    if (meshGroupPermissions.methods[permissionPath].authorized) {
      permissions[this.__getPermissionPath($happn, permissionPath, '_exchange/requests')] = {
        actions: ['set'],
        description: meshGroupPermissions.methods[permissionPath].description
      };
      permissions[this.__getPermissionPath($happn, permissionPath, '_exchange/responses', true)] = {
        actions: ['on', 'set'],
        description: meshGroupPermissions.methods[permissionPath].description
      };
    }
  }

  for (var permissionPath in meshGroupPermissions.web) {
    var actions = meshGroupPermissions.web[permissionPath];

    if (permissionPath.substring(0, 1) != '/') permissionPath = '/' + permissionPath;
    permissions['/@HTTP' + permissionPath] = actions;
  }

  return permissions;
};

/*
 turns the happn groups permissions to mesh permissions, uses
 the mesh description to verify
 */
Security.prototype.__transformHappnPermissions = function ($happn, happnGroupPermissions) {

  var permissions = {
    methods: {},
    events: {},
    web: {}
  };

  for (var happnPermissionPath in happnGroupPermissions) {

    if (!happnGroupPermissions.hasOwnProperty(happnPermissionPath)) return;

    if (happnPermissionPath.indexOf('/_events/') == 0) {
      var happnPermission = happnGroupPermissions[happnPermissionPath];
      if (happnPermission.actions.indexOf('on') > -1)
        permissions.events[happnPermissionPath.replace('/_events/', '')] = {
          authorized: true,
          description: happnPermission.description
        };
    }

    if (happnPermissionPath.indexOf('/_exchange/requests/') == 0) {
      var happnPermission = happnGroupPermissions[happnPermissionPath];
      if (happnPermission.actions.indexOf('set') > -1)
        permissions.methods[happnPermissionPath.replace('/_exchange/requests/', '')] = {
          authorized: true,
          description: happnPermission.description
        };
    }

    if (happnPermissionPath.indexOf('/@HTTP/') == 0) {
      var happnPermission = happnGroupPermissions[happnPermissionPath];
      if (happnPermission.authorized || (happnPermission.actions && happnPermission.actions.length > 0)) {
        var key = happnPermissionPath.replace('/@HTTP/', '');
        permissions.web[key] = {
          authorized: true,
          description: happnPermission.description
        };
        if (happnPermission.actions) {
          permissions.web[key].actions = happnPermission.actions;
        }
      }
    }
  }

  return permissions;
};


Security.prototype.__permissionsToInputFormat = function(permissions) {
  if (permissions && permissions.methods) {
    Object.keys(permissions.methods).forEach(function (path) {
      // reduce /requests/* /responses/* to single entry

      if (path.match(/^responses\//)) {
        return delete permissions.methods[path];
      }

      if (path.match(/^requests\//)) {
        permissions.methods[path.replace(/^requests\//, '')] = permissions.methods[path];
        return delete permissions.methods[path];
      }
    });
  }
};


Security.prototype.__removeLeadingSlashes = function(permissions) {
  // remove leading /'s from input paths to match outputted getGroup format
  ['methods', 'events', 'web'].forEach(function (type) {

    if (!(permissions[type] instanceof Object)) return;

    Object.keys(permissions[type]).forEach(function (path) {
      if (path.match(/^\//)) {
        permissions[type][path.substring(1)] = permissions[type][path];
        delete permissions[type][path];
      }
    });
  });
};

Security.prototype.associateGroups = function($happn, user, link, unlink, callback){

  var _this = this;

  var unlinkGroups = function(){

    if (!unlink || unlink.length == 0) return callback(null);

    async.each(unlink, function(unlinkGroupName, unlinkGroupCB){

      _this.unlinkGroupName($happn, unlinkGroupName, user, unlinkGroupCB);

    }, callback);
  };

  if (!link || link.length == 0) return unlinkGroups();

  async.each(link, function(linkGroupName, linkGroupCB){

    _this.linkGroupName($happn, linkGroupName, user, linkGroupCB);

  }, function(e){

    if (e) return callback(e);

    if (!unlink || unlink.length == 0) return callback(null);

    unlinkGroups();

  });
};

Security.prototype.upsertUser = function($happn, user, options, callback){

  var _this = this;

  if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  if (!user.groups) user.groups = {};

  var isUpdate = false;

  _this.getUser($happn, user.username, function(e, found){

    var upsertUser;

    if (e) return callback(e);

    var groupsToDrop = [];

    if (found){

      upsertUser = found;
      isUpdate = true;

      //replace all properties except groups and username
      Object.keys(user).forEach(function(propertyName){
        if (['groups','username'].indexOf(propertyName) == -1) upsertUser[propertyName] = user[propertyName];
      });

      if (options.overwriteGroups){

        //get the groups we need to unlink, when we overwrite
        Object.keys(found.groups).forEach(function(groupName){
          if (!user.groups[groupName]) groupsToDrop.push(groupName);
        });

        upsertUser.groups = user.groups;
      }

      else for (var groupName in user.groups) upsertUser.groups[groupName] = user.groups;

    } else upsertUser = user;

    if (isUpdate){

      _this.updateUser($happn, upsertUser, function(e, updated){

        if (e) return callback(e);

        _this.associateGroups($happn, updated, Object.keys(user.groups), groupsToDrop, callback);

      });

    } else {

      _this.addUser($happn, upsertUser, function(e, added){

        if (e) return callback(e);

        _this.associateGroups($happn, added, Object.keys(user.groups), [], callback);

      });
    }
  });
};

Security.prototype.upsertGroup = function ($happn, group, options, callback) {

  var _this = this;

  var isUpdate = false;

  if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  if (group.permissions == null) group.permissions = {};
  if (group.permissions.methods == null) group.permissions.methods = {};
  if (group.permissions.events == null) group.permissions.events = {};
  if (group.permissions.web == null) group.permissions.web = {};

  _this.getGroup($happn, group.name, function(e, found){

    if (e) return callback(e);

    var upsertGroup;

    if (found){

      upsertGroup = found;
      isUpdate = true;

      //replace all properties except permissions and name
      Object.keys(group).forEach(function(propertyName){
        if (['permissions','name'].indexOf(propertyName) == -1) upsertGroup[propertyName] = group[propertyName];
      });

      if (options.overwritePermissions) upsertGroup.permissions = group.permissions;

      else {

        if (!upsertGroup.permissions.methods) upsertGroup.permissions.methods = {};
        if (!upsertGroup.permissions.events) upsertGroup.permissions.events = {};
        if (!upsertGroup.permissions.web) upsertGroup.permissions.web = {};

        if (group.permissions.methods)
          Object.keys(group.permissions.methods).forEach(function(permissionKey){
            upsertGroup.permissions.methods[permissionKey] = group.permissions.methods[permissionKey];
          });

        if (group.permissions.events)
          Object.keys(group.permissions.events).forEach(function(permissionKey){
            upsertGroup.permissions.events[permissionKey] = group.permissions.events[permissionKey];
          });

        if (group.permissions.web)
          Object.keys(group.permissions.web).forEach(function(permissionKey){
            upsertGroup.permissions.web[permissionKey] = group.permissions.web[permissionKey];
          });
      }

    } else upsertGroup = group;

    if (isUpdate) return _this.updateGroup($happn, upsertGroup, callback);

    else return _this.addGroup($happn, upsertGroup, callback);

  });

};

Security.prototype.addGroup = function ($happn, group, callback) {

  var _this = this;

  _this.__validateRequest('addGroup', arguments, function (e) {

    if (e) return callback(e);

    _this.__securityService.upsertGroup(_this.__transformMeshGroup($happn, group), {overwrite: false}, function (e, addedGroup) {

      if (e) return callback(e);

      return callback(null, _this.__transformHappnGroup($happn, addedGroup));

    });
  });
};

Security.prototype.updateGroup = function ($happn, group, callback) {

  var _this = this;

  _this.__validateRequest('updateGroup', arguments, function (e) {
    if (e) return callback(e);

    _this.__securityService.upsertGroup(_this.__transformMeshGroup($happn, group), function (e, updatedGroup) {

      if (e) return callback(e);

      return callback(null, _this.__transformHappnGroup($happn, updatedGroup));

    });
  });
};

Security.prototype.addGroupPermissions = function ($happn, groupName, mergePermissions, callback) {

  var _this = this;

  this.__validateRequest('addGroupPermissions', arguments, function (e) {

    if (e) return callback(e);

    _this.getGroup($happn, groupName, function (e, group) {

      if (e) return callback(e);

      _this.__permissionsToInputFormat(group.permissions);
      _this.__removeLeadingSlashes(mergePermissions);

      // `destription: undefined` - is coming from somewhere, delete them
      Object.keys(group.permissions).forEach(function (type) {
        Object.keys(group.permissions[type]).forEach(function (path) {
          if (typeof group.permissions[type][path].description == 'undefined') {
            delete group.permissions[type][path].description;
          }
        });
      });

      ['methods', 'events', 'web'].forEach(function (type) {

        if (!(mergePermissions[type] instanceof Object)) return;

        group.permissions[type] = group.permissions[type] || {};

        Object.keys(mergePermissions[type]).forEach(function (path) {

          var addingPermission = mergePermissions[type][path];
          var existingPermission = group.permissions[type][path];

          if (!(typeof addingPermission.authorized == 'boolean')) {
            addingPermission.authorized = true;
          }

          if (!existingPermission) {
            group.permissions[type][path] = addingPermission;
            return;
          }

          if (Array.isArray(addingPermission.actions)) {

            if (!Array.isArray(existingPermission.actions)) {
              existingPermission.actions = addingPermission.actions;
              return;
            }

            addingPermission.actions.forEach(function (action) {
              if (existingPermission.actions.indexOf(action) < 0) {
                existingPermission.actions.push(action);
              }
            });

          }

        });

      });

      _this.updateGroup($happn, group, function(e, updated) {

        if (e) return callback(e);

        callback(null, updated);

      });
    });
  });
};

Security.prototype.removeGroupPermissions = function ($happn, groupName, removePermissions, callback) {

  var _this = this;

  this.__validateRequest('removeGroupPermissions', arguments, function (e) {

    if (e) return callback(e);

    _this.getGroup($happn, groupName, function (e, group) {

      if (e) return callback(e);

      _this.__permissionsToInputFormat(group.permissions);
      _this.__removeLeadingSlashes(removePermissions);

      // `destription: undefined` - is coming from somewhere, delete them
      Object.keys(group.permissions).forEach(function (type) {
        Object.keys(group.permissions[type]).forEach(function (path) {
          if (typeof group.permissions[type][path].description == 'undefined') {
            delete group.permissions[type][path].description;
          }
        });
      });

      ['methods', 'events', 'web'].forEach(function (type) {

        if (!(removePermissions[type] instanceof Object)) return;

        Object.keys(removePermissions[type]).forEach(function (path) {

          if (!group.permissions[type]) return;

          var removePermission = removePermissions[type][path];
          var existingPermission = group.permissions[type][path];

          if (!existingPermission) return;

          if (!(removePermission instanceof Object)) return;

          if(Object.keys(removePermission).length == 0) {
            // delete on empty object passed as permission
            delete group.permissions[type][path];
            return;
          }

          if (Array.isArray(removePermission.actions)) {

            if (!Array.isArray(existingPermission.actions)) return;

            // remove specified actions
            removePermission.actions.forEach(function (action) {
              var position = existingPermission.actions.indexOf(action);
              if (position < 0) return;
              existingPermission.actions.splice(position, 1);
            });
          }

        });

      });

      _this.updateGroup($happn, group, function(e, updated) {

        if (e) return callback(e);

        callback(null, updated);

      });
    });
  });
};

Security.prototype.addUser = function ($happn, user, callback) {

  var _this = this;

  _this.__validateRequest('addUser', arguments, function (e) {
    if (e) return callback(e);

    _this.__securityService.upsertUser(user, {overwrite: false}, function (e, upsertedUser) {

      if (e) return callback(e);

      _this.linkGroup($happn, _this.__systemGroups['_MESH_GST'], upsertedUser, function (e) {

        if (e) return callback(e);

        callback(null, upsertedUser);

      });
    });
  });
};

Security.prototype.updateOwnUser = function ($happn, $origin, user, callback) {

  this.__validateRequest('updateOwnUser', arguments, function (e) {

    if (e) return callback(e);
    this.__securityService.upsertUser(user, callback);

  }.bind(this));
};

Security.prototype.updateUser = function ($happn, user, callback) {

  this.__validateRequest('updateUser', arguments, function (e) {

    if (e) return callback(e);
    this.__securityService.upsertUser(user, callback);

  }.bind(this));
};

Security.prototype.linkGroupName = function ($happn, groupName, user, callback) {

  var _this = this;

  _this.__validateRequest('linkGroupName', arguments, function (e) {

    if (e) return callback(e);

    _this.getGroup($happn, groupName, function(e, group){

      if (e) return callback(e);

      _this.__securityService.linkGroup(_this.__transformMeshGroup($happn, group), user, {}, callback);

    });

  }.bind(this));
};

Security.prototype.unlinkGroupName = function ($happn, groupName, user, callback) {

  var _this = this;

  _this.__validateRequest('unlinkGroupName', arguments, function (e) {

    if (e) return callback(e);

    _this.getGroup(groupName, function(e, group){

      if (e) return callback(e);

      _this.__securityService.unlinkGroup(_this.__transformMeshGroup($happn, group), user, {}, callback);

    });
  }.bind(this));
};

Security.prototype.linkGroup = function ($happn, group, user, callback) {

  var _this = this;

  _this.__validateRequest('linkGroup', arguments, function (e) {

    if (e) return callback(e);

    _this.__securityService.linkGroup(_this.__transformMeshGroup($happn, group), user, {}, callback);

  }.bind(this));
};

Security.prototype.unlinkGroup = function ($happn, group, user, callback) {

  var _this = this;

  _this.__validateRequest('unlinkGroup', arguments, function (e) {

    if (e) return callback(e);

    _this.__securityService.unlinkGroup(_this.__transformMeshGroup($happn, group), user, {}, callback);

  }.bind(this));
};

Security.prototype.listGroups = function ($happn, groupName, callback) {

  var _this = this;

  _this.__validateRequest('listGroups', arguments, function (e) {

    if (e) return callback(e);
    _this.__securityService.listGroups(groupName, {}, function (e, happnGroups) {
      if (e) return callback(e);

      callback(null, _this.__transformHappnGroups($happn, happnGroups))
    });
  });
};

Security.prototype.listUsers = function ($happn, userName, callback) {

  this.__validateRequest('listUsers', arguments, function (e) {

    if (e) return callback(e);
    this.__securityService.listUsers(userName, {}, callback);

  }.bind(this));
};

Security.prototype.getUser = function ($happn, userName, callback) {

  this.__validateRequest('getUser', arguments, function (e) {

    if (e) return callback(e);
    this.__securityService.getUser(userName, {}, callback);

  }.bind(this));
};

Security.prototype.getGroup = function ($happn, groupName, callback) {

  var _this = this;

  _this.__validateRequest('getGroup', arguments, function (e) {

    if (e) return callback(e);

    _this.__securityService.getGroup(groupName, {}, function (e, group) {

      if (e) return callback(e);

      if (group)
        return callback(null, _this.__transformHappnGroup($happn, group));

      // callback with null if group does not exist (same as getUser)
      callback(null, null);

    }.bind(this));
  });
};

Security.prototype.deleteGroup = function (group, callback) {

  this.__validateRequest('deleteGroup', arguments, function (e) {

    if (e) return callback(e);
    this.__securityService.deleteGroup(group, {}, callback);

  }.bind(this));
};

Security.prototype.deleteUser = function (user, callback) {

  this.__validateRequest('deleteUser', arguments, function (e) {

    if (e) return callback(e);
    this.__securityService.deleteUser(user, {}, callback);

  }.bind(this));
};

Security.prototype.sessionManagementActive = function () {

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.sessionManagementActive();
};

Security.prototype.activateSessionManagement = function (logSessionActivity, callback) {

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.activateSessionManagement(logSessionActivity, callback);

};

Security.prototype.deactivateSessionManagement = function (logSessionActivity, callback) {

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.deactivateSessionManagement(logSessionActivity, callback);

};

Security.prototype.sessionActivityActive = function () {

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.sessionActivityActive();
};

Security.prototype.activateSessionActivity = function (callback) {

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.activateSessionActivity(callback);

};

Security.prototype.deactivateSessionActivity = function (clear, callback) {

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.deactivateSessionActivity(clear, callback);

};

Security.prototype.clearSessionActivity = function (callback) {

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.clearSessionActivity(callback);

};

Security.prototype.revokeSession = function (session, reason, callback) {

  if (!session) return callback(new Error('missing session argument'));

  if (typeof reason == 'function') {
    callback = reason;
    reason = 'SYSTEM';
  }

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.revokeSession(session, reason, callback);

};

Security.prototype.restoreSession = function (session, callback) {

  if (!session) return callback(new Error('missing session argument'));

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.restoreSession(session, callback);

};

Security.prototype.listSessionActivity = function (filter, callback) {

  if (typeof filter == 'function') {
    callback = filter;
    filter = null;
  }

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.listSessionActivity(filter, callback);

};

Security.prototype.listActiveSessions = function (filter, callback) {

  if (typeof filter == 'function') {
    callback = filter;
    filter = null;
  }

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.listActiveSessions(filter, callback);

};

Security.prototype.listRevokedSessions = function (filter, callback) {

  if (typeof filter == 'function') {
    callback = filter;
    filter = null;
  }

  if (!this.__securityService) return callback(new Error('not initialized'));

  return this.__securityService.listRevokedSessions(filter, callback);

};
