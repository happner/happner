module.exports.create = function(opt1, callback, opt2) {
  callback(null, {
    method: function(callback) {
      callback(null, opt1 + ' ' + opt2);
    }
  });
}
