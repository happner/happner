/**
 * Created by Johan on 10/14/2015.
 */

// Uses unit test 2 modules
var should = require('chai').should();
var Mesh = require('../');
var http = require('http');


describe('c7-permissions-web', function (done) {

  this.timeout(20000);

  var defaultTimeout = (process.arch == 'arm') ? 50000 : 10000;

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var config = {
    name: "middlewareMesh",
    datalayer: {
      secure:true,
      port:10000
    },
    modules: {
      "middlewareTest": {
        path: libFolder + "c7-permissions-web"
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
      resp.statusCode.should.eql(403);
      done();
    })
  });

});
