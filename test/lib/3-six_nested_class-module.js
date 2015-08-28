module.exports.Thing = Thing;

function Thing() {}

Thing.prototype.method = function(callback) {
  callback(null, 'RESULT');
}
