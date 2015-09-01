/**
 * Created by Johan on 4/14/2015.
 * Updated by S.Bishop 6/1/2015.
 */

var moment = require('moment');

module.exports = function (options) {
  return new StopMeshModule2(options);
};

function StopMeshModule2(options) {

  this.start = function ($happn) {

  }

  this.stop = function ($happn, done) {

  	$happn.log.info('stop method called mod 2');

    done();
  }
}
