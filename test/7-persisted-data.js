module.exports = DataComponent7;

var DONE = false;

function DataComponent7() {}

DataComponent7.prototype.storeData = function($happn, path, data, callback){
  try{

   $happn.data.set(path, data, {}, function(e, response){

    return callback(e, response)

   });

  }catch(e){
    callback(e);
  }
}

DataComponent7.prototype.method1 = function($happn, options, callback) {
  options.methodName = 'method1';
   console.log('ran method1...');
  callback(null, options);
}

DataComponent7.prototype.method2 = function($happn, options, callback) {
  options.methodName = 'method2';
  console.log('ran method2...');
  callback(null, options);
}

DataComponent7.prototype.method3 = function($happn, options, callback) {
  options.methodName = 'method3';
   console.log('ran method3...');
  callback(null, options);
}

DataComponent7.prototype.fireEvent = function($happn, eventName, callback) {
  $happn.emit(eventName, eventName);
  callback(null, eventName + ' emitted');
}

if (global.TESTING_7) return; // When 'requiring' the module above,
                              // don't run the tests below
                             //............. 

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;
var maximumPings = 1000;
var libFolder ;
var Mesh = require('../');
var test_id = Date.now() + '_' + require('shortid').generate();
var should = require('chai').should();
var fs = require('fs-extra');
var dbFileName = './temp/' + test_id + '.nedb';

describe('test persisted config, check memory and persisted data stores', function() {

  global.TESTING_7 = true;
  this.timeout(3000);

  var mesh = require('../lib/mesh')();

  var config = {
    name:"testPersistedData",
    datalayer: {
      persist:true,
      filename:dbFileName,
      log_level: 'info|error|warning'
    },
    modules: {
      'DataComponent7': {
        path: __filename
      }
    },
    components: {
      'DataComponent7': {
        moduleName: 'DataComponent7',
        schema: {
          exclusive: false,
          methods: {}
        }
      }
    }
  };

  after(function(done){
    fs.unlink(dbFileName, function(e){
      if (e) return callback(e);
      mesh.stop(done);
    });
  });

  before(function(done){

    mesh = new Mesh();
    mesh.initialize(config, function(err) {
      if (err) {
        console.log(err.stack);
        done(err);
      } else {
        mesh.start(done);
      }
    });

  });

  it('tests storing data', function(done) {

    try{

      mesh.exchange.DataComponent7.storeData('test/data', {'test':'data'}, function(e, response){

        if (e) return done(e);
        response._meta.path.should.equal('/_data/DataComponent7/test/data');

        done();

      });

    }catch(e){
      done(e);
    }
    
  })

});
