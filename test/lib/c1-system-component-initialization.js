module.exports = function () {
  return new TestComponent();
};


function TestComponent() {
  this.start = function (callback, $happn) {
    $happn.exchange.security.listGroups('*', function (err, data) {
      callback(err);
    })
  }
}
