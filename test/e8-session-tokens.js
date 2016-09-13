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
        profiles:[
          {
            name:"rest-device",
            session:{
              $and:[{ //filter by the security properties of the session - check if this session user belongs to a specific group
                user:{groups:{
                  REST_DEVICES : { $exists: true }
                }},
                type:{$eq:0} //token stateless
              }]},
            policy: {
              ttl: '2 seconds'//stale after 2 seconds
            }
          },{
            name:"trusted-device",
            session:{
              $and:[{ //filter by the security properties of the session, so user, groups and permissions
                user:{groups:{
                  "TRUSTED_DEVICES" : { $exists: true }
                }},
                type:{$eq:0} //stateless rest device
              }]},
            policy: {
              ttl: 4000,//stale after 4 seconds
              permissions:{//permissions that the holder of this token is limited, regardless of the underlying user
                '/_exchange/requests/e3b-test/testComponent/method3*':{actions: ['set']},
                '/_exchange/responses/e3b-test/testComponent/method3*':{actions: ['on']}
              }
            }
          }
        ]
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

      if (err) return done(err);
      delete global.TESTING_E8; //.............
      mesh = instance;
      done();
    });
  });

  // after(function (done) {
  //
  //   this.timeout(30000);
  //   if (mesh) mesh.stop({reconnect: false}, done);
  //
  // });

  it('tests the rest component with a managed profile, ttl times out', function(done){

    this.timeout(8000);

    var testAdminClient = new Mesh.MeshClient({secure: true, port: 10000});

    var testGroupSaved;
    var testUserSaved;

    var credentials = {
      username: '_ADMIN', // pending
      password: ADMIN_PASSWORD
    };

    var testGroup = {
      name: 'REST_DEVICES',
      permissions: {
        methods: {
          '/remoteMesh/remoteComponent/remoteFunction':{authorized:true},
          '/testComponent/method1':{authorized:true}
        },
        web: {
          '/rest/describe':{actions: ['get'], description: 'rest describe permission'},
          '/rest/api':{actions: ['post'], description: 'rest post permission'}
        }
      }
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

            login(function(e, result){

              if (e) return done(e);

              var restClient = require('restler');

              var operation = {
                parameters:{
                  'opts':{'number':1}
                }
              };

              var token =  result.data.token;

              restClient.postJson('http://localhost:10000/rest/method/testComponent/method1?happn_token=' + token, operation).on('complete', function(result){

                expect(result.data.number).to.be(2);

                setTimeout(function(){

                  restClient.postJson('http://localhost:10000/rest/method/testComponent/method1?happn_token=' + token, operation).on('complete', function(result) {

                    expect(result.message).to.be('expired session token');
                    done();
                  });

                }, 2100);

              });
            }, testRESTUser);
          });
        });
      });
    }).catch(done);


    // var restClient = require('restler');
    //
    // login(function(e, result){
    //
    //   if (e) return done(e);
    //
    //   restClient.get('http://localhost:10000/rest/describe?happn_token=' + result.data.token).on('complete', function(result){
    //
    //     expect(result.data['/testComponent/method1']).to.not.be(null);
    //     expect(result.data['/testComponent/method2']).to.not.be(null);
    //
    //     done();
    //   });
    // });
  });

  it('tests the rest component with a managed profile, only able to access a trusted path', function(done){

    this.timeout(8000);

    var testAdminClient = new Mesh.MeshClient({secure: true, port: 10000});

    var testGroupSaved;
    var testUserSaved;

    var credentials = {
      username: '_ADMIN', // pending
      password: ADMIN_PASSWORD
    };

    var testGroup = {
      name: 'TRUSTED_DEVICES',
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

    testAdminClient.login(credentials).then(function () {

      testAdminClient.exchange.security.addGroup(testGroup, function (e, result) {

        if (e) return done(e);

        testGroupSaved = result;

        var testRESTUser = {
          username: 'RESTTEST3',
          password: 'REST_TEST2'
        };

        testAdminClient.exchange.security.addUser(testRESTUser, function (e, result) {

          if (e) return done(e);
          testUserSaved = result;

          testAdminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {

            if (e) return done(e);

            login(function(e, result){

              if (e) return done(e);

              var restClient = require('restler');

              var operation = {
                parameters:{
                  'opts':{'number':1}
                }
              };

              var token =  result.data.token;

              restClient.postJson('http://localhost:10000/rest/method/testComponent/method3?happn_token=' + token, operation).on('complete', function(result){

                expect(result.data.number).to.be(2);

                setTimeout(function(){

                  restClient.postJson('http://localhost:10000/rest/method/testComponent/method2?happn_token=' + token, operation).on('complete', function(result) {

                    expect(result.message).to.be('token permissions limited');
                    done();
                  });

                }, 500);

              });
            }, testRESTUser);
          });
        });
      });
    }).catch(done);
  });

  require('benchmarket').stop();

});
