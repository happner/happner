// mesh_stopping

module.exports = function() {

  context('stop()', function() {



    it('supports promises', function(done, should, Mesh) {

      this.timeout(2000);

      Mesh.create(12345).then(function(mesh){

        mesh.runlevel.should.equal(40);

        mesh.stop().then(function() {

          // TODO: Runlevels needs more thought/planning
          //
          //     - should also express connectivity to other nodes?
          //     

          mesh.runlevel.should.equal(0);
          done();

        }).catch(done);
      }).catch(done);
    });



    it('supports callbacks', function(done, should, Mesh) {

      Mesh.start(12345).then(function(mesh){

        mesh.stop(function(e) {

          if (e) return done(e);
          mesh.runlevel.should.equal(0);
          done();

        })

      }).catch(done);
    });

  });


  context('stops the datalayer', function() {
    it('pending')
  });

  context('stops components', function() {
    it('pending')
  });

  context('?? disconnects local endpoints and exchange ?', function() {
    it('pending')
  });

  context('?? disconnects remote endpoints and exchange ?? ', function() {
    it('pending')
  });

  context('is re-entrant', function() {
    it('peiding');
  });

}