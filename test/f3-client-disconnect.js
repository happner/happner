var Mesh = require('../');
var filename = require('path').basename(__filename);

describe(filename, function () {
  it('can call disconnect() without connecting', function (done) {
    (new Mesh.MeshClient({port: 1})).disconnect(done);
  })
});
