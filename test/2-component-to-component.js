// Object.keys(require.cache).forEach(function(key) {
//   delete require.cache[key]
// });

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;
var maximumPings = 1000;
var libFolder ;
var should = require('chai').should();

describe('Bounces a message between two components, demonstrates how the events layer works', function(done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached

  require('./lib/0-hooks')();

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

  var mesh;

  it('starts the mesh, listens for the ping pong completed event, that module1 emits', function(done) {
    
    mesh = this.Mesh();

    this.timeout(10000);

    var onEventRef;

    mesh.initialize(config, function(err) {

      if (err) {
        console.log(err.stack);
        done(err);
      }else{

        mesh.api.event.component1.on('maximum-pings-reached', function(message){

          //console.log(mesh.api.event.component1.off.toString());
          mesh.api.event.component1.off(onEventRef, function(err){
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
  
  it('subscribes to an event and unsubscribes after the first one', function(done) {
    var testHandle;
    var eventCount = 0;
    var eventCount2 = 0;

    mesh.api.event.component1.on('eventMultiple', function firstSub(){
      eventCount2++;
    },function(err,handle) {
    });
    
    mesh.api.event.component1.on('eventMultiple', function secondSub (){
      eventCount++;
      // this unsubscribes both which is why I think the original scheme was based on the subscription handle
      // maybe using the function name (or pointer) we can unsubscribe the desired subscription.
      mesh.api.event.component1.off('eventMultiple', function(err) {
        should.not.exist(err);
      });
    },function(err,handle) {
      should.not.exist(err);
      testHandle = handle;
      mesh.api.exchange.component1.testEventMultiple();      
    });
    
    mesh.api.event.component1.on('eventMultipleComplete', function() {
      eventCount.should.eql(1);
      eventCount2.should.eql(4);
      done();
    }, function(err){
      should.not.exist(err);
    });   
    
  });
});









