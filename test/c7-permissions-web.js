/**
 * Created by Johan on 10/14/2015.
 */

// Uses unit test 2 modules


describe('c7-permissions-web', function (done) {

  this.timeout(120000);

  //require('benchmarket').start();
  //after(//require('benchmarket').store());

  var should = require('chai').should();
  var Mesh = require('../');
  var http = require('http');
  var test_id = require('shortid').generate();
  var expect = require('expect.js');

  var defaultTimeout = (process.arch == 'arm') ? 50000 : 15000;

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var config = {
    name: "middlewareMesh",
    datalayer: {
      secure: true,
      port: 15000,
      adminPassword: test_id,
      middleware: {
        security: {
          exclusions: [
            '/webmethodtest/test/excluded/specific',
            '/webmethodtest/test/excluded/wildcard/*',
          ]
        }
      }
    },
    modules: {
      "middlewareTest": {
        path: libFolder + "c7-permissions-web"
      }
    },
    components: {
      "webmethodtest": {
        moduleName: "middlewareTest",
        // scope: "component",//either component(mesh aware) or module - default is module
        schema: {
          "exclusive": false,//means we dont dynamically share anything else
          "methods": {}
        },
        web: {
          routes: {
            "test/excluded/specific": ["excludedSpecific"],
            "test/excluded/wildcard/blah": ["excludedWildcard"],
          }
        }
      },
      "www": { // <------------------- because of www, routes.static goes /
        moduleName: "middlewareTest",
        // scope: "component",//either component(mesh aware) or module - default is module
        schema: {
          "exclusive": false,//means we dont dynamically share anything else
          "methods": {}
        },
        web: {
          routes: {
            "static": ["checkIndex", "static"]
          }
        }
      }
    }
  };

  var mesh;

  before(function (done) {
    mesh = new Mesh();
    mesh.initialize(config, function (err) {
      if (err) return done(err);
      mesh.start(done);
    });
  });

  after(function (done) {
    mesh.stop({reconnect: false}, done);
  });

  var http = require('http');

  function doRequest(path, token, callback) {

    var request = require('request');

    var options = {
      url: 'http://127.0.0.1:15000' + path + '?happn_token=' + token,
    };

    request(options, function (error, response, body) {
      callback(response);
    });

  }


  it('fails to access a file, missing the token', function (done) {

    doRequest('/index.html', null, function (response) {

      expect(response.statusCode).to.equal(403);
      done();

    });

  });

  var adminClient = new Mesh.MeshClient({secure: true, port: 15000});

  it('logs in wth the admin user, we have a token - we can access the file', function (done) {

    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    };

    adminClient.login(credentials).then(function () {

      doRequest('/index.html', adminClient.token, function (response) {

        expect(response.statusCode).to.equal(200);
        done();

      });

    }).catch(done);

  });

  it('it tests the specific exclusion', function (done) {

    doRequest('/webmethodtest/test/excluded/specific', null, function (response) {

      expect(response.statusCode).to.equal(200);
      done();

    });

  });

  it('it tests the wildcard exclusion', function (done) {

    doRequest('/webmethodtest/test/excluded/wildcard/blah', null, function (response) {

      expect(response.statusCode).to.equal(200);
      done();

    });

  });

  it('creates a test user, fails to log in, add group with web permission and log in ok', function (done) {

    var testGroup = {
      name: 'TESTUSER_' + test_id,

      custom_data: {
        customString: 'custom1',
        customNumber: 0
      },

      permissions: {
        web: {}
      }
    };

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    };

    adminClient.login(credentials).then(function () {

      adminClient.exchange.security.addGroup(testGroup, function (e, result) {

        if (e) return done(e);

        testGroupSaved = result;

        var testUser = {
          username: 'TEST_USER' + test_id,
          password: 'TEST PWD',
          custom_data: {
            something: 'useful'
          }
        };

        adminClient.exchange.security.addUser(testUser, function (e, result) {

          if (e) return done(e);
          testUserSaved = result;

          adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {
            //we'll need to fetch user groups, do that later
            if (e) return done(e);

            testUserClient = new Mesh.MeshClient({secure: true, port: 15000});

            testUserClient.login(testUser).then(function () {

              doRequest('/index.html', testUserClient.token, function (response) {

                expect(response.statusCode).to.equal(403);

                testGroupSaved.permissions.web = {
                  '/index.html': {actions: ['get', 'put', 'post'], description: 'a test web permission'}
                };

                adminClient.exchange.security.updateGroup(testGroupSaved, function (e, updated) {

                  if (e) return done(e);

                  doRequest('/index.html', testUserClient.token, function (response) {

                    expect(response.statusCode).to.equal(200);
                    done();

                  });
                });
              });

            }).catch(function (e) {
              done(e);
            });

          });

        });
      });
    }).catch(done);

  });

  it('creates a test user, fails to log in, upsert a group with web permission and log in ok', function (done) {

    var testGroup = {
      name: 'TESTUSER_UPSERT' + test_id,

      custom_data: {
        customString: 'custom1',
        customNumber: 0
      },

      permissions: {
        web: {}
      }
    }

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    };

    adminClient.login(credentials).then(function () {

      adminClient.exchange.security.addGroup(testGroup, function (e, result) {

        if (e) return done(e);

        testGroupSaved = result;

        var testUser = {
          username: 'TEST_USER_UPSERT' + test_id,
          password: 'TEST PWD',
          custom_data: {something: 'useful'}
        };

        adminClient.exchange.security.addUser(testUser, function (e, result) {

          if (e) return done(e);
          testUserSaved = result;

          adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {
            //we'll need to fetch user groups, do that later
            if (e) return done(e);

            testUserClient = new Mesh.MeshClient({secure: true, port: 15000});

            testUserClient.login(testUser).then(function () {

              doRequest('/index.html', testUserClient.token, function (response) {

                expect(response.statusCode).to.equal(403);

                testGroupSaved.permissions.web = {
                  '/index.html': {actions: ['get', 'put', 'post'], description: 'a test web permission'}
                };

                adminClient.exchange.security.upsertGroup(testGroupSaved, function (e) {

                  if (e) return done(e);

                  doRequest('/index.html', testUserClient.token, function (response) {

                    expect(response.statusCode).to.equal(200);
                    done();

                  });
                });
              });

            }).catch(function (e) {
              done(e);
            });

          });

        });
      });

    }).catch(done);
  });

  it('creates a test user, gets the token and accesses a resource successfully, then deletes the user and is unable to access the resource', function (done) {

    var testGroup1 = {
      name: 'TESTUSER_UPSERT1' + test_id,

      custom_data: {
        customString: 'custom1',
        customNumber: 0
      },

      permissions: {
        web: {
          '/index.html': {actions: ['get', 'put', 'post'], description: 'a test web permission'}
        }
      }
    };

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    };

    adminClient.login(credentials).then(function () {

      adminClient.exchange.security.addGroup(testGroup1, function (e, result) {

        if (e) return done(e);

        testGroupSaved = result;

        var testUser = {
          username: 'TEST_USER_UPSERT1' + test_id,
          password: 'TEST PWD',
          custom_data: {something: 'useful'}
        };

        adminClient.exchange.security.addUser(testUser, function (e, result) {

          if (e) return done(e);
          testUserSaved = result;

          adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {
            //we'll need to fetch user groups, do that later
            if (e) return done(e);

            testUserClient = new Mesh.MeshClient({secure: true, port: 15000});

            testUserClient.login(testUser).then(function () {

              doRequest('/index.html', testUserClient.token, function (response) {

                expect(response.statusCode).to.equal(200);

                adminClient.exchange.security.deleteUser(testUserSaved, function(e){

                  if (e) return done(e);

                  doRequest('/index.html', testUserClient.token, function (response) {

                    expect(response.statusCode).to.equal(403);
                    done();

                  });
                });
              });

            }).catch(function (e) {
              done(e);
            });

          });

        });
      });

    }).catch(done);

  });

  //require('benchmarket').stop();

});
