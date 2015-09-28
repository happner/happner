objective('Mesh', function() {

  before(function(os) {
    var request = require('request');
    var Promise = require('bluebird');
    var should = new require('chai').should();
    var expect = require('chai').expect;
    var get = Promise.promisify(request.get);

    mock('should', should);
    mock('expect', expect);
    mock('Promise', Promise);
    mock('get', get);
    mock('ConfigFactory', require('./__config_factory'));

    mock('txt', function(fn) {
      var array = fn.toString().split(os.EOL);
      array.shift();
      array.pop();
      return array.join(os.EOL);
    });

  });

  context('Configuration', require('./_mesh_configuration'));
  context.only('Autoload',      require('./_mesh_autoload'));
  context('Starting',      require('./_mesh_starting'));
  context('Stopping',      require('./_mesh_stopping'));
  context('Restarting',    require('./_mesh_restarting'));
  context('Exchange api',  require('./_mesh_exchange'));
  context('Event api',     require('./_mesh_event'));
  context('Data api',      require('./_mesh_data'));
  context('Mesh Client',   require('./_mesh_client'));

});
