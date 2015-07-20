module.exports = Module1;

function Module1() {}

Module1.prototype.funK = function($happn, arg, callback) {

  console.log('Running funK() with', arg);

  callback(null, arg + arg);

}
