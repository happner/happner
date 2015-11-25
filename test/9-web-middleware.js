/**
 * Created by Johan on 10/14/2015.
 */

// Uses unit test 2 modules
var should = require('chai').should();
var Mesh = require('../');
var http = require('http');


describe('tests that we can add middleware before a static', function (done) {

  this.timeout(20000);

  var defaultTimeout = (process.arch == 'arm') ? 50000 : 10000;

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var config = {
    name: "middlewareMesh",
    dataLayer: {
      authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
      systemSecret: 'mesh',
      log_level: 'error',
      port:10000
      //setOptions:{}
    },
    endpoints: {},
    modules: {
      "middlewareTest": {
        path: libFolder + "10-middleware"
      }
    },
    components: {
      "www": { // <------------------- because of www, routes.static goes /
        moduleName: "middlewareTest",
        // scope: "component",//either component(mesh aware) or module - default is module
        schema: {
          "exclusive": false,//means we dont dynamically share anything else
          "methods": {}
        },
        web: {
          routes: {
            "static": ["checkIndex","static"]
          }
        }
      }
    }
  };

  var mesh;

  before(function (done) {
    this.timeout(defaultTimeout);
    this.mesh = new Mesh();
    this.mesh.initialize(config, function (err) {
      if (err) return done(err);
      done();
    });
  });

  after(function (done) {
    this.mesh.stop(done);
  })


  it('can get index.html that middleware renames to index.htm', function (done) {
    this.timeout(defaultTimeout);
    http.get('http://localhost:10000/index.html', function(resp) {
      resp.statusCode.should.eql(200);
      done();
    })
  });

});
