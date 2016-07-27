describe('e1-client-reconnection', function () {

  this.timeout(120000);

  require('benchmarket').start();
  after(require('benchmarket').store());

  var expect = require('expect.js');

  var Mesh = require('../');
  var mesh;

  var adminClient = new Mesh.MeshClient({secure: true, port: 8004});

  var test_id = Date.now() + '_' + require('shortid').generate();

  var startMesh = function(callback){
    Mesh.create({
      name: 'e1-client-reconnection',
      datalayer: {
        secure: true,
        adminPassword: test_id,
        port: 8004
      },
      components: {
        'data': {}
      }
    }, function(e, instance){

      if (e) return callback(e);
      mesh = instance;
      callback();

    });
  };

  before(function (done) {
    startMesh(function(e){
      if (e) return done(e);

      adminClient
        .login({username: '_ADMIN', password: test_id})
        .then(done)
        .catch(done);
    });

  });

  after(function (done) {
    mesh.stop({reconnect:false},done);
  });

  var eventsToFire = {
    'reconnect/scheduled': false,
    'reconnect/successful': false
  }

  var eventsFired = false;

  it('tests the client reconnection', function (done) {

    var fireEvent = function (key) {

      if (eventsFired) return;

      eventsToFire[key] = true;

      for (var eventKey in eventsToFire)
        if (eventsToFire[eventKey] == false)
          return;

      eventsFired = true;
      adminClient.exchange.data.set('/test/path', {test:'data'}, done);
    };

    adminClient.exchange.data.set('/test/path', {test:'data'}, function(e){
      if (e) return done(e);

      adminClient.on('reconnect/scheduled', function (evt, data) {
        //TODO some expect code

        fireEvent('reconnect/scheduled');
      });

      adminClient.on('reconnect/successful', function (evt, data) {
        //TODO some expect code
        fireEvent('reconnect/successful');
      });

      mesh.stop(function (e) {
        if (e) return done(e);

        startMesh(function(e){
          if (e) return done(e);
        })

      });

    });

  });

  require('benchmarket').stop();

});
