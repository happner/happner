describe('d5-connection-changes-events', function() {

  require('benchmarket').start();
  after(require('benchmarket').store());

  var expect = require('expect.js');
  var should = require('chai').should();

  var Mesh = require('../');
  var mesh = new Mesh();

  var adminClient = new Mesh.MeshClient({secure:true, port:8004});
  var testClient = new Mesh.MeshClient({secure:true, port:8004});

  var test_id = Date.now() + '_' + require('shortid').generate();
  var async = require('async');

  this.timeout(5000);

  before(function(done) {

    mesh.initialize({
      name:'d5-connection-changes-events',
      datalayer: {
        secure: true,
        adminPassword: test_id,
        port:8004
      }
    }, function(err) {
      if (err) return done(err);
      mesh.start(function(err) {
        if (err) {
          // console.log(err.stack);
          return done(err);
        }

        var credentials = {
          username: '_ADMIN', // pending
          password: test_id
        }

        adminClient.login(credentials).then(function(){
          done();
        }).catch(done);

      });
    });
  });

  var eventsToFire = {
    'reconnect/scheduled':false,
    'reconnect/successful':false
  }

  it('tests the reconnection events', function(done) {

    var fireEvent = function(key){

      eventsToFire[key] = true;

      for (var eventKey in eventsToFire)
        if (eventsToFire[eventKey] == false)
          return;

      done();
    }

    adminClient.on('reconnect/scheduled', function(evt, data){
      //TODO some expect code

      fireEvent('reconnect/scheduled');
    });

    adminClient.on('reconnect/successful', function(evt, data){
      //TODO some expect code
      fireEvent('reconnect/successful');
    });

    for (var key in mesh._mesh.datalayer.server.connections)
        mesh._mesh.datalayer.server.connections[key].destroy();

  });

  it('tests the connection end event', function(done) {

    adminClient.on('connection/ended', function(evt, data){
      //TODO some expect stuff
      done();
    });

    mesh.stop({reconnect: false}, function(e){

      if (e) return done(e);
      // console.log('the server stopped:::');

    });

  });

  require('benchmarket').stop();

});