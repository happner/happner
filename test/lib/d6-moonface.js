module.exports = function () {
  return new Moonface();
};

function Moonface() {

  this.rideTheSlipperySlip = function ($happn, one, two, three, callback) {
    $happn.emit('whoops', 'whoa');
    callback(undefined, one + ' ' + two + ' ' + three + ', wheeeeeeeeeeeeheeee!');
  };

  this.haveAnAccident = function (callback) {
    throw (
      e = new Error('Stray patch of glue.'),
        e.name = 'SlipFailure',
        e
    )
  }

  this.queryTheMesh = function($happn, path, callback){
    console.log('queryTheMesh:::', path, callback);
    $happn._mesh.data.get(path, function(e, results){
      callback(e, results);
    });
  }
}
