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
        new Promise(function(resolve, reject) {
          setTimeout(function() {
            Mesh.MeshClient(12345, function(e, client) {
              if (e) return reject(e);
              resolve(client);
            })
          }, 10);
        }),

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
        // "proxy",
        "system"
      ]); 
      done();
    })

  });


  context('Component ADDED to running mesh', function() {

    require('./__start_stop')
    .createMesh(1, {port: 40001})
    .createClient(1, {port: 40001});

    it('informs clientside api', function(done, expect, mesh, Xc) {

      expect(Object.keys(Xc.mesh_name)).to.eql([
        "as_class",
        "as_async_factory",
        "as_sync_factory",
        "as_module",
        "api",
        // "proxy",
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
        expect(Xc.mesh_name.late.exchangeMethod).to.exist;
        return Xc.late.exchangeMethod({opt:'ions'});
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

  context('Component REMOVED from running mesh', function() {

    require('./__start_stop')
    .createMesh(1, {port: 40003})
    .createClient(1, {port: 40003})
    .components.createAsClass(1);

    it('informs clientside api', function(done, expect, mesh, Ec, Xc) {

      expect(Xc.mesh_name.late.exchangeMethod).to.exist;
      expect(Xc.late.exchangeMethod).to.exist;
      expect(Ec.mesh_name.late).to.exist;
      expect(Ec.late).to.exist;

      mesh._destroyElement('late')

      .delay(50)

      .then(function() {
        expect(Xc.mesh_name.late).to.not.exist;
        expect(Xc.late).to.not.exist;
      })

      .then(done).catch(done);
      
    });


  });


  context('Client (browser) internal event emitter', function() {

    require('./__start_stop')
    .createMesh(1, {port: 40002})
    .createClient(1, {port: 40002})
    .components.createAsClass(1);

    xit('NOW HAPPENS ON login() - emits "create/components" array for all components on start()',
      function(done, expect, client) {

        // client.on(...
        client.once('create/components', function(components) {

          components.length.should.equal(6)
          expect(components.map(
            function(comp) {
              return Object.keys(comp);
            }
          )).to.eql([
            ['description'],
            ['description'],
            ['description'],
            ['description'],
            ['description'],
            ['description'],
          ]);
          done();
        });

        client.start();
      }
    );

    it('emits "create/components" array (1 element) when components are added to the mesh',
      function(done, expect, client, mesh) {

        var actualDescription;

        // client.on(...
        client.once('create/components', function(newComponents) {
          setTimeout(function() { // wait for actual description
            try {
              expect(newComponents).to.eql(
                [
                  {
                    description: actualDescription
                  }
                ]
              );
              done();
            } catch (e) { done(e); }
          }, 50);
        });

        mesh._createElement({
          module: {
            name: 'late2',
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
            name: 'late2',
            config: {
              module: 'late2',
            }
          }
        })

        .then(function() {
          actualDescription = mesh._mesh.endpoints.mesh_name.description.components.late2
        })

        .catch(done);
      }
    );

    it('emits "destroy/components" when components are removed from the mesh',
      function(done, expect, client, mesh) {

        var description = mesh._mesh.endpoints.mesh_name.description.components.late;

        client.once('destroy/components', function(components) {
          try {
            expect(components).to.eql([{
              description: description
            }])
            done();
          } catch (e) {done(e)}
        });

        mesh._destroyElement('late')

        .catch(done);
      }
    );

    xit('re-balances clientside api (description) on client re-connect');

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