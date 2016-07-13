module.exports = TestMesh;

var DONE = false;

function TestMesh() {
}

TestMesh.prototype.method1 = function ($happn, callback) {
  setTimeout(function () {
    callback(null);
  }, 11000);
}

if (global.TESTING_D9 || global.TESTING_D9_1) return; // When 'requiring' the module above,
// don't run the tests below
//.............

describe('d9-client-timeout', function () {

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  var expect = require('expect.js');
  var defaultConfigMesh;
  var Mesh = require('../');
  var timeoutConfigMesh = new Mesh();

  var timeoutConfigClient = new Mesh.MeshClient({timeoutConfig: true, port: 8000});
  var defaultConfigClient = new Mesh.MeshClient({port: 8001});

  var test_id = Date.now() + '_' + require('shortid').generate();
  var async = require('async');

  before('starts a timeoutConfig mesh', function (done) {

    global.TESTING_D9 = true; //.............

    timeoutConfigMesh.initialize({
      name: 'd9-client-timeout-timeoutConfig',
      datalayer: {
        port: 8000,
        setOptions: {
          timeout: 15000
        }
      },
      modules: {
        'TestMesh': {
          path: __filename
        }
      },
      components: {
        'TestMesh': {
          moduleName: 'TestMesh',
          schema: {
            exclusive: false
          }
        }
      }
    }, function (err) {

      if (err) return done(err);
      timeoutConfigMesh.start(function (err) {
        if (err) {
          // console.log(err.stack);
          return done(err);
        }

        // Credentials for the login method
        var credentials = {
          username: '_ADMIN', // pending
          password: test_id
        }

        timeoutConfigClient.login(credentials).then(function () {
          done();
        }).catch(done);

      });
    });
  });

  before('starts the default configured mesh', function (done) {

    global.TESTING_D9_1 = true; //.............

    defaultConfigMesh = this.mesh = new Mesh();

    defaultConfigMesh.initialize({
      name: 'd9-client-timeout-defaultConfig',
      datalayer: {
        port: 8001
      },
      modules: {
        'TestMesh': {
          path: __filename
        }
      },
      components: {
        'TestMesh': {
          moduleName: 'TestMesh',
          schema: {
            exclusive: false
          }
        }
      }

    }, function (err) {

      if (err) return done(err);
      defaultConfigMesh.start(function (err) {
        if (err) {
          // console.log(err.stack);
          return done(err);
        }

        // Credentials for the login method
        var credentials = {
          port: 8001
        }

        defaultConfigClient.login(credentials).then(function () {
          done();
        }).catch(done);

      });
    });
  });

  after(function (done) {

    delete global.TESTING_D9_1;
    delete global.TESTING_D9;

    defaultConfigMesh.stop({reconnect: false}, function (e) {

      if (e) return done(e);

      timeoutConfigMesh.stop({reconnect: false}, done);

    });
  })

  it('runs a method on the timeout configured mesh', function (done) {

    timeoutConfigClient.exchange.TestMesh.method1(function (e, result) {

      if (e) return done(e);
      done();

    });

  });

  it('runs a method on the default configured mesh', function (done) {

    defaultConfigClient.exchange.TestMesh.method1(function (e, result) {

      expect(e).to.be("Request timed out");
      done();

    });

  });


  require('benchmarket').stop();

});
