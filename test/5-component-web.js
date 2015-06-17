var request = require('request');
var testport = 8080;


describe('Demonstrates the middleware functionality', function(done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached
  var Mesh = require('../lib/system/mesh');

  var maximumPings = 1000;

  var config = {
    name:"testMiddleware",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'info|error|warning',
      port:testport
    }
  };

  var mesh = Mesh();

  it('starts the mesh, loads the middleware module - which loads the browser plugin', function(done) {

    this.timeout(15000);

    function getBody(url, done){
      console.log('connecting to ' + url);
      require('request')({uri:url,
       method:'GET'
      }, 
      function(e, r, b){

        if (!e){
          done(null, b);
        }else
          done(e);
  
      });
    }

    mesh.initialize(config, function(err) {
      if (err) {
        console.log(err.stack);
        done(err);
      }else{
        getBody('http://127.0.0.1:' + testport + '/testMiddleware/api/client', function(e, body){
          if (e) return done(e);
          
          if (body.substring(0, 11) != '// mesh api')
            return done('Invalid return - expecting the body to start with "// mesh api"');

          getBody('http://127.0.0.1:' + testport + '/testMiddleware/api/app/describe.html', function(e, body){

            if (body.substring(0, 19) != '<!--API DESCRIBE-->')
            return done('Invalid return - expecting the body to start with "<!--API DESCRIBE-->"');

            done();
          });
        });
      }
    });
  });
});