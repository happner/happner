module.exports = Module2;

function Module2() {}

Module2.prototype.getThingFromConfig = function($happn, callback) {
  callback(null, $happn.config.configThing);
}

Module2.prototype.methodNameFront = function($happn, arg1, callback) {
  callback(null, [arg1, $happn.config.configThing]);
}

Module2.prototype.methodNameMiddle = function(arg1, $happn, callback) {
  callback(null, [arg1, $happn.config.configThing]);
}

Module2.prototype.methodNameEnd = function(arg1, callback, $happn) {
  callback(null, [arg1, $happn.config.configThing]);
}

Module2.prototype.methodWithoutHappn = function(arg1, callback) {
  callback(null, [arg1]);
}

Module2.prototype.callOnwardWithoutHappn = function(arg1, callback) {
  // call onward by module without happn
  this.methodWithHappn(arg1, callback); // CALL TO SAME without $happn
}

Module2.prototype.callOnwardWithHappn = function(arg1, $happn, callback) {
  // call onward by module without happn
  this.methodWithHappn(arg1, $happn, callback); // CALL TO SAME with $happn
}

Module2.prototype.methodWithHappn = function(arg1, $happn, callback) {
  // console.log(arguments);
  callback(null, arg1 + arg1);
}
