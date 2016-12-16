var Mesh = require('../');

it('can call disconnect() without connecting', function (done) {
  var client = new Mesh.MeshClient({port: 1});
  client.login({}, function (err) {
    client.disconnect(done);
  });
});

