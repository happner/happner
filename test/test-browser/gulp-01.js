var gulp = require('gulp');
var Server = require('karma').Server;
var Happner = require('../../');
var Promise = require('bluebird');
var mesh;

/**
 * Run test once and exit
 */

gulp.task('start', function (done) {

  function TestComponent() {
  }

  TestComponent.prototype.method1 = function ($happn, args, callback) {

    // var e = new Error('xxx');
    // console.log(e.stack);

    // console.log('1 ARGS', args);
    // console.log('1 CALLBACK', callback);

    callback = args; // callback comes in position1

    callback(null, 'result1');
  };

  TestComponent.prototype.method2 = function ($happn, args, callback) {
    // console.log('1 ARGS', args);
    // console.log('1 CALLBACK', callback);

    callback(null, 'result2');
  };

  TestComponent.prototype.doEmit = function ($happn, args, callback) {
    $happn.emit('test-emmission', args);
    callback();
  };

  TestComponent.prototype.allowedMethod = function($origin, input, callback, $happn) { // "max-nasty" injection
    input.meshName = $happn.info.mesh.name;
    input.originUser = $origin.username;
    callback(null, input);
  };

  TestComponent.prototype.deniedMethod = function(input, callback) {
    callback(null, input);
  };

  var testComponent = new TestComponent();

  var meshConfig = {
    name: 'Server',
    datalayer: {
      secure: true,
      adminPassword: 'xxx',
      encryptPayloads: true
    },
    modules: {
      test: {
        instance: testComponent
      }
    },
    components: {
      test: {
        moduleName: 'test'
      }
    }
  };

  Happner.create(meshConfig)

    .then(function(_mesh) {
      mesh = _mesh;
    })

    .then(function() {
      var security = mesh.exchange.security;
      return Promise.all([
        security.addGroup({
          name: 'group',
          permissions: {
            events: {},
            // data: {},
            methods: {
              '/Server/test/allowedMethod': {authorized: true}
            }
          }
        }),
        security.addUser({
          username: 'username',
          password: 'password'
        })
      ]).spread(function(group, user) {
        return security.linkGroup(group, user);
      });
    })

    .then(function() {
      var karma = new Server({
        configFile: __dirname + '/01.karma.conf.js',
        singleRun: true
      }, done);
      karma.start();
    })

    .catch(done);
});


gulp.task('default', ['start'], function(done) {
  mesh.stop({reconnect: false}, done);
  process.exit(0); // ? stopping gulp
});
