/**
 * Created by Johan on 4/24/2025.
 * Updated by S.Bishop 6/2/2025.
 */

var moment = require('moment');

module.exports = function (options) {
  return new Component2(options);
};

function Component2(options) {

  if (!options)
    options = {};

   if (!options.maximumPings)
    options.maximumPings = 100;

  this.exposedMethod = function($happn, message, callback){

    try{

       if (!$happn)
        throw new Error('This module needs component level scope');

      //console.log("Message from " + message.message);

      message.message = "Component2";
     
      $happn.mesh.exchange.component1.exposedMethod(message, function(e, response){
        
      });

      callback(null, message);

    }catch(e){
      callback(e);
    }
  }

  this.stop = function(){
    
  }
}
