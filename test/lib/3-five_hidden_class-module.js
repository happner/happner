module.exports = function() {
  return new Thing();
}

function Thing() {}

Thing.prototype.method = function (callback) {
  callback(null, 'RESULT');
}
