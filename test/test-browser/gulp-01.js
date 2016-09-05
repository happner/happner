var gulp = require('gulp');
var Server = require('karma').Server;
var Mesh = require('../../lib/mesh');
var mesh;

/**
 * Run test once and exit
 */
gulp.task('default', function (done) {

  function TestComponent() {
  }

  TestComponent.prototype.method1 = function ($happn, args, callback) {

    // var e = new Error('xxx');
    // console.log(e.stack);

    // console.log('1 ARGS', args);
    // console.log('1 CALLBACK', callback);

    callback = args; // callback comes in position1

    callback(null, 'result1');
  }

  TestComponent.prototype.method2 = function ($happn, args, callback) {
    // console.log('1 ARGS', args);
    // console.log('1 CALLBACK', callback);

    callback(null, 'result2');
  }

  TestComponent.prototype.doEmit = function ($happn, args, callback) {
    $happn.emit('test-emmission', args);
    callback();
  }

  var testComponent = new TestComponent();

  var meshConfig = {
    datalayer:{
      secure:true,
      adminPassword: 'happn',
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
    },
    services: {
      security: {
        config: {
          adminPassword:'happn',
          keyPair: {
            privateKey: 'Kd9FQzddR7G6S9nJ/BK8vLF83AzOphW2lqDOQ/LjU4M=',
            publicKey: 'AlHCtJlFthb359xOxR5kiBLJpfoC2ZLPLWYHN3+hdzf2'
          }
        }
      }
    }
  }

  Mesh.create(meshConfig, function (e, instance) {

    if (e) return done(e);
    mesh = instance;

    new Server({
      configFile: __dirname + '/01.karma.conf.js',
      singleRun: true
    }, done).start();

  });

});
