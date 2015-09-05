// mesh_starting

module.exports = function() {

  context('short start()', {

    description: 'Calls through both run levels (ready! and started!)'

  }, function() {


    it('supports promises', function(done, should, Mesh) {

      Mesh.start(12345)

      .then(function(mesh) {

        mesh.initialized.should.equal(true);
        mesh.started.should.equal(true);
        mesh.initializing.should.equal(false);
        mesh.starting.should.equal(false);
        
        mesh.stop().then(done).catch(done)
      })

      .catch(done);

      this.timeout(2000);

    });

  });

}
