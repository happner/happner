module.exports = Module;

function Module() {}

Module.prototype.start = function($happn, callback) {
  var i = 0;
  callback(null, $happn);
  setInterval(function() {
    $happn.emit('mooi', {i: i++});
    // $happn.emit('mooj', {j: i++});
  }, 1000);
}

Module.prototype.slow = function(callback) {
  setTimeout(function() {
    callback(null, 'REPLY');
  }, 12000)
}


function MyError(message, data) {
  this.name = 'MyError';
  this.message = message;
  this.data = data;
}
MyError.prototype = Object.create(Error.prototype);
MyError.prototype.constructor = MyError;


Module.prototype.strayTimeout = function($happn, callback) {

  // throw new MyError('Oh no.', {da: 'ta'});

  setTimeout(function() {
    callback(null, 'REPLY');
  }, 1000);
}
