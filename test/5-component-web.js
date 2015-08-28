var request = require('request');
var testport = 8080;
var fs = require('fs');
var should = require('chai').should();


describe('Demonstrates the middleware functionality', function (done) {
///events/testComponent2Component/component1/maximum-pings-reached
///events/testComponent2Component/component1/maximum-pings-reached

  require('./lib/0-hooks')();

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
        constructor: {
          type: "sync",
          parameters: []
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

    var mesh = this.Mesh();

    mesh.initialize(config, function (err) {
      if (err) {
        console.log(err.stack);
      }
      done(err);

    });
  });


  it('starts the mesh, loads the middleware module - which loads the browser plugin', function (done) {

    this.timeout(15000);


    getBody('http://127.0.0.1:' + testport + '/testMiddleware/api/client', function (e, body) {
      if (e) return done(e);

      if (body.substring(0, 11) != '// mesh api')
        return done('Invalid return - expecting the body to start with "// mesh api"');

      getBody('http://127.0.0.1:' + testport + '/testMiddleware/api/app/describe.html', function (e, body) {

        if (body.substring(0, 19) != '<!--API DESCRIBE-->')
          return done('Invalid return - expecting the body to start with "<!--API DESCRIBE-->"');

        done();
      });
    });
  });

  it.only('tests that we can do chain middleware in a module', function (done) {
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
  console.log('connecting to ' + url);
  request({
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
