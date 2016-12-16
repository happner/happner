var Mesh = require('../');

it('can call disconnect() without connecting', function (done) {
  (new Mesh.MeshClient({port: 1})).disconnect(done);
});

