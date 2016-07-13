module.exports = function () {
  return new SlowStartup();
};

function SlowStartup() {
  this.init = function (delay, callback) {
    setTimeout(function () {
      console.log('started after delay:::', delay);
      callback();
    }, delay);
  }
}
