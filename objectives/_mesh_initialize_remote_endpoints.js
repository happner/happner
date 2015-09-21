module.exports = function() {

  context('bi-directionaly connected concurrent start with a slow device', function() {

    before(function(done, Promise, Mesh, ConfigFactory) {

      this.timeout(20000);

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
            return _registerSchema.apply(_this, args);
          //}, 5000);
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

    after(function(done, Promise, meshA, meshB) {

      Promise.all([
        meshA.stop(),
        meshB.stop(),
      ])

      .then(done).catch(done);

    });

    it('both got a full description from the other', function(done, expect, xA, xB) {

      // endpoint init waits for full description

      expect(Object.keys(xA.B)).to.eql(Object.keys(xB.A));
      done();

    })

  });

  context('updates to remote description create local api changes', function() {

    before(function(done, Mesh, ConfigFactory) {
      ConfigFactory.mesh.makeTwoConnected()
      .spread(function(meshA, meshB) {
        mock('meshA', meshA);
        mock('meshB', meshB);
        mock('xA', meshA.exchange);
        mock('xB', meshB.exchange);
      })
      .then(done).catch(done);
    });

    after(function(done, Promise, meshA, meshB) {
      Promise.all([
        meshA.stop(),
        meshB.stop(),
      ])
      .then(done).catch(done);
    });

    it('meshA got all api on endpoint to meshB', function(done, expect, xA) {
      expect(Object.keys(xA.meshB)).to.eql([
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
    });


    it('meshA has updated api on endpoint after adding new compoonent to meshB',

      function(done, expect, xA, meshB, Promise) {

        // Confirm meshB has no component called 'late'

        expect(Object.keys(xA.meshB).indexOf('late')).to.equal(-1);

        // Add new component called 'late' to meshB

        meshB._createElement({
          module: {
            name: 'late',
            config: {
              path: 'happner-test-modules.AsLate',
              construct: {
                parameters: [ // TODO: wishlist: rename to params, or args
                  {value: 'ARGU'},
                  {value: 'MENT'},
                  {value: 'S'},
                ]
              }
            }
          },
          component: {
            name: 'late',
            config: {
              module: 'late',
            }
          }
        })

        // Need to wait a bit for the out-of-tick description change
        // replication to reach meshA

        .delay(200)

        // Use new function at meshB from meshA exchange

        .then(function() {
          return xA.meshB.late.exchangeMethod({opt:'ions'});
        })

        .then(function(r) {
          expect(r).to.eql({
            opt: 'ions',
            args: 'ARGUMENTS',
            started: true // ensure component's startMethod ran
          });
        })

        .then(done).catch(done);

      }
    );

  });

  context('recover from remote endpoint crash/restart during initialization')

  context('wait for remote endpoint that is not listening yet')

}