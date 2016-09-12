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

  // require('benchmarket').start();
  // after(require('benchmarket').store());

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
                  ttl: '2 seconds'//stale after 2 seconds
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
                  ttl: 4000,//stale after 4 seconds
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

  xit('tests the rest component with a managed profile, ttl times out', function(done){

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

  xit('tests the rest component with a managed profile, only able to access a trusted path', function(done){

  });

  xit('tests the rest component, ensures listing of ', function(done){

  });

  //require('benchmarket').stop();

});
