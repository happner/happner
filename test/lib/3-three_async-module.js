module.exports = function(callback) {
  callback(null, {
    method: function(callback) {
      callback(null, 'RESULT');
    }
  });
}
