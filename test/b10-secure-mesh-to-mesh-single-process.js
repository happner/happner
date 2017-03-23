var path = require('path');
var remoteConfig = require('./lib/b2-first-mesh-config');
var assert = require('assert');
var Mesh = require('..');

describe(path.basename(__filename), function () {

  //require('benchmarket').start();
  //after(//require('benchmarket').store());

  context('on remote mesh', function () {

    var remoteMesh;
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
            password: 'testb2' // TODO This was necessary, did not default
          }
        }
      },
      modules: {},
      components: {}
    };

    this.timeout(120000);

    before(function () {

      return Mesh.create(remoteConfig)
        .then(function (createdMesh) {
          remoteMesh = createdMesh;
        })
        .then(function () {
          return Mesh.create(config);
        })
        .then(function (createdMesh) {
          mesh = createdMesh;
        })

    });


    after(function (done) {
      remoteMesh.stop({reconnect: false})
        .then(function () {
          return mesh.stop({reconnect: false})
        })
        .then(function () {
          done();
        })
        .catch(done);
    });

    it("can call remote component function", function (done) {

      mesh.event.remoteMesh.remoteComponent.on(
        'whoops',
        function handler(data) {
          console.log(data);
          done();
        },
        function callback(err) {
          if (err) done(err);
        }
      );

      mesh.exchange.remoteMesh.remoteComponent.remoteFunction(
        'one!', 'two!', 'three!', function (err, res) {

          assert(res == 'one! two! three!, wheeeeeeeeeeeeheeee!');

        });
    });

    it('we know when there was an accident', function (done) {

      mesh.exchange.remoteMesh.remoteComponent.causeError(function (err, res) {

        assert(err.toString().match(/ErrorType: Error string/));
        done();

      });

    });

  });

  //require('benchmarket').stop();

});
