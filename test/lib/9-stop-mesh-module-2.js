/**
 * Created by Johan on 4/14/2015.
 * Updated by S.Bishop 6/1/2015.
 */


module.exports = function () {
  return new StopMeshModule2();
};

function StopMeshModule2() {

  this.echo = function ($happn, message, callback) {
    return callback(null, message);
  };

  this.start = function ($happn) {
    $happn.emit('start-method-called', {data:'test'});
    $happn.log.info('start method called mod');
  };

  this.stop = function ($happn, callback) {
    $happn.emit('stop-method-called', {data:'test'});
    $happn.log.info('stop method called mod');
    callback();
  };

  this.startData = function ($happn) {

  };
}
