module.exports = function() {

  before(function (Mesh, done) {
    this.timeout(2000);
    var _this = this;
    Mesh.start({


      name: 'testnode',
      port: 54321,
      modules: {
        'test': {
          instance: {
            method: function($happn, arg, callback) {
              callback(null, 'OK: ' + arg);
            }
          }
        }
      },
      components: {
        'test': {}
      }


    }).then(function(mesh){
      _this.mesh = mesh;
      done();
    }).catch(done);
  });


  after(function(done) {
    this.mesh.stop(done).catch(done);
  });



  context('connects to mesh node', function() {




    it('supports callbacks', function(done, Mesh) {

      // trace.filter = true

      Mesh.MeshClient('localhost', 54321, function(e, client) {
        if (e) return done(e);

        // client.log.warn('Mooo!');

        client.exchange
        .testnode.test.method('hello', function(err, res) {
          if (err) return done(err);

          res.should.equal('OK: hello');
          done();
        });
      });
    });



    it('supports promises', function(done, Mesh) {

      Mesh.MeshClient(54321)
      .then(function(client) {

        client.exchange
        .testnode.test.method('hello')
        .then(function(res) {

          res.should.equal('OK: hello');
          done();

        }).catch(done);
      }).catch(done);
    });

  });

}
