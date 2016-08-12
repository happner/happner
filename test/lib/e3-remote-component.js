module.exports = function () {
  return new RemoteComponent();
};

function RemoteComponent() {

  this.remoteFunction = function ($happn, one, two, three, callback) {
    $happn.emit('whoops', 'whoa');
    callback(undefined, one + ' ' + two + ' ' + three + ', wheeeeeeeeeeeeheeee!');
  };

  this.causeError = function (callback) {
    throw (
      e = new Error('Error string'),
        e.name = 'ErrorType',
        e
    )
  }
}
