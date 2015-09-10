var should = require('chai').should();
var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;

describe('Consumes an external module', function() {

  require('./lib/0-hooks')();

  var mesh;

  var config = {
    name:"testSubMethodsMesh",
    modules: {
      "subMethodModule":{
        path:"../lib/19-submethod-calls-module"
      }
    },
    components: {
      "subMethodModuleComponent":{
        moduleName:"testSubMethodsMesh",
        // scope:"module", //"either component or module, module by default"
        schema:{
          "exclusive":false,//means we dont dynamically share anything else
        }
      }
    },
  };


  it('starts a local mesh', function(done) {

    this.timeout(10000);

    // created in lib/0-hooks.js
    mesh = this.Mesh();
   
    mesh.initialize(config, function(err) {

      if (err) {
        console.log('failure in init')
        console.log(err.stack)
      };

      done(err);

    });

  });

  it('starts a local mesh, with a single component that wraps the happn client module and compares the response with a happn client instantiated outside of the mesh', function(done) {

    var _this = this;

    //we require a 'real' happn client
    require('happn').client.create({config:{"host":"localhost", "secret":"mesh"}}, function(e, client){
      
      if (e) {
        console.log('real client init failure');
        done(e);
      }

      client.set('/mytest/678687', {"test":"test1"}, {}, function(e, directClientResponse){
        //calling a local component
        mesh.api.exchange.happnClient.set('/mytest/678687', {"test":"test1"}, {}, function(e, response){
         
          response.payload.data.test.should.eql(directClientResponse.payload.data.test);

          if (e) 
            return done(e);

         //calling a local component as if it was on another mesh
         mesh.api.exchange.testMesh.happnClient.set('/mytest/678687', {"test":"test1"}, {}, function(e, response){
           
            response.payload.data.test.should.eql(directClientResponse.payload.data.test);

            if (e) return done(e);

            //doing the same call using a post to the api
            mesh.api.post('/happnClient/set', '/mytest/678687', {"test":"test1"}, {}, function(e, response){
              
              response.payload.data.test.should.eql(directClientResponse.payload.data.test);
              //console.log({response: response});
              //test aliases
              mesh.api.exchange.testMesh.happnClient.PUT('/mytest/678687', {"test":"test1"}, {}, function(e, response){

                response.payload.data.test.should.eql(directClientResponse.payload.data.test);

                return done(e);
              });
            });
          });
        });
      });     
    });
  });

  it('should expose a data layer that is a happn client, local to the mesh', function (done) {

    var _this = this;

    mesh.api.data.on('/mytest/datalayer/test', {event_type:'set', count:1}, function (message) {
      message.payload.data.value.should.eql(10);
      done();
    }, function(e){
      if (e) return done(e);
      mesh.api.exchange.happnClient.set('/mytest/datalayer/test', {"value":10}, {}, function(e, response){
        if (e) done(e);
      });
    });
  });

});