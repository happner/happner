module.exports = One;

function One() {};

One.prototype.method = function(callback) {
  callback(null, 'RESULT');
}
