/**
 * Created by cc on 2015/12/08.
 */

var DEVICE_GROUP_NAME = 'Special Devices';

module.exports = function () {
  return new Server();
};

var Server = function () {

  this.start = function (options) {

  };

  this.registerDevice = function (username, device, callback, $happn) {
    // check if the device group exist
    getDeviceGroup($happn, function (err, group) {
      if (err) {
        return callback(err);
      }

      addNewUser(group, device, $happn, function (err, user) {
        if (err) return callback(err);
        callback(null, user);
      });
    });
  };

  this.doSomethingSpecial = function (data, callback, $happn) {
    $happn.emit('special', data);
    callback(null, 'success');
  }
};


function getDeviceGroup(happn, callback) {
  // check if the group exists

  happn.exchange.security.listGroups('*', function (err, groups) {
    if (err) callback(err);

    var groupExists = false;

    for (var i = 0; i < groups.length; i++) {
      if (groups[i].name == DEVICE_GROUP_NAME) {
        groupExists = true;
        break;
      }
    }

    // if the group exists, update it in case new permissions are added etc.
    if (groupExists) {
      happn.exchange.security.updateGroup(generateDeviceGroup(happn.info.mesh.name, happn.name), function (err, group) {
        return callback(err, group);
      });
      return;
    }

    // if the group does not yet exist, create it
    happn.exchange.security.addGroup(generateDeviceGroup(happn.info.mesh.name, happn.name), function (err, group) {
      return callback(err, group);
    });
  });
}

function generateDeviceGroup(mesh_name, component_name) {
  var somethingSpecialPath = '/' + mesh_name + '/' + component_name + '/doSomethingSpecial';

  var devicesGroup = {
    name: DEVICE_GROUP_NAME,
    permissions: {
      methods: {}
    }
  };
  devicesGroup.permissions.methods[somethingSpecialPath] = {authorized: true};
  return devicesGroup;
}


function addNewUser(group, device, mesh, callback) {
  var newDeviceUser = {
    username: device.deviceId,
    password: "password",
    custom_data: device
  };

  mesh.exchange.security.getUser(device.deviceId, function (err, user) {
    if (err) return callback(err);

    if (user === null) {

      mesh.exchange.security.addUser(newDeviceUser, function (err, user) {
        if (err)return callback(err);

        mesh.exchange.security.linkGroup(group, user, function (err) {
          callback(err, newDeviceUser);
        });
      });
    }
    else {

      mesh.exchange.security.updateUser(newDeviceUser, function (err, user) {
        if (err)return callback(err);

        mesh.exchange.security.linkGroup(group, user, function (err) {
          callback(err, newDeviceUser);
        });
      });
    }
  });
}
