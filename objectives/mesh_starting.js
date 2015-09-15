// mesh_starting

module.exports = function() {


  context('short start()', {
    description: 'Calls through both run levels (2:initialized! and 4:started!)'
  }, function() {



    it('supports promises', function(done, should, Mesh) {

      this.timeout(2000);

      Mesh.start(12345)

      .then(function(mesh) {
        mesh.runlevel.should.equal(40);
        mesh.stop().then(done).catch(done);
      })

      .catch(done);
    });



    it('supports callbacks', function(done, should, Mesh) {

      this.timeout(2000);

      Mesh.start(12345, function(e, mesh) {
        mesh.runlevel.should.equal(40);
        mesh.stop().then(done).catch(done);
      });
    });
  });


  context('long start()', {
    description: 'Allows access between run levels (20:initialized! and 40:started!)'
  }, function() {



    it('supports promises', function(done, should, Mesh) {

      this.timeout(2000);

      mesh = new Mesh({datalayer:{port:12345}});

      mesh.initialize()

      .then(function(mesh) {
        mesh.runlevel.should.equal(20); // <-------------
        return mesh.start();
      })

      .then(function(mesh) {
        mesh.runlevel.should.equal(40); // <--------------
        mesh.stop().then(done).catch(done);
      })

      .catch(done)
    });


    it('supports callbacks', function(done, should, Mesh) {

      this.timeout(2000);

      mesh = new Mesh({datalayer:{port:12345}});

      mesh.initialize(function(e, mesh) {

        if (e) {
          mesh.stop().catch(done);
          return done(e)
        }

        mesh.runlevel.should.equal(20);

        mesh.start(function(e, mesh) {

          mesh.runlevel.should.equal(40);
          mesh.stop().then(done).catch(done);

        });
      });
    });
  });

  context('default the config', function() {
    it('pending')
  });

  context('initializes the datalayer', function() {
    it('pending')
  });

  context('initializes modules', function() {
    it('pending')
  });

  context('initializes components', function() {
    it('pending')
  });

  context('initializes the local endpoint', function() {
    it('pending')
  });

  context('initializes remote endpoint', function() {
    it('pending')
  });

}
