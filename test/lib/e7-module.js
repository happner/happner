module.exports = function () {
  return new E7Module();
};

function E7Module() {
  this.start = function(options) {
    this.callbackTimeout = options.callbackTimeout;
  };

  this.exchangeFunction = function (object, callback) {
    if (!this.callbackTimeout) return callback(null, object);
    var startTime = (new Date()).getTime();
    setTimeout(function() {
      var diff = (new Date()).getTime() - startTime;
      if (diff > (this.callbackTimeout)) throw(new Error('Timeout too quick'));
      callback(null, object);
    },this.callbackTimeout);
  };
}
