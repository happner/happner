module.exports = function() {

  context.only('load one module per component', function() {

    before(function(done, Mesh) {
      
      Mesh.start({
        name: 'mesh_name',
        port: 12345,
        modules: {
          'module-as-class': {
            path: 'happner-test-modules',
            construct: {
              name: 'AsClass',
              parameters: [
                {value: 'ARG'},
                {value: 'U'},
                {value: 'MENTS'}
              ]
            }
          },                                  // note "deeper" module path
          'module-as-async-factory': {       //
            path: 'happner-test-modules.AsFactory',
            create: {
              name: 'asyncCreate',
              type: 'async',
              parameters: [
                {value: 'ARG'},
                {value: 'U'},
                {value: 'MENTS'}
              ] 
            }
          },
          'module-as-sync-factory': {
            path: 'happner-test-modules.AsFactory',
            create: {
              name: 'syncCreate',
              // type: 'sync',
              parameters: [
                {value: 'ARG'},
                {value: 'U'},
                {value: 'MENTS'}
              ] 
            }
          },
          'module-as-module': {
            path: 'happner-test-modules.AsModule'
          }
        },
        components: {
          'as_class': {
            moduleName: 'module-as-class'
          },
          'as_async_factory': {
            moduleName: 'module-as-async-factory'
          },
          'as_sync_factory': {
            moduleName: 'module-as-sync-factory'
          },
          'as_module': {
            moduleName: 'module-as-module',
          },
        }
      })

      .then(function(mesh) {
        mock('mesh', mesh);
        mock('ex', mesh.exchange);
        done();
      })

      .catch(done);
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

      Mesh.start({
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
      })

      .then(function() {
        return mesh.stop()
      })

      .then(done)

      .catch(done);

    });

  });

  context('loading components into already running mesh', function() {

    it('pending');

  });

}
