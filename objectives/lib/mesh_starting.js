// mesh_starting

module.exports = function() {

  context('short start()', {

    description: 'Calls through both run levels (ready! and started!)'

  }, function() {


    it('supports promises', function(done, should, Mesh) {

      Mesh.start(12345)

      .then(function(mesh) {

        mesh.runlevel.should.equal(4);
        
        mesh.stop().then(done).catch(done)
      })

      .catch(done);

      this.timeout(2000);

    });

  });

}
