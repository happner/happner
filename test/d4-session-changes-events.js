describe('d4-session-changes-events', function() {

  this.timeout(120000);

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

  before(function(done) {

    mesh.initialize({
      name:'d4-session-changes-events',
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

  after(function(done) {
    mesh.stop({reconnect:false}, done);
  })

  var eventsToFire = {
    'connect':false,
    'disconnect':false
  }

  it('tests the connect and disconnect events, by logging on and off with the admin client', function(done) {

    var fireEvent = function(key){

      eventsToFire[key] = true;

      for (var eventKey in eventsToFire)
        if (eventsToFire[eventKey] == false)
          return;

      done();
    }

    var testUser = {
      username:'TESTUSER1' + test_id,
      password:'TEST PWD',
      custom_data:{
        something: 'useful'
      }
    }

    adminClient.exchange.security.addUser(testUser, function(e, result){

      if (e) return done(e);

      adminClient.exchange.security.attachToSessionChanges(function(e){

        if (e) return callback(e);

        adminClient.event.security.on('connect', function(data){
          fireEvent('connect');
        });

        adminClient.event.security.on('disconnect', function(data){
          fireEvent('disconnect');
        });

        var credentials = {
          username: 'TESTUSER1' + test_id, // pending
          password: 'TEST PWD'
        }

        testClient.login(credentials).then(function(){

          testClient.disconnect();

        }).catch(done);

      });

    });

  });

  require('benchmarket').stop();

});
