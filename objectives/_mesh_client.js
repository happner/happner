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

        Mesh.create(ConfigFactory.mesh.fullSingle({
          port: 12345
        })),
        Mesh.MeshClient(12345),

      ])

      .spread(function(mesh, client) {
        mock('client', client);
        mock('Xc', client.exchange);
        mock('mesh', mesh);
      })

      .then(done).catch(done);

    });

    after(function(done, mesh) {
      mesh.stop().then(done).catch(done);
    });

    it('waits for the unready mesh', function(done, expect, Xc) {

      expect(Object.keys(Xc.mesh_name)).to.eql([
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


  context('New component into running mesh informs clientside api', function() {

    require('./__start_stop').createMesh(1, {port: 40001}).createClient(1, {port: 40001});

    it('can call the new component', function(done, expect, Promise, mesh, Xc) {

      expect(Object.keys(Xc.mesh_name)).to.eql([
        "as_class",
        "as_async_factory",
        "as_sync_factory",
        "as_module",
        "api",
        "resources",
        "proxy",
        "system"
      ]);

      mesh._createElement({
        module: {
          name: 'late',
          config: {
            path: 'happner-test-modules.AsLate',
            construct: {
              parameters: [
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

      .delay(200)

      // Call new component from client.

      .then(function() {
        return Xc.mesh_name.late.exchangeMethod({opt:'ions'});
      })

      .then(function(r) {
        expect(r).to.eql({
          opt: 'ions',
          args: 'ARGUMENTS',
          started: true
        });
      })

      .then(done).catch(done);

    })

  });


  context('Client (browser) internal event emitter', function() {

    require('./__start_stop').createMesh(1, {port: 40002}).createClient(1, {port: 40002});

    it('emits "create/components" array for all components on start()',
      function(done, expect, client) {

        // client.on(...
        client.once('create/components', function(components) {

          components.length.should.equal(8)
          expect(components.map(
            function(comp) {
              return Object.keys(comp);
            }
          )).to.eql([
            ['name', 'description'],
            ['name', 'description'],
            ['name', 'description'],
            ['name', 'description'],
            ['name', 'description'],
            ['name', 'description'],
            ['name', 'description'],
            ['name', 'description'],
          ]);
          done();
        });

        client.start();
      }
    );

    it('emits "create/components" array (1 element) when components are added to the mesh',
      function(done, expect, client, mesh) {

        var actualDescription;

        client.start();

        // client.on(...
        client.once('create/components', function(newComponents) {

          try {
            expect(newComponents).to.eql(
              [
                {
                  name: 'late',
                  description: actualDescription
                }
              ]
            );
            done();
          } catch (e) { done(e); }
          
        });

        mesh._createElement({
          module: {
            name: 'late',
            config: {
              path: 'happner-test-modules.AsLate',
              construct: {
                parameters: [
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

        .then(function() {
          actualDescription = mesh._mesh.endpoints.mesh_name.description.components.late;
        })

        .catch(done);

      }
    );

    xit('emits "destroy/components" when components are removed from the mesh');

    xit('re-balances clientside api (description) on client re-connect');

    xit('component description includes web routes');

    xit('component description includes registerd events paths (security)');

    xit('component description includes registerd data paths (security)');

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