// Uses unit test 2 modules
var should = require('chai').should();
var Mesh = require('../');


describe('does some benchmarks on api calls, data events and events', function (done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached

  this.timeout(20000);

  var maximumPings = 1000;
  var defaultTimeout = (process.arch == 'arm') ? 50000 : 10000;

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var comp1Timeout = 5000;
  var comp2Timeout = 7000;

  var config = {
    name: "stopMesh",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'error'
      //setOptions:{}
    },
    endpoints: {},
    modules: {
      "stopMeshModule1": {
        path: libFolder + "9-stop-mesh-module"
      },
      "stopMeshModule2": {
        path: libFolder + "9-stop-mesh-module-2"
      }
    },
    components: {
      "component1": {
        moduleName: "stopMeshModule1",
        // scope: "component",//either component(mesh aware) or module - default is module
        startMethod: "start",
        stopMethod: "stop",
        schema: {
          "exclusive": false,//means we dont dynamically share anything else
          "methods": {
            "start": {
              type: "sync",
              parameters: [
                {"required": true, "value": {"message": "this is a start parameter"}}
              ]
            }
          }
        }
      },
      "component2": {
        moduleName: "stopMeshModule2",
        stopMethod: "stop",
        // scope: "component",
        schema: {
          "exclusive": false,
          "methods": {}
        }
      }
    }
  };

  var mesh;

  before(function (done) {
    this.timeout(defaultTimeout);
    console.time('startup');
    mesh = new Mesh();
    mesh.initialize(config, function (err) {
      console.timeEnd('startup');
      done();
    });
  });

  
  it('stops the mesh', function (done) {
    this.timeout(defaultTimeout);
    mesh.stop({}, function(e, log){

      done(e);

    });
  });

});









