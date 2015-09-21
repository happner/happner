var ConfigFactory = require('./__config_factory');

module.exports.mesh = function(count) {

  if (count != 1) throw new Error('not yet implemented ++');

  before(function(done, Mesh) {
    this.timeout(1000);

    Mesh.start(ConfigFactory.mesh.fullSingle({
      name: 'mesh_name',
      port: 10001,
      endpoints: {}
    }))
    .then(function(mesh) {
      mock('mesh', mesh);
    })
    .then(done).catch(done);
  });

  after(function(done, mesh) {
    mesh.stop().then(done).catch(done);
  });

  return module.exports; // chainable
}

module.exports.client = function(count) {

  if (count != 1) throw new Error('not yet implemented ++');

  before(function(done, Mesh) {
    this.timeout(1000);

    Mesh.MeshClient(10001)
    .then(function(client) {
      mock('client', client);
      mock('Xc', client.exchange);
    })
    .then(done).catch(done);
  })

  return module.exports;
}
