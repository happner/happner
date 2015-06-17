module.exports = function() {
  return new Moonface();
}
 function Moonface() {

  this.rideTheSlipperySlip = function(one, two, three, callback) {
    callback(undefined, one+' '+two+' '+three+', wheeeeeeeeeeeeheeee!');
  }

  this.haveAnAccident = function(callback) {
    throw (
      e = new Error('Stray patch of glue.'),
      e.name = 'SlipFailure',
      e
    )
  }
}
