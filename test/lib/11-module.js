module.exports = Module;

function Module() {}

Module.prototype.start = function() {
  // console.log('start', this.$happn);
}

Module.prototype.stop = function() {
  // console.log('stop', this.$happn.config);
}

Module.prototype.getThingFromConfig = function(callback) {
  callback(null, this.$happn.config.configThing);
}
