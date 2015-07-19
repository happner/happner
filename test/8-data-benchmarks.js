// Uses unit test 2 modules
var should = require('chai').should();


describe('does some benchmarks on api calls, data events and events', function (done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached
  require('./lib/0-hooks')();

  var maximumPings = 1000;
  var defaultTimeout = (process.arch == 'arm') ? 50000 : 10000;

  var config = {
    name: "testBenchmark",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'error'
      //setOptions:{}
    },
    endpoints: {},
    modules: {
      "module1": {
        path: __dirname + "/lib/8-module1",
        constructor: {
          type: "sync",
          parameters: [
            {value: {maximumPings: maximumPings}}
          ]
        }
      },
      "module2": {
        path: __dirname + "/lib/8-module2",
        constructor: {
          type: "sync",
          parameters: [
            {value: {maximumPings: maximumPings}}
          ]
        }
      }
    },
    components: {
      "component1": {
        moduleName: "module1",
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
        moduleName: "module2",
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

    var onEventRef;

    mesh.api.event.component1.on('maximum-pings-reached', function (message) {

      mesh.api.event.component1.off(onEventRef, function (err) {
        if (err)
          console.log('Couldnt detach from event maximum-pings-reached');

        console.log('Detaching from maximum-pings-reached');
        console.log(message.payload.data);
        done(err);
      });

    }, function (err, ref) {
      if (err) {
        console.log('Couldnt attach to event maximum-pings-reached');
        done(err);
      }
      else {
        //we have attached our events, now we start the mesh
        console.log('attached on ok, ref: ' + ref);
        onEventRef = ref;
        mesh.start(function (err) {
          if (err) {
            console.log('Failed to start mesh');
            done(err);
          }
        });
      }
    });
  });

  it('listens for an event in module 2 that module 1 set 1000 data points', function (done) {
    this.timeout(defaultTimeout);

    mesh.api.exchange.component2.startData(function () {

      mesh.api.event.component2.on('data-test-complete', function (message) {
        console.log(message.payload.data);
        message.payload.data.should.contain('Hooray');
        done();
      }, function () {
      });

      mesh.api.exchange.component1.startData();
    });

  });
});









