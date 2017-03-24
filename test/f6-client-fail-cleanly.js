var path = require('path');

describe(path.basename(__filename), function () {

  this.timeout(120000);

  var Mesh = require('../');

  var expect = require('expect.js');
  var libFolder = path.join(__dirname, 'lib');
  var Promise = require('bluebird');

  var serverMesh;

  after(function () {
    return serverMesh.stop();
  });

  var testClient;

  var config = require(path.join(libFolder, '6-remote-mesh-config'));

  function createMesh() {
    return Mesh.create(config)
      .then(function (meshInstance) {
        serverMesh = meshInstance;
      })
  }

  before(function () {
    return createMesh()
      .then(function () {
        testClient = new Mesh.MeshClient({port: 3111});
        return testClient.login({
          username: '_ADMIN',
          password: 'password'
        });
      });

  });

  it('stops the current happn client before creating a new one on login', function () {
    var currentData = testClient.data;
    expect(currentData.initialized).to.equal(true);
    return testClient.login({
      username: '_ADMIN',
      password: 'password'
    })
      .then(function () {
        var newData = testClient.data;
        expect(newData).to.not.equal(currentData);
        expect(currentData.initialized).to.equal(false);
        expect(currentData.pubsub).to.be(undefined);
        expect(newData.initialized).to.equal(true);
      });
  });

  it('has no client running if the login fails', function (done) {
    var newClient = new Mesh.MeshClient({port: 3111});
    testClient.disconnect()
      .then(function () {
        return newClient.login({
          username: '_ADMIN',
          password: 'bad_password'
        })
      })
      .catch(function (err) {
        expect(err.message).to.equal('Invalid credentials');
        expect(newClient.data).to.be(undefined);
        serverMesh.stop()
          .then(function () {
            return createMesh();
          })
          .then(function () {
            serverMesh._mesh.datalayer.server.services.pubsub.primus.on('connection', waitForNoConnection);

            setTimeout(function () {
              serverMesh._mesh.datalayer.server.services.pubsub.primus.removeListener('connection', waitForNoConnection);
              done();
            }, 5000);
          });

      });

    function waitForNoConnection() {
      serverMesh._mesh.datalayer.server.services.pubsub.primus.removeListener('connection', waitForNoConnection);
      done(new Error('The client should not try to connect anymore'));
    }
  });
});

