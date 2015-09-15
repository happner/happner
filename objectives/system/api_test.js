objective('Api', function() {

  before(function(Mesh) {
    mock('should', new require('chai').should());
  })

  context('MeshClient', function() {

    context('in browser', require('./api_browser_client'));
    // delete require.cache[require.resolve('./api_browser_client')]

    context('in node', require('./api_node_client'));
    // delete require.cache[require.resolve('./api_node_client')]

  });

});
