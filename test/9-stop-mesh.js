// Uses unit test 2 modules
var expect = require('expect.js');
var Mesh = require('../');

describe('9-stop-mesh', function (done) {

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(5000);

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var config = {
    name: "stopMesh",
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

  after(function (done) {
    if (mesh) mesh.stop({reconnect: false}, done);
  })

  var startMesh = function(callback){
    mesh = new Mesh();
    mesh.initialize(config, callback);
  };

  it('stops the mesh', function (done) {

    startMesh(function(e){

      if (e) return done(e);
      mesh.stop({reconnect: false}, function (e, mesh, log) {

        var stopScore = 0;

        log.map(function(item){

          if (['stopped components','stopped datalayer','unsubscribed from process events'].indexOf(item.message) >= 0)
            stopScore++;

        });

        if (stopScore < 3) return done('stop events did not happen or were not logged properly');
        done();
      });

    });

  });

  it('stops then starts the same mesh, tests the echo method', function (done) {

    startMesh(function(e){

      if (e) return done(e);
      mesh.stop({reconnect: false}, function (e) {

        if (e) return done(e);
        mesh.initialize(config, function(e){

          if (e) return done(e);
          mesh.exchange.component1.echo('test', function(e, response){
            expect(e).to.be(null);
            expect(response).to.be('test');
            done();
          });
        })
      });

    });
  });

  require('benchmarket').stop();

});









