// Uses unit test 2 modules
var should = require('chai').should();


describe('does some benchmarks on api calls, data events and events', function (done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached
  require('./lib/0-hooks')();

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
    mesh = this.Mesh();
    mesh.initialize(config, function (err) {
      console.timeEnd('startup');
      done();
    });
  });

  after(function () {
    mesh.stop();
  });

  it('listens for the ping pong completed event, that module1 emits', function (done) {
    this.timeout(defaultTimeout);
    
    
  });

  it('listens for an event in module 2 that module 1 set 1000 data points', function (done) {
    this.timeout(defaultTimeout);

    
  });
});









