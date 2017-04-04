/**
 * Created by Simon on 02/04/2017.
 */

// Uses unit test 2 modules


describe('f8-client-revoke-session', function (done) {

  this.timeout(120000);

  //require('benchmarket').start();
  //after(//require('benchmarket').store());

  var Mesh = require('../');
  var http = require('http');
  var test_id = require('shortid').generate();
  var expect = require('expect.js');

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var config = {
    name: "middlewareMesh",
    datalayer: {
      secure: true,
      port: 15000,
      adminPassword: test_id
    },
    modules: {
      "middlewareTest": {
        path: libFolder + "f8-client-revoke-session"
      }
    },
    components: {
      "webmethodtest": {
        moduleName: "middlewareTest",
        web: {
          routes: {
            "method1": "method1",
            "method2": "method2"
          }
        }
      }
    }
  };

  var mesh;
  var adminClient;

  before(function (done) {
    mesh = new Mesh();
    mesh.initialize(config, function (err) {
      if (err) return done(err);
      mesh.start(done);
    });
  });

  after(function (done) {

    var finishDone = function(){
      if (mesh) mesh.stop(done);
      else done();
    };

    if (adminClient) return adminClient.disconnect(finishDone);
    finishDone();
  });

  var http = require('http');

  function doRequest(path, token, callback) {

    var request = require('request');

    var options = {
      url: 'http://127.0.0.1:15000' + path + '?happn_token=' + token,
    };

    request(options, function (error, response, body) {
      callback(error,response, body);
    });

  }

  it('logs in with the admin user - we then test a call to a web-method, then disconnects with the revokeToken flag set to true, we try and reuse the token and ensure that it fails', function (done) {


    adminClient = new Mesh.MeshClient({secure: true, port: 15000});

    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    };

    adminClient.login(credentials)
      .then(function () {

        var sessionToken = adminClient.token;

        doRequest('/webmethodtest/method1', sessionToken, function (err, response) {

          expect(response.statusCode).to.equal(200);

          adminClient.disconnect({revokeSession:true}, function(e){

            if (e) return done(e);

            doRequest('/webmethodtest/method1', sessionToken, function (err, response) {

              expect(response.statusCode).to.equal(403);

              done();
            });
          });
        });
      })

      .catch(function (e) {
        done(e);
      });

  });

  it('logs in with the websockets user - we then test a call to a web-method, then disconnects with the revokeToken flag not set, we try and reuse the token and ensure that it succeeds', function (done) {


    adminClient = new Mesh.MeshClient({secure: true, port: 15000});

    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    };

    adminClient.login(credentials)
      .then(function () {

        var sessionToken = adminClient.token;

        doRequest('/webmethodtest/method1', sessionToken, function (err, response) {

          expect(response.statusCode).to.equal(200);

          adminClient.disconnect(function(e){

            if (e) return done(e);

            doRequest('/webmethodtest/method1', sessionToken, function (err, response) {

              expect(response.statusCode).to.equal(200);

              done();
            });
          });
        });
      })

      .catch(function (e) {
        done(e);
      });

  });
});
