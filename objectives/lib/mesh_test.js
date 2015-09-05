// describe('Mesh', <--- (almost) the same as
objective('Mesh', {

  description: function() {/*
    
    #### Provides primary functionalities for the local mesh node.

    __Including:__

    * Stopping and Starting. This includes calling the start and stop
      methods into all running components.

    * Assembly of the APIs to provide components with access to the
      exchange, event and data layers.

    * The defaulting of configuration. Including assignment of which
      system components are included by default.

    * Creating connections to the specified endpoints (other mesh nodes).

  */}

}, function() {


  before(function(Mesh) {/*

    Capital names are searched for in lib and auto-injected.
    --------------------------------------------------------

    eg.(Mesh) in the above args effectively has performed a require
              without all the '../../../' nonsense.

         NB!  It matches the path, so the correct index.js can be 
              injected from...

              ../lib/system/components/api/index.js as (Index)

              ...provided that the test is at the same relative
              path...

              tests/lib/system/components/api/index_test.js

    
    This hook runs before ALL tests. Only once per run.
    ---------------------------------------------------
    
    * Put all resources on *this* for access in tests. They 
      will then be available even in tests attached by require()

      eg. context('configuration', require('./mesh_configuration'));
          see below

    * Use mock('tagname', new Thing()) to enable injection (by tagname)
      into any test inside the context where this beforeHook resides.

      eg. mock('mesh', new Mesh())

          then in a test:

          it('injects the new mesh', function(done, mesh) {

            mesh.initialize(...
  
          });

    * NB! Objective_dev does not default you to sit through 2000ms
          waiting for the timeout - it defaults to 200ms.

          But the mesh takes longer than that to start, so each test
          which starts a mesh needs to specify an override timeout

      eg. this.timeout(400);

    */


    this.example = {a:1};
    // this available in tests, see first test in mesh_configuration


    mock('should', new require('chai').should());
    // can now inject (should) into all tests

  });


  context('MeshServer (a.k.a. Mesh)', function() {


    context('configuration', require('./mesh_configuration'));
    delete require.cache[require.resolve('./mesh_configuration')]

    // The delete is necessary to ensure a reload of the file on 
    // each require (pending fix in objective)


    context('starting', require('./mesh_starting'));
    delete require.cache[require.resolve('./mesh_starting')];

    context('stopping', require('./mesh_stopping'));
    delete require.cache[require.resolve('./mesh_stopping')];

    context('restarting', require('./mesh_restarting'));
    delete require.cache[require.resolve('./mesh_restarting')];

    context('exchange api', require('./mesh_exchange'));
    delete require.cache[require.resolve('./mesh_exchange')];

    context('event api', require('./mesh_event'));
    delete require.cache[require.resolve('./mesh_event')];

    context('data api', require('./mesh_data'));
    delete require.cache[require.resolve('./mesh_data')];

  });


  context('MeshClient', function() {

    context('exchange api', function() {

      it('pending');

    });

    context('event api', function() {

      it('pending');

    });

    context('data api', function() {

      it('pending');

    });

  });

});