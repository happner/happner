module.exports = function () {
  return new RemoteComponent();
};

function RemoteComponent() {
  this.remoteFunctionTest = function ($happn, one, two, three, callback) {
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

RemoteComponent.prototype.remoteFunction = function (args, callback) {
  console.log('running remote function:::', args);
  callback(undefined, 'UMBERTO ' + args);
};

RemoteComponent.prototype.otherRemoteFunction = function (args, callback) {
  return callback();
  console.log('running remote function:::', args);
  callback();
};
