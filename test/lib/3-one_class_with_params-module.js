module.exports = One;

function One(opt1, opt2) {
  this.opt1 = opt1;
  this.opt2 = opt2;
};

One.prototype.method = function(callback) {
  callback(null, this.opt1 + ' ' + this.opt2);
}
