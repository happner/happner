module.exports = function() {

  // TODO: objective, module.exports = function(__start_stop) {

  context('load one module per component', function() {

    before(function(done, ConfigFactory, Mesh) {
      
      Mesh.create(ConfigFactory.mesh.fullSingle({
        name: 'mesh_name',
        port: 12345,
      }))

      .then(function(mesh) {
        mock('mesh', mesh);
        mock('ex', mesh.exchange);
      })

      .then(done).catch(done);
    });


    after(function(done, mesh) {
      mesh.stop(done).catch(done);
    });



    it('initialized all components', function(done, ex) {

      ex.as_class.c_goodExchangeMethod({opts:1})

      .then(function(r) {
        r.should.eql({ result: {opts: 1}, args: 'ARGUMENTS'});
        return ex.as_async_factory.a_goodExchangeMethod({opts: 2});
      })

      .then(function(r) {
        r.should.eql({ result: {opts: 2}, args: 'ARGUMENTS'});
        return ex.as_sync_factory.s_goodExchangeMethod({opts: 3});
      })

      .then(function(r) {
        r.should.eql({ result: {opts: 3}, args: 'ARGUMENTS'});
        return ex.as_module.m_goodExchangeMethod({opts: 4});
      })

      .then(function(r) {
        r.should.eql({ result: {opts: 4}});
        done();
      })

      .catch(done);

    });

    it('all components are available at mesh_name', function(done, ex) {

      ex.mesh_name.as_class.c_goodExchangeMethod({opts:1})

      .then(function(r) {
        r.should.eql({ result: {opts: 1}, args: 'ARGUMENTS'});
        return ex.mesh_name.as_async_factory.a_goodExchangeMethod({opts: 2});
      })

      .then(function(r) {
        r.should.eql({ result: {opts: 2}, args: 'ARGUMENTS'});
        return ex.mesh_name.as_sync_factory.s_goodExchangeMethod({opts: 3});
      })

      .then(function(r) {
        r.should.eql({ result: {opts: 3}, args: 'ARGUMENTS'});
        return ex.mesh_name.as_module.m_goodExchangeMethod({opts: 4});
      })

      .then(function(r) {
        r.should.eql({ result: {opts: 4}});
        done();
      })

      .catch(done);

    });


    it('all components are available from a client', function(done, Mesh, expect) {

      Mesh.MeshClient(12345)

      .then(function(c) {
        client = c;
        return client.exchange.as_class.c_goodExchangeMethod({opts:1})
      })

      .then(function(r) {
        expect(r).to.eql({ result: {opts: 1}, args: 'ARGUMENTS'});
        return client.exchange.as_async_factory.a_goodExchangeMethod({opts: 2});
      })

      .then(function(r) {
        expect(r).to.eql({ result: {opts: 2}, args: 'ARGUMENTS'});
        return client.exchange.as_sync_factory.s_goodExchangeMethod({opts: 3});
      })

      .then(function(r) {
        expect(r).to.eql({ result: {opts: 3}, args: 'ARGUMENTS'});
        return client.exchange.as_module.m_goodExchangeMethod({opts: 4});
      })

      .then(function(r) {
        expect(r).to.eql({ result: {opts: 4}});
        done();
      })

      .catch(done);

    });


    it('all components are available from another mesh node', function(done, Mesh, expect) {

      var mesh;

      Mesh.create({
        port: 12346,
        endpoints: {
          'mesh_name': 12345
        }
      })

      .then(function(m) {
        mesh = m;
        return mesh.exchange.mesh_name.as_class.c_goodExchangeMethod({opts:1})
      })

      .then(function(r) {
        expect(r).to.eql({ result: {opts: 1}, args: 'ARGUMENTS'});
        return mesh.exchange.mesh_name.as_async_factory.a_goodExchangeMethod({opts: 2});
      })

      .then(function(r) {
        expect(r).to.eql({ result: {opts: 2}, args: 'ARGUMENTS'});
        return mesh.exchange.mesh_name.as_sync_factory.s_goodExchangeMethod({opts: 3});
      })

      .then(function(r) {
        expect(r).to.eql({ result: {opts: 3}, args: 'ARGUMENTS'});
        return mesh.exchange.mesh_name.as_module.m_goodExchangeMethod({opts: 4});
      })

      .then(function(r) {
        expect(r).to.eql({ result: {opts: 4}});
        return mesh.stop()
      })

      .then(done).catch(done);

    });

  });

  
  context('load multiple components with the same module', function() {

    before(function(done, Mesh, ConfigFactory) {

      Mesh.create(ConfigFactory.mesh.fullDouble({
        name: 'mesh_name',
        port: 12347
      }))

      .then(function(mesh) {
        mock('mesh', mesh);
        mock('ex', mesh.exchange);
      })

      .then(done).catch(done);
    });

    after(function(done, mesh) {
      mesh.stop(done).catch(done);
    });


    it('loaded all components successfully', function(done, ex, Promise) {

      Promise.all([

        ex.as_class_1         .c_goodExchangeMethod({opts: 1}),
        ex.as_class_2         .c_goodExchangeMethod({opts: 2}),
        ex.as_async_factory_1 .a_goodExchangeMethod({opts: 3}),
        ex.as_async_factory_2 .a_goodExchangeMethod({opts: 4}),
        ex.as_sync_factory_1  .s_goodExchangeMethod({opts: 5}),
        ex.as_sync_factory_2  .s_goodExchangeMethod({opts: 6}),
        ex.as_module_1        .m_goodExchangeMethod({opts: 7}),
        ex.as_module_2        .m_goodExchangeMethod({opts: 8}),

      ])

      .then(function(r) {

        r.should.eql([ 
          { result: { opts: 1 }, args: 'ARGUMENTS' },
          { result: { opts: 2 }, args: 'ARGUMENTS' },
          { result: { opts: 3 }, args: 'ARGUMENTS' },
          { result: { opts: 4 }, args: 'ARGUMENTS' },
          { result: { opts: 5 }, args: 'ARGUMENTS' },
          { result: { opts: 6 }, args: 'ARGUMENTS' },
          { result: { opts: 7 } },
          { result: { opts: 8 } }
        ])

      })

      .then(done).catch(done);

    });

    it('all components are available at mesh_name', function(done, ex, expect, Promise) {

      Promise.all([
        ex.mesh_name.as_class_1         .c_goodExchangeMethod({opts: 1}),
        ex.mesh_name.as_class_2         .c_goodExchangeMethod({opts: 2}),
        ex.mesh_name.as_async_factory_1 .a_goodExchangeMethod({opts: 3}),
        ex.mesh_name.as_async_factory_2 .a_goodExchangeMethod({opts: 4}),
        ex.mesh_name.as_sync_factory_1  .s_goodExchangeMethod({opts: 5}),
        ex.mesh_name.as_sync_factory_2  .s_goodExchangeMethod({opts: 6}),
        ex.mesh_name.as_module_1        .m_goodExchangeMethod({opts: 7}),
        ex.mesh_name.as_module_2        .m_goodExchangeMethod({opts: 8}),
      ])

      .then(function(r) {
        expect(r).to.eql([ 
          { result: { opts: 1 }, args: 'ARGUMENTS' },
          { result: { opts: 2 }, args: 'ARGUMENTS' },
          { result: { opts: 3 }, args: 'ARGUMENTS' },
          { result: { opts: 4 }, args: 'ARGUMENTS' },
          { result: { opts: 5 }, args: 'ARGUMENTS' },
          { result: { opts: 6 }, args: 'ARGUMENTS' },
          { result: { opts: 7 } },
          { result: { opts: 8 } }
        ]);
        done();
      })

      .catch(done);

    });

    it('all components are available from a client', function(done, Mesh, expect, Promise) {

      Mesh.MeshClient(12347)

      .then(function(c) {
        client = c;
        return Promise.all([
          client.exchange.as_class_1         .c_goodExchangeMethod({opts: 1}),
          client.exchange.as_class_2         .c_goodExchangeMethod({opts: 2}),
          client.exchange.as_async_factory_1 .a_goodExchangeMethod({opts: 3}),
          client.exchange.as_async_factory_2 .a_goodExchangeMethod({opts: 4}),
          client.exchange.as_sync_factory_1  .s_goodExchangeMethod({opts: 5}),
          client.exchange.as_sync_factory_2  .s_goodExchangeMethod({opts: 6}),
          client.exchange.as_module_1        .m_goodExchangeMethod({opts: 7}),
          client.exchange.as_module_2        .m_goodExchangeMethod({opts: 8}),
        ]);

      })

      .then(function(r) {
        expect(r).to.eql([ 
          { result: { opts: 1 }, args: 'ARGUMENTS' },
          { result: { opts: 2 }, args: 'ARGUMENTS' },
          { result: { opts: 3 }, args: 'ARGUMENTS' },
          { result: { opts: 4 }, args: 'ARGUMENTS' },
          { result: { opts: 5 }, args: 'ARGUMENTS' },
          { result: { opts: 6 }, args: 'ARGUMENTS' },
          { result: { opts: 7 } },
          { result: { opts: 8 } }
        ]);
        done();
      })

      .catch(done);

    });

    it('all components are available from another mesh node', function(done, Mesh, Promise, expect) {

      var mesh;

      Mesh.create({
        port: 12348,
        endpoints: {
          'mesh_name': 12347
        }
      })

      .then(function(m) {
        mesh = m;
        return Promise.all([
          mesh.exchange.mesh_name.as_class_1         .c_goodExchangeMethod({opts: 1}),
          mesh.exchange.mesh_name.as_class_2         .c_goodExchangeMethod({opts: 2}),
          mesh.exchange.mesh_name.as_async_factory_1 .a_goodExchangeMethod({opts: 3}),
          mesh.exchange.mesh_name.as_async_factory_2 .a_goodExchangeMethod({opts: 4}),
          mesh.exchange.mesh_name.as_sync_factory_1  .s_goodExchangeMethod({opts: 5}),
          mesh.exchange.mesh_name.as_sync_factory_2  .s_goodExchangeMethod({opts: 6}),
          mesh.exchange.mesh_name.as_module_1        .m_goodExchangeMethod({opts: 7}),
          mesh.exchange.mesh_name.as_module_2        .m_goodExchangeMethod({opts: 8}),
        ]);
      })

      .then(function(r) {
        expect(r).to.eql([ 
          { result: { opts: 1 }, args: 'ARGUMENTS' },
          { result: { opts: 2 }, args: 'ARGUMENTS' },
          { result: { opts: 3 }, args: 'ARGUMENTS' },
          { result: { opts: 4 }, args: 'ARGUMENTS' },
          { result: { opts: 5 }, args: 'ARGUMENTS' },
          { result: { opts: 6 }, args: 'ARGUMENTS' },
          { result: { opts: 7 } },
          { result: { opts: 8 } }
        ]);
        return mesh.stop()
      })

      .then(done).catch(done);

    });

    it('provided a separate instance of class and factory modules for each component', function(done, Promise, ex) {

      Promise.all([
          ex.as_class_1         .c_setValue({opts: 1}),
          ex.as_class_2         .c_setValue({opts: 2}),
          ex.as_async_factory_1 .a_setValue({opts: 3}),
          ex.as_async_factory_2 .a_setValue({opts: 4}),
          ex.as_sync_factory_1  .s_setValue({opts: 5}),
          ex.as_sync_factory_2  .s_setValue({opts: 6}),
      ])

      .then(function() {
        return Promise.all([
          ex.as_class_1         .c_getValue(),
          ex.as_class_2         .c_getValue(),
          ex.as_async_factory_1 .a_getValue(),
          ex.as_async_factory_2 .a_getValue(),
          ex.as_sync_factory_1  .s_getValue(),
          ex.as_sync_factory_2  .s_getValue(),
        ]);
      })

      .then(function(r) {
        r.should.eql([
          { opts: 1 },
          { opts: 2 },
          { opts: 3 },
          { opts: 4 },
          { opts: 5 },
          { opts: 6 } 
        ]);
      })

      .then(done).catch(done);

    });

  });

  context.only('Component description', function() {

    before(function(done, Mesh) {
      Mesh.create({
        name: 'mesh_name',
        port: 12348,
        modules: {
          'test': {
            path: 'test-modules'
          }
        },
        components: {
          'www': {
            module: 'test'
          },
          'test': {}
        }
      })
      .then(function(mesh) {
        mock('mesh', mesh);
      })
      .then(done).catch(done);
    });

    it('Includes exchange methods');

    it('Includes event listing');

    it('Includes data paths');

    it('Includes web routes', function (done, expect, mesh) {

      expect(mesh.describe(true).components.www.routes).to.eql({
        '/': {type: 'static'},
        '/long-route': {type: 'mware'},
        '/short-route': {type: 'mware'},
        '/widget': {type: 'static'},
      });

      expect(mesh.describe(true).components.test.routes).to.eql({
        '/test/static': {type: 'static'},
        '/test/long-route': {type: 'mware'},
        '/test/short-route': {type: 'mware'},
        '/test/widget': {type: 'static'},
      });

      done();
    });

  });

  context('create/destroy components in already running mesh', function() {

    require('./__start_stop').createMesh(1)

    context('createElement()', function() {

      require('./__start_stop').components.createAsClass(1, 'for_create');

      it('updates the descrition', function(done, expect, mesh) {
        expect(mesh._mesh.description.components.for_create).to.exist;
        done();
      });

      it('updates the exchange api', function(done, expect, mesh) {
        expect(mesh.exchange.for_create).to.exist;
        expect(mesh.exchange.mesh_name.for_create).to.exist;
        done();
      });

      xit('the updated exchange api works');

      it('updates the event api', function(done, expect, mesh) {
        expect(mesh.event.for_create).to.exist;
        expect(mesh.event.mesh_name.for_create).to.exist;
        done();
      });

      xit('the updated event api works');

      xit('creates webroutes');

    });

    context('destroyElement()', function() {

      require('./__start_stop').components

      .createAsClass(1, 'for_destroy_1')
      .createAsClass(1, 'for_destroy_2')
      .createAsClass(1, 'for_destroy_3')
      // .createAsClass(1, 'for_destroy_4')


      it('updates the descrition, removes messengers from exchange', function(done, expect, mesh, Xm) {
        expect(mesh._mesh.description.components.for_destroy_1).to.exist;
        mesh._destroyElement('for_destroy_1')
        .then(function() {
          expect(mesh._mesh.description.components.for_destroy_1).to.not.exist;
          expect(Object.keys(mesh._mesh.exchange).filter(function(path) {
            return path.match(/for_destroy_1/);
          })).to.eql([]);
        })
        .then(done).catch(done);
      });


      it('updates the exchange api', function(done, expect, mesh) {
        expect(mesh.exchange.for_destroy_2).to.exist;
        expect(mesh.exchange.mesh_name.for_destroy_2).to.exist;
        mesh._destroyElement('for_destroy_2')
        .then(function() {
          expect(mesh.exchange.mesh_name.for_destroy_2).to.not.exist;
          expect(mesh.exchange.for_destroy_2).to.not.exist;
        })
        .then(done).catch(done);
      });

      it('updates the event api', function(done, expect, mesh) {
        expect(mesh.event.for_destroy_3).to.exist;
        expect(mesh.event.mesh_name.for_destroy_3).to.exist;
        mesh._destroyElement('for_destroy_3')
        .then(function() {
          expect(mesh.event.mesh_name.for_destroy_3).to.not.exist;
          expect(mesh.event.for_destroy_3).to.not.exist;
        })
        .then(done).catch(done);
      });

      it('removes pertinent subscriptions from event api');

      it('destroys webroutes')

    });

    it('What to do in createElement where name already exists?!')

  });

}
