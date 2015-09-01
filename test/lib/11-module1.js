module.exports = Module1;

function Module1() {}

Module1.prototype.start = function(callback) {
  callback(null);
  // console.log('start', this.stop);
}

Module1.prototype.stop = function() {
  // console.log('stop', this.$happn.config);
}

Module1.prototype.getThingFromConfig = function($happn, callback) {
  callback(null, $happn.config.configThing);
}
