// Object.keys(require.cache).forEach(function(key) {
//   delete require.cache[key]
// });

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;
var maximumPings = 1000;
var libFolder ;
var Mesh = require('../');
var test_id = Date.now() + '_' + require('shortid').generate();
var should = require('chai').should();

describe('passes data between component APIs, also works with events', function(done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached

  this.timeout(10000);

  var mesh = require('../lib/mesh')();

  var config = {
    name:"testProtectedDataAPI",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'info|error|warning',
      //setOptions:{}
    },
    endpoints: {},
    modules: {
      "module1":{
        path:libFolder + "a9-module1",
        constructor:{
          type:"sync",
          parameters:[
            {value:{maximumPings:maximumPings}}
          ]
        }
      },
      "module2":{
        path:libFolder + "a9-module2",
        constructor:{
          type:"sync"
        }
      }
    },
    components: {
      "component1":{
        moduleName:"module1",
        startMethod:"start",
        schema:{
          "exclusive":false,//means we dont dynamically share anything else
          "methods":{
            "start":{
              type:"sync",
              parameters:[
               {"required":true, "value":{"message":"this is a start parameter"}}  
              ]
            }
          }
        }
      },
      "component2":{
        moduleName:"module2",
        schema:{
          "exclusive":false
        }
      }
    }
  };

  after(function(done){
     mesh.stop(done);
  });

  before(function(done){

    mesh = new Mesh();
    mesh.initialize(config, function(err) {
      if (err) {
        console.log(err.stack);
        done(err);
      } else done();

    });

  });

  it('stores some data on component1, we look at the output from happn', function(done) {

    mesh.exchange.component1.storeData(test_id, {"testprop1":"testval1"}, {}, function(e, result){
      result._meta.path.should.equal('/mesh/system/data/testProtectedDataAPI/component1/' + test_id);
      done();

    });

  });

  it('stores some data on component2, we look at the output from happn', function(done) {

     mesh.exchange.component2.storeData(test_id, {"testprop2":"testval2"}, {}, function(e, result){
      result._meta.path.should.equal('/mesh/system/data/testProtectedDataAPI/component2/' + test_id);
      done();

    });

  });

  it('uses component2 to inspect $happn for forbidden data methods', function(done) {

    mesh.exchange.component2.lookForForbiddenMethods(function(e, result){

      result.length.should.equal(0);
      done();

    });

  });

  it('checks that it can find the happn class paths in the mesh, negative test', function(done){

    var traverse = require('traverse');

    var permittedFruit = ['_remoteOff'];
    var appetiteSated = [];

      traverse(mesh).map(function(){

        if (permittedFruit.indexOf(this.key) >= 0)
          appetiteSated.push(this.path);

      });

      if (appetiteSated.length == 0)
        return done(new Error('couldnt find happn methods'));

      done();

  });

});









