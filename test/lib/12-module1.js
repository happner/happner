/**
 * Created by Johan on 4/14/2015.
 * Updated by S.Bishop 6/1/2015.
 */

var moment = require('moment');

module.exports = function (options) {
  return new Component1(options);
};

function Component1(options) {

  if (!options)
    options = {};

   if (!options.maximumPings)
    options.maximumPings = 100;

  this.moduleMethod = function(){
    console.log('ran the module method from the component level scope');
  }

  this.exposedMethod = function($happn, message, callback){

    try{

      // console.log($happn);

      this.moduleMethod();
      callback(null, 'hooray, message was: ' + message);

    }catch(e){
      callback(e);
    }
  }

  this.start = function(arg, $happn){

    //console.log('starting module1 component');

    $happn.mesh.exchange.component2.exposedMethod({message:"Component1", "timestamp":moment.utc(), "pingCount":0}, function(e, response){
      if (e) return //console.log('call to component2 broke...' + e);

    });
  };

  this.stop = function(){

  }
}
