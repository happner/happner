describe('b3 - secure mesh to mesh fails', function () {

  //require('benchmarket').start();
  //after(//require('benchmarket').store());

  context('secure mesh to mesh fails', function () {

    var spawn = require('child_process').spawn
      , sep = require('path').sep
      , remote
      , assert = require('assert')
      , mesh
      , Mesh = require('../')

    var sep = require('path').sep;
    var libFolder = __dirname + sep + 'lib' + sep;

    var config = {
      name: 'mesh2',
      dataLayer: {
        secure: true,
        port: 51233
      },
      endpoints: {
        remoteMesh: {  // remote mesh node
          config: {
            port: 51231,
            username: '_ADMIN',
            password: 'thispasswordwontwork' // TODO This was necessary, did not default
          }
        }
      },
      modules: {},
      components: {}
    };

    after(function (done) {
      remote.kill();
      mesh.stop({reconnect: false}, function (e) {
        // console.log('killed ok 1:::', remote.pid);
        done();
      });
    });

    this.timeout(120000);

    it("cannot connect endpoint - mesh start fails", function (done) {

      var _this = this;

      // spawn remote mesh in another process
      remote = spawn('node', [libFolder + 'b3-first-mesh']);

      remote.stdout.on('data', function (data) {

        // console.log(data.toString());

        if (data.toString().match(/READY/)) {

          // console.log('remote ready 1:::', remote.pid);

          mesh = new Mesh();

          // console.log('starting this one', mesh, config);
          // mesh.initialize(config, function(err) {
          mesh.initialize(config, function (e) {

            if (!e) return done(new Error('this should not have been possible'));

            assert(e.toString() == 'AccessDenied: Invalid credentials');

            done();

          });
        }

      });
    });

  });

  //require('benchmarket').stop();

});
