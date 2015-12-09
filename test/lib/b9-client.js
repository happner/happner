/**
 * Created by cc on 2015/12/08.
 */

var Mesh = require('../../lib/mesh.js');

module.exports = function(){
  return new Client();
};

var Client = function () {
  var _this_module = this;

  var _deviceData = {
    options: {},
    credentials: null
    //serverSettings: {},
    //details: {}
  };

  var _meshClient = null;

  this.start = function (options, callback) {
    _deviceData.options = options || {};

    _meshClient = new Mesh.MeshClient({
      secure: true,
      port: _deviceData.options.serverMeshPort,
      hostname: _deviceData.options.serverMeshHost
    });

    callback();
  };

  this.login = function (credentials, callback) {
    _meshClient.login(credentials).then(function () {
      callback();
    }).catch(function (err) {
      console.log("login error");
      callback(err);
    });
  };

  this.requestSomethingSpecial = function (data, callback) {
    _meshClient.exchange[_deviceData.options.serverComponentName].doSomethingSpecial(data, callback);
  };


  this.registerDevice = function (credentials, deviceDetails, callback, $happn) {

    console.log('loggin in with creds:::', credentials);

    _this_module.login(credentials, afterLogin);

    function afterLogin(err) {
      if (err) {
        callback(err);
        return;
      }

      var regDeviceDetails = deviceDetails || {};
      regDeviceDetails.deviceId = $happn.info.mesh.name;
      regDeviceDetails.modelName = "BACnet Router";

      _deviceData.details = regDeviceDetails;

      _meshClient.exchange[_deviceData.options.serverComponentName].registerDevice(credentials.username, regDeviceDetails, function (err, deviceCredentials) {
        if (err) return callback(err);

        _deviceData.credentials = deviceCredentials;

        _this_module.login(deviceCredentials, function (err) {
          return callback(err);
        });
      });
    }
  };


};