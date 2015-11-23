module.exports = Module;

function Module() {}

Module.prototype.getPid = function(callback) {
  callback(null, process.pid);
}
