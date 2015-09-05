// mesh_configuration.js

// NB! This test is require()d from mest_test.js
//      
// - It must not have an _test suffix in its filename
//   otherwise the objective runner will run it directly.
//
// - You will need to touch the mesh_test.js file to help
//   objective spot the canges in this file (if running 
//   without --once)

module.exports = function() {

  // The context('configuration',...) attaches here from mesh_test.js

  it('example', function() {

    this.example.should.eql( {ABC: 123});

  });

}
