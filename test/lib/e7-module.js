module.exports = function () {
  return new E7Module();
};

function E7Module() {
  this.start = function(options) {
    this.callbackTimeout = options.callbackTimeout;
  };

  this.exchangeFunction = function (object, callback) {
    return callback(null, object);
  };

  this.methodOk = function(object, callback) {
    callback(null, object);
  };

  this.methodError = function(callback) {
    callback(new Error('Some problem'));
  };

  this.methodInjectHappn1 = function($happn, object, callback) {
    callback(null, {meshName: $happn.info.mesh.name});
  };

  this.methodInjectHappn2 = function(object, $happn, callback) {
    callback(null, {meshName: $happn.info.mesh.name});
  };

  this.methodInjectOrigin = function($origin, object, $happn, callback) {
    object.meshName = $happn.info.mesh.name;
    object.originUser = $origin.username;
    callback(null, object);
  };

  this.methodInjectHappnLast = function(object, $origin, callback, $happn) {
    object.meshName = $happn.info.mesh.name;
    object.originUser = $origin.username;
    callback(null, object);
  };

  this.synchronousMethod = function($origin, object, $happn) {
    console.log(arguments);
  }

}
