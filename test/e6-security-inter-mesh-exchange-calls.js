/**
 * Created by nomilous on 2016/07/31.
 */

//TODO: test either incomplete or not started
// secure->insecure - not tested
// insecure->secure - timing out for allowed, access denied for not allowed
// secure->secure - timing out on access denied

var path = require('path');
var filename = path.basename(__filename);
var should = require('chai').should();
var Happner = require('../');
var shortid = require('shortid');
var fs = require('fs');
var Promise = require('bluebird');

var testId = shortid.generate();
var testId2 = shortid.generate();
var dbFileName = __dirname + path.sep + 'temp/' + testId + '.nedb';
var dbFileName2 = __dirname + path.sep + 'temp/' + testId2 + '.nedb';
var secureMesh;
var mesh2;

var SECURE = true;

// DONE - from insecure mesh to secure mesh
// TODO - from secure mesh to secure mesh

describe.skipWindows = (process.platform === 'win32') ? describe.skip : describe;

// skip for issue 223
describe.skipWindows(filename, function () {

  this.timeout(20000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  before('start secureMesh', function (done) {

    Happner.create({
      name: 'secureMesh',
      datalayer: {
        secure: SECURE,
        adminPassword: testId,
        filename: dbFileName
      },
      modules: {
        'service-name': {
          instance: {
            method1: function (callback) {
              console.log('\nmethod is run, but callback goes nowhere\n');
              callback(null, 'service-name/method1 ok');
            },
            method2: function (callback) {
              callback(null, 'service-name/method2 ok');
            }
          }
        },
        'x-service-name': {
          instance: {
            method1: function (callback) {
              callback(null, 'x-service-nam/method1 ok');
            }
          }
        }
      },
      components: {
        'service-name': {},
        'x-service-name': {}
      }
    }).then(function (_mesh) {
      secureMesh = _mesh;

      if (!SECURE) return done();

      var theGroup = {
        name: 'group',
        permissions: {
          methods: {
            '/secureMesh/service-name/method1': {authorized: true},
            // '/secureMesh/service-name/method2': {authorized: true} // <----- not allowed
            // '/secureMesh/x-service-name/method1': {authorized: true} // <----- not allowed
          }
        }
      };

      var theUser = {
        username: 'username',
        password: 'password'
      };

      var security = secureMesh.exchange.security;

      return Promise.all([
        security.addGroup(theGroup),
        security.addUser(theUser)
      ])
        .spread(function (group, user) {
          return security.linkGroup(group, user);
        })
        .then(function () {
          done();
        });

    }).catch(done);
  });

  after('stop mesh2', function (done) {
    // fs.unlink(dbFileName2, function(e) {
    //   if (mesh2) return mesh2.stop({reconnect: false}, done);
    //   done();
    // });
    if (mesh2) {
      mesh2.stop({reconnect: false}, done);
      return;
    }
    done();
  });

  after('stop secureMesh', function (done) {
    fs.unlink(dbFileName, function (e) {
      // ignore e
      if (secureMesh) {
        return secureMesh.stop({reconnect: false}, done);
      }
      done();
    })
  });

  before('start mesh2', function (done) {
    Happner.create({
      port: 55001,
      // datalayer: {
      //   secure: SECURE,
      //   adminPassword: testId2,
      //   filename: dbFileName2
      // },
      endpoints: {
        'secureMesh': {
          config: {
            host: '127.0.0.1',
            port: 55000,
            username: 'username',
            password: 'password',
            // secure: true
          }
        }
      }
    }).then(function (_mesh) {
      mesh2 = _mesh;
      done();
    }).catch(done);
  });


  xit('allows access to allowed function', function (done) {
    //
    // test times out... no callback from allowed method
    //                   (works if security is switched off)
    //
    mesh2.exchange.secureMesh['service-name'].method1()
      .then(function (result) {
        result.should.equal('service-name/method1 ok');
      })
      .then(done)
      .catch(done);
  });


  it('denies access to denied function', function (done) {
    mesh2.exchange.secureMesh['service-name'].method2()
      .then(function (result) {
        throw new Error('should have been denied');
      })
      .catch(function (e) {
        try {
          e.name.should.equal('AccessDenied');
          done();
        } catch (e) {
          done(e);
        }
      });
  });


  it('denies access to denied function with similar name to allowed function', function (done) {
    // mesh2.exchange.secureMesh['service-name'].method1() // almost identical name is allowed
    mesh2.exchange.secureMesh['x-service-name'].method1() // but this should denied
      .then(function (result) {
        throw new Error('should have been denied');
      })
      .catch(function (e) {
        try {
          e.name.should.equal('AccessDenied');
          done();
        } catch (e) {
          done(e);
        }
      });
  });


  // xit('allows access to allowed function from mesh client', function(done) {
  //   var client = new Happner.MeshClient({
  //   });
  // });


  require('benchmarket').stop();

});
