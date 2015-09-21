module.exports = function() {

  context('Simultaneous start with slow server', function() {

    before(function(done, Mesh, ConfigFactory, Promise) {

      this.timeout(20000);

      mock(Mesh.prototype).stub(
        function _registerSchema(config) {
          var _registerSchema = mock.original;
          var _this = this;
          var args = arguments;
          setTimeout(function() {
            return _registerSchema.apply(_this, args);
          }, 200);
        }
      );

      Promise.all([

        Mesh.start(ConfigFactory.mesh.fullSingle({
          port: 12345
        })),
        Mesh.MeshClient(12345),

      ])

      .spread(function(mesh, client) {
        mock('client', client);
        mock('cX', client.exchange);
        mock('mesh', mesh);
      })

      .then(done).catch(done);

    });

    after(function(done, mesh) {
      mesh.stop().then(done).catch(done);
    });

    it('waits for the unready mesh', function(done, expect, cX) {

      expect(Object.keys(cX.mesh_name)).to.eql([
        "as_class",
        "as_async_factory",
        "as_sync_factory",
        "as_module",
        "api",
        "resources",
        "proxy",
        "system"
      ]); 
      done();
    })

  });

  xcontext('new component into running mesh informs clientside api', function() {

    before(function(done, Mesh, ConfigFactory) {

      Mesh.start()

    })

    after(function(done, mesh) {
      mesh.stop().then(done).catch(done);
    });

    it('can call the new component', function(done, mesh, cX) {
      done();
    })

  });

  context('exchange api', function() {

    it('pending');

  });

  context('event api', function() {

    it('pending');

  });

  context('data api', function() {

    it('pending');

  });

}