/* RUN: LOG_LEVEL=off mocha test/18-exchange-promises.js */

var Promise = require('bluebird');
var sep = require('path').sep;
var spawn = require('child_process').spawn;
module.exports = SeeAbove;

function SeeAbove() {
}

SeeAbove.prototype.method1 = function (opts, callback) {

  if (opts.errorAs == 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs == 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.method2 = function (opts, callback) {

  if (opts.errorAs == 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs == 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.method3 = function ($happn, $origin, opts, callback) {

  if (opts.errorAs == 'callback') return callback(new Error('THIS IS JUST A TEST'));
  if (opts.errorAs == 'throw') throw new Error('THIS IS JUST A TEST');

  opts.number++;
  callback(null, opts);
};

SeeAbove.prototype.synchronousMethod = function(opts, opts2){
  return opts + opts2;
};

SeeAbove.prototype.$happner = {
  config: {
    'testComponent': {
      schema: {
        methods: {
          'methodName1': {
            alias: 'ancientmoth'
          },
          'methodName2': {
            alias: 'ancientmoth'
          },
          'synchronousMethod': {
            type: 'sync-promise'//NB - this is how you can wrap a synchronous method with a promise
          }
        }
      }
    }
  }
};


if (global.TESTING_E8) return; // When 'requiring' the module above,

describe('e8-session-tokens', function () {

  /**
   * Simon Bishop
   * @type {expect}
   */

  // Uses unit test 2 modules
  var expect = require('expect.js');
  var Mesh = require('../');
  var libFolder = __dirname + sep + 'lib' + sep;

  //var REMOTE_MESH = 'e2-remote-mesh';
  var REMOTE_MESH = 'e3-remote-mesh-secure';

  var ADMIN_PASSWORD = 'ADMIN_PASSWORD';

  require('benchmarket').start();
  after(require('benchmarket').store());

  this.timeout(120000);

  var mesh;
  var remote;

  var startRemoteMesh = function(callback){

    var timedOut = setTimeout(function(){
      callback(new Error('remote mesh start timed out'));
    },5000);

    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + REMOTE_MESH]);

    remote.stdout.on('data', function (data) {

      if (data.toString().match(/READY/)) {

        clearTimeout(timedOut);

        setTimeout(function(){
          callback();
        },1000);
      }
    });
  };

  var login = function(done, credentials){

    var restClient = require('restler');

    var operation = {
      username:'_ADMIN',
      password:ADMIN_PASSWORD
    };

    if (credentials) operation = credentials;

    restClient.postJson('http://localhost:10000/rest/login', operation).on('complete', function(result){
      if (result.error) return done(new Error(result.error.message));
      done(null, result);
    });
  };

  before(function (done) {

    global.TESTING_E8 = true; //.............

    Mesh.create({
      name:'e3b-test',
      datalayer:{
        secure:true,
        adminPassword: ADMIN_PASSWORD,
        port: 10000,
        services:{
          security:{
            profiles:[
              {
                name:"rest-device",
                session:{
                  $and:[{ //filter by the security properties of the session - check if this session user belongs to a specific group
                    user:{groups:{
                      "REST_DEVICES" : { $exists: true }
                    }},
                    type:{$eq:0} //token stateless
                  }]},
                policy: {
                  ttl: 2000//stale after 2 seconds
                }
              },{
                name:"trusted-device",
                session:{
                  $and:[{ //filter by the security properties of the session, so user, groups and permissions
                    user:{groups:{
                      "TRUSTED_DEVICES" : { $exists: true }
                    }},
                    type:{$eq:1} //stateful connected device
                  }]},
                policy: {
                  ttl: 2000,//stale after 2 seconds
                  permissions:{//permissions that the holder of this token is limited, regardless of the underlying user
                    '/TRUSTED_DEVICES/*':{actions: ['*']}
                  }
                }
              }
            ]
          }
        }
      },
      modules: {
        'testComponent': {
          path: __filename   // .............
        }
      },
      components: {
        'testComponent': {}
      }
    }, function (err, instance) {

      delete global.TESTING_E8; //.............
      mesh = instance;

      if (err) return done(err);

      mesh.exchange.remoteMesh.remoteComponent.remoteFunction('one','two','three', function(err, result){
        if (err) return done(err);
        done();
      });
    });
  });

  after(function (done) {

    this.timeout(30000);

    if (remote) remote.kill();
    if (mesh) mesh.stop({reconnect: false}, done);

  });

  it('tests the rest components describe method over the api', function(done){

    var restClient = require('restler');

    login(function(e, result){

      if (e) return done(e);

      restClient.get('http://localhost:10000/rest/describe?happn_token=' + result.data.token).on('complete', function(result){

        expect(result.data['/testComponent/method1']).to.not.be(null);
        expect(result.data['/testComponent/method2']).to.not.be(null);

        done();
      });
    });
  });

  it('tests posting an operation to a local method', function(done){

    //TODO login function gives us a token, token is used in body of rest request

    login(function(e, result){

      if (e) return done(e);

      var restClient = require('restler');

      var operation = {
        parameters:{
          'opts':{'number':1}
        }
      };

      restClient.postJson('http://localhost:10000/rest/method/testComponent/method1?happn_token=' + result.data.token, operation).on('complete', function(result){
        expect(result.data.number).to.be(2);
        done();
      });
    });
  });

  it('tests posting an operation to the security component fails', function(done){

    //TODO login function gives us a token, token is used in body of rest request

    login(function(e, result){

      if (e) return done(e);

      var restClient = require('restler');

      var operation = {
        parameters:{
          'username':'_ADMIN',
          'password':'blah'
        }
      };

      restClient.postJson('http://localhost:10000/rest/method/security/updateOwnUser?happn_token=' + result.data.token, operation).on('complete', function(result){
        expect(result.error.number).to.not.be(null);
        expect(result.error.message).to.be('attempt to access security component over rest');
        done();
      });
    });
  });

  it('creates a test user, fails to log in, add group with web permission and log in ok', function (done) {

    var testAdminClient = new Mesh.MeshClient({secure: true, port: 10000});

    var testGroup = {
      name: 'REST',
      permissions: {
        methods: {
          '/testComponent/method1':{authorized:true}
        },
        web: {
          '/rest/describe':{actions: ['get'], description: 'rest describe permission'},
          '/rest/api':{actions: ['post'], description: 'rest post permission'}
        }
      }
    };

    var testGroupSaved;
    var testUserSaved;

    var credentials = {
      username: '_ADMIN', // pending
      password: ADMIN_PASSWORD
    };

    testAdminClient.login(credentials).then(function () {

      testAdminClient.exchange.security.addGroup(testGroup, function (e, result) {

        if (e) return done(e);

        testGroupSaved = result;

        var testUser = {
          username: 'RESTTEST',
          password: 'REST_TEST'
        };

        testAdminClient.exchange.security.addUser(testUser, function (e, result) {

          if (e) return done(e);
          testUserSaved = result;

          testAdminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {

            if (e) return done(e);

            login(function(e, response){

              if (e) return done(e);

              var token = response.data.token;
              var restClient = require('restler');

              restClient.get('http://localhost:10000/rest/describe?happn_token=' + token).on('complete', function(result){

                expect(result.data['/security/updateOwnUser']).to.be(undefined);
                expect(result.data['/remoteMesh/security/updateOwnUser']).to.be(undefined);

                expect(result.data['/testComponent/method1']).to.not.be(null);
                expect(result.data['/testComponent/method2']).to.be(undefined);

                expect(Object.keys(result.data).length).to.be(1);

                var operation = {
                  parameters:{
                    'opts':{number:1}
                  }
                };

                restClient.postJson('http://localhost:10000/rest/method/testComponent/method1?happn_token=' + token, operation).on('complete', function(result){

                  expect(result.data.number).to.be(2);

                  done();
                });

              });

            }, testUser);

          });

        });
      });

    }).catch(done);

  });

  it('creates a test user, logs in, but fails to access a method via REST', function (done) {

    var testAdminClient = new Mesh.MeshClient({secure: true, port: 10000});

    var testGroup = {
      name: 'REST-2',
      permissions: {
        methods: {
          '/remoteMesh/remoteComponent/remoteFunction':{authorized:true},
          '/testComponent/method2':{authorized:true}
        },
        web: {
          '/rest/describe':{actions: ['get'], description: 'rest describe permission'},
          '/rest/api':{actions: ['post'], description: 'rest post permission'}
        }
      }
    };

    var testGroupSaved;
    var testUserSaved;

    var credentials = {
      username: '_ADMIN', // pending
      password: ADMIN_PASSWORD
    };

    testAdminClient.login(credentials).then(function () {

      testAdminClient.exchange.security.addGroup(testGroup, function (e, result) {

        if (e) return done(e);

        testGroupSaved = result;

        var testRESTUser = {
          username: 'RESTTEST2',
          password: 'REST_TEST2'
        };

        testAdminClient.exchange.security.addUser(testRESTUser, function (e, result) {

          if (e) return done(e);
          testUserSaved = result;

          testAdminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {

            if (e) return done(e);

            login(function(e, response){

              if (e) return done(e);

              var token = response.data.token;
              var restClient = require('restler');

              var operation = {
                parameters:{
                  'opts':{
                    number:1
                  }
                }
              };

              //this call fails
              restClient.postJson('http://localhost:10000/rest/method/testComponent/method1?happn_token=' + token, operation).on('complete', function(result){

                expect(result.error).to.not.be(null);
                expect(result.error.message).to.be('Access denied');

                var operation = {
                  parameters:{
                    'opts':{
                      number:1
                    }
                  }
                };

                //this call works
                restClient.postJson('http://localhost:10000/rest/method/testComponent/method2?happn_token=' + token, operation).on('complete', function(result){

                  expect(result.error).to.be(null);
                  expect(result.data.number).to.be(2);

                  testGroup.permissions.methods['/testComponent/method2'] = {authorized:false};

                  testAdminClient.exchange.security.updateGroup(testGroup, function (e, result) {

                    if (e) return done(e);

                    var operation = {
                      parameters:{
                        'opts':{
                          number:1
                        }
                      }
                    };

                    //this call stops working
                    restClient.postJson('http://localhost:10000/rest/method/testComponent/method2?happn_token=' + token, operation).on('complete', function(result){

                      expect(result.error).to.not.be(null);
                      expect(result.error.message).to.be('Access denied');

                      done();

                    });
                  });
                });
              });

            }, testRESTUser);

          });

        });
      });

    }).catch(done);

  });

  require('benchmarket').stop();

});
