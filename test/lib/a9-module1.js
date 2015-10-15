/**
 * Created by Johan on 4/14/2015.
 * Updated by S.Bishop 6/1/2015.
 */

var traverse = require('traverse');

module.exports = function (options) {
  return new Component1(options);
};

function Component1(options) {

  this.storeData = function($happn, path, data, parameters, callback){

    try{

     $happn.data.set(path, data, parameters, callback);

    }catch(e){
      callback(e);
    }
  }

  this.lookForForbiddenMethods = function($happn, callback){
    try{

      //look in $happn

      return callback(null, []);
    }catch(e){
      return callback(e);
    }
    
  }

  this.start = function(arg, $happn){

  };

  this.stop = function(){

  }
}
