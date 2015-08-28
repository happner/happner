module.exports.create = function(opt1, opt2) {
  return {
    method: function(callback) {
      callback('null', opt1 + ' ' + opt2);
    }
  }
}
