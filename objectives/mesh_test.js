objective('Mesh', function() {

  before(function() {
    mock('should', new require('chai').should());
    mock('expect', require('chai').expect);
    mock('Promise', require('bluebird'));
    mock('ConfigFactory', require('./__config_factory'));
  });

  context('Configuration', require('./_mesh_configuration'));
  context('Starting',      require('./_mesh_starting'));
  context('Stopping',      require('./_mesh_stopping'));
  context('Restarting',    require('./_mesh_restarting'));
  context('Exchange api',  require('./_mesh_exchange'));
  context('Event api',     require('./_mesh_event'));
  context('Data api',      require('./_mesh_data'));
  context('Mesh Client',   require('./_mesh_client'));

});
