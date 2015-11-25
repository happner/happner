describe('Bounces a message between two components, demonstrates how the events layer works', function(done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;
  var maximumPings = 1000;
  var libFolder ;
  var Mesh = require('../');

  var mesh = new Mesh();

  var config = {
    name:"testComponent2Component",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'info|error|warning',
      //setOptions:{}
    },
    endpoints: {},
    modules: {
      "module1":{
        path:libFolder + "2-module1",
        constructor:{
          type:"sync",
          parameters:[
            {value:{maximumPings:maximumPings}}
          ]
        }
      },
      "module2":{
        path:libFolder + "2-module2",
        constructor:{
          type:"sync"
        }
      }
    },
    components: {
      "component1":{
        moduleName:"module1",
        // scope:"component",//either component(mesh aware) or module - default is module
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
        // scope:"component",
        schema:{
          "exclusive":false
        }
      }
    }
  };

  after(function(done){
     mesh.stop(done);
  });

  it('starts the mesh, listens for the ping pong completed event, that module1 emits', function(done) {
    
    mesh = new Mesh();

    this.timeout(10000);

    var onEventRef;

    mesh.initialize(config, function(err) {

      if (err) {
        console.log(err.stack);
        done(err);
      }else{

        mesh.event.component1.on('maximum-pings-reached', function(message, meta){

          console.log(message.m);

          //console.log(mesh.api.event.component1.off.toString());
          mesh.event.component1.off(onEventRef, function(err){
            if (err)
             console.log('Couldnt detach from event maximum-pings-reached');

            console.log('Detaching from maximum-pings-reached');
            //console.log(done);
            done(err);
          });

        }, function(err, ref){
          if (err){
             console.log('Couldnt attach to event maximum-pings-reached');
             done(err);
          }else{
            //we have attached our events, now we start the mesh
            console.log('attached on ok, ref: ' + ref);
            onEventRef = ref;
            //console.log(mesh.api.data.events);
            mesh.start(function(err) {
               if (err) {
                console.log('Failed to start mesh');
                done(err);
              }
            });
          }
        });
      }
    });
  });
});









