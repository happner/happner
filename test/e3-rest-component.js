/**
 * Created by Johan on 10/14/2015.
 */

// Uses unit test 2 modules
var should = require('chai').should();
var Mesh = require('../');
var http = require('http');


describe('e3-rest-component', function (done) {

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(120000);

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var config = {
    name: "middlewareMesh",
    datalayer: {
      port: 10000
      //setOptions:{}
    }
  };

  var mesh;

  before(function (done) {

    Mesh.create(config, function (err, instance) {
      if (err) return done(err);
      mesh = instance;
      done();
    });

  });

  after(function (done) {
    mesh.stop({reconnect: false}, done);
  })


  it('can get index.html that middleware renames to index.htm', function (done) {
    http.get('http://localhost:10000/rest/describe', function (resp) {
      resp.statusCode.should.eql(200);
      done();
    })
  });

  require('benchmarket').stop();

});
