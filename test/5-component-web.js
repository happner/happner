var request = require('request');
var testport = 8080;
var fs = require('fs');
var should = require('chai').should();
var Mesh = require('../');
var mesh;


describe('Demonstrates the middleware functionality', function (done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached

  this.timeout(20000);

  var config = {
    name: "testMiddleware",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'info|error|warning',
      port: testport
    },
    modules: {
      "module5": {
        path: __dirname + "/lib/5-module-middleware",
        construct:{
          type:"sync"
        }
      }
    },
    components: {
      "component5": {
        moduleName: "module5",
        // "scope":"component",
        schema: {
          exclusive: false
        },
        web: {
          routes: {
            // http://localhost:3001/neptronicUI/...
            "static5":["preProcessor","static"],
            "testScope":"testScope"
          }
        }
      },

      "component5Module": {
        moduleName: "module5",
        // "scope":"module",
        schema: {
          exclusive: false
        },
        web: {
          routes: {
            // http://localhost:3001/neptronicUI/...
            "testScope":"testScope"
          }
        }
      }
    }
  };

  before(function (done) {

    mesh = new Mesh();

    console.log('DOING BEFORE');

    mesh.initialize(config, function (err) {
      if (err) return done(err);

      console.log('INITIALIZED!!');
      done();

    });
  });

  after(function(done){
     mesh.stop(done);
  });


  it('starts the mesh, loads the middleware module - which loads the browser plugin', function (done) {

    getBody('http://127.0.0.1:' + testport + '/testMiddleware/api/client', function (e, body) {

      // console.log('boo d',body);
     return done(e);
    });
  });

  it('tests that we can do chain middleware in a module', function (done) {
    getBody('http://127.0.0.1:' + testport + '/component5/static5/test.html', function (e, body) {

      body.should.eql(fs.readFileSync(__dirname + '/lib/static5/preprocessed-test.html').toString());
      done(e);
    });

  });
  
  // it('tests that the scope is set to component', function(done) {
  //   request({uri:'http://127.0.0.1:' + testport + '/component5/testScope?scope=ComponentInstance', method:'GET'}, function (e, resp, body) {
  //     resp.statusCode.should.eql(200);
  //     done(e);
  //   });
  // });

  it('tests that the scope is set to module', function(done) {
    request({uri:'http://127.0.0.1:' + testport + '/component5Module/testScope?scope=ModuleFive', method:'GET'}, function (e, resp, body) {
      resp.statusCode.should.eql(200);
      done(e);
    });
  });
});

function getBody(url, done) {
  request({
      gzip: true,
      uri: url,
      method: 'GET'
    },
    function (e, r, b) {

      if (!e) {
        done(null, b);
      }
      else
        done(e);

    });
}
