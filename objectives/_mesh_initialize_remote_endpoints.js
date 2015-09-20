module.exports = function() {

  context.only('bi-directionaly connected concurrent start with a slow device', function() {

    before(function(done, Promise, Mesh, ConfigFactory) {

      // Replace _registerSchema() on Mesh prorotype to make mesh 'B'
      // slow to get it's `description` into place.

      mock(Mesh.prototype).stub(
        function _registerSchema(config) {

          // The original function.
          var _registerSchema = mock.original;

          if (config.name != 'B') {
            return _registerSchema.apply(this, arguments);
          }

          var _this = this, args = arguments;
          setTimeout(function() {
            // B takes 200 to register.
            return _registerSchema.apply(this, args);
          }, 200);
        }
      );

      // Start 'A' and 'B' simultaneously

      Promise.all([
        Mesh.start(ConfigFactory.mesh.fullDouble({
          name: 'A',
          port: 10001,
          endpoints: {'B': 10002} //      both connect...
        })),

        Mesh.start(ConfigFactory.mesh.fullDouble({
          name: 'B',
          port: 10002,
          endpoints: {'A': 10001} //      ...to eachother    
        })),
      ])

      .spread(function(meshA, meshB) {
        mock('meshA', meshA);
        mock('meshB', meshB);
        mock('xA', meshA.exchange);
        mock('xB', meshB.exchange);
      })

      .then(done).catch(done);

    });

    after(function(done, meshA, meshB) {

      Promise.all([
        meshA.stop(),
        meshB.stop(),
      ])

      .then(done).catch(done);

    });

    it('both got a full description from the other', function(done, expect, xA, xB) {

      expect(Object.keys(xA.B)).to.eql(Object.keys(xB.A));
      done();

    })

  });

}