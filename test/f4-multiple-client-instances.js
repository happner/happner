require('should');
var path = require('path');
var filename = path.basename(__filename);
var expect = require('expect.js');
var test_id = Date.now() + '_' + require('shortid').generate();

var Mesh = require('../');

describe(filename, function () {

  this.timeout(10000);

  var mesh1;
  var mesh2;
  var client1;
  var client2;

  require('benchmarket').start();
  after(require('benchmarket').store());

  before(function (done) {
    startMesh(8880, function (err, mesh) {
      if (err) return done(err);
      mesh1 = mesh;
      mesh1.exchange.data.set('testval', {val: 1}, done);
    })
  });

  before(function (done) {
    startMesh(8881, function (err, mesh) {
      if (err) return done(err);
      mesh2 = mesh;
      mesh2.exchange.data.set('testval', {val: 2}, done);
    })
  });

  before(function (done) {
    client1 = new Mesh.MeshClient({
      secure: true,
      port: 8880
    });
    client1
      .login({username: '_ADMIN', password: test_id})
      .then(done)
      .catch(done);
  });

  before(function (done) {
    client2 = new Mesh.MeshClient({
      secure: true,
      port: 8881
    });
    client2
      .login({username: '_ADMIN', password: test_id})
      .then(done)
      .catch(done);
  });

  after(function(){
    if (mesh1) return mesh1.stop();
  });

  after(function(){
    if (mesh2) return mesh2.stop();
  });

  it('client2 works after client1 disconnects', function (done) {

    var val1;
    var val2;

    client1.exchange.data.get('testval', function (err, data) {
      if (err) return done(err);
      val1 = data.val;
      client1.disconnect(function () {
        client2.exchange.data.get('testval', function (err, data) {
          val2 = data.val;
          val1.should.eql(1);
          val2.should.eql(2);
          done();
        })
      })
    })

  });

  require('benchmarket').stop();

});


function startMesh(port, callback) {
  Mesh.create({
      name: filename + '-' + port,
      datalayer: {
        secure: true,
        adminPassword: test_id,
        port: port
      },
      components: {
        'data': {}
      }
    },
    callback);
}
