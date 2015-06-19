// Uses unit test 2 modules

describe('Bounces a message between two components, demonstrates how the events layer works', function (done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached
  var Mesh = require('../lib/system/mesh');

  var maximumPings = 1000;
  var defaultTimeout = (process.arch == 'arm') ? 50000 : 10000 ;

  var config = {
    name: "testComponent2Component",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'info|error|warning',
      //setOptions:{}
    },
    endpoints: {},
    modules: {
      "module1": {
        path: __dirname + "/2-module1",
        constructor: {
          type: "sync",
          parameters: [
            {value: {maximumPings: maximumPings}}
          ]
        }
      },
      "module2": {
        path: __dirname + "/2-module2",
        constructor: {
          type: "sync"
        }
      }
    },
    components: {
      "component1": {
        moduleName: "module1",
        scope: "component",//either component(mesh aware) or module - default is module
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
        scope: "component",
        schema: {
          "exclusive": false
        }
      }
    }
  };

  var mesh = Mesh();

  before(function (done) {
    this.timeout(defaultTimeout);
    console.time('startup');
    mesh.initialize(config, function (err) {
      console.timeEnd('startup');
      done(err);
    });
  });

  it('starts the mesh, listens for the ping pong completed event, that module1 emits', function (done) {

    this.timeout(defaultTimeout);

    var onEventRef;

    mesh.api.event.component1.on('maximum-pings-reached', function (message) {

      //console.log(mesh.api.event.component1.off.toString());
      mesh.api.event.component1.off(onEventRef, function (err) {
        if (err)
          console.log('Couldnt detach from event maximum-pings-reached');

        console.log('Detaching from maximum-pings-reached');
        console.log(message.payload.data);
        //console.log(done);
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
        //console.log(mesh.api.data.events);
        mesh.start(function (err) {
          if (err) {
            console.log('Failed to start mesh');
            done(err);
          }
        });
      }
    });
  });
});









