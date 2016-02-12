describe('d3-permission-changes', function() {

  var expect = require('expect.js');
  var should = require('chai').should();

  var Mesh = require('../');
  var mesh = new Mesh();

  var adminClient = new Mesh.MeshClient({secure:true, port:8004});
  var test_id = Date.now() + '_' + require('shortid').generate();
  var async = require('async');

  this.timeout(20000);

  before(function(done) {

    mesh.initialize({
      name:'d3-permission-changes-events',
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

        // Credentials for the login method
        var credentials = {
          username: '_ADMIN', // pending
          password: test_id
        }

        adminClient.login(credentials).then(function(){
          console.log('d3 logged in ok:::');
          done();
        }).catch(done);

      });
    });
  });

  after(function(done) {
    mesh.stop(done);
  })

  it('tests that all security events are being bubbled back from happn to happner security - and are consumable from an admin client', function(done) {

     var testGroup = {
      name:'TESTGROUP1' + test_id,

      custom_data:{
        customString:'custom1',
        customNumber:0
      },

      permissions:{
        methods:{}
      }
    }

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    var userUpsertedEventFired = false;
    var groupUpsertedEventFired = false;
    var linkGroupEventFired = false;
    var unlinkGroupEventFired = false;
    var deleteGroupEventFired = false;
    var deleteUserEventFired = false;

    //link-group
    //

    var eventsToFire = {
      'upsert-user':false,
      'upsert-group':false,
      'link-group':false,
      'unlink-group':false,
      'delete-group':false,
      'delete-user':false
    }

    var fireEvent = function(key){

      console.log('event was fired:::', key);

      eventsToFire[key] = true;

      for (var eventKey in eventsToFire)
        if (eventsToFire[eventKey] == false)
          return;

      done();
    }

    adminClient.exchange.security.attachToSecurityChanges(function(e){
      if (e) return callback(e);

      adminClient.event.security.on('upsert-user', function(data){
        fireEvent('upsert-user');
      });

      adminClient.event.security.on('upsert-group', function(data){
        fireEvent('upsert-group');
      });

      adminClient.event.security.on('link-group', function(data){
        fireEvent('link-group');
      });

      adminClient.event.security.on('unlink-group', function(data){
        fireEvent('unlink-group');
      });

      adminClient.event.security.on('delete-group', function(data){
        fireEvent('delete-group');
      });

      adminClient.event.security.on('delete-user', function(data){
        fireEvent('delete-user');
      });

      adminClient.exchange.security.addGroup(testGroup, function(e, result){

        if (e) return done(e);

        testGroupSaved = result;

        var testUser = {
          username:'TESTUSER1' + test_id,
          password:'TEST PWD',
          custom_data:{
            something: 'useful'
          }
        }

        adminClient.exchange.security.addUser(testUser, function(e, result){

          if (e) return done(e);

          expect(result.username).to.be(testUser.username);
          testUserSaved = result;

          adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function(e){
            //we'll need to fetch user groups, do that later
            if (e) return done(e);

            testUser.password = 'NEW PWD';
            testUser.custom_data = {changedCustom:'changedCustom'};

            adminClient.exchange.security.updateUser(testUser, function(e, result){

              if (e) return done(e);

              adminClient.exchange.security.unlinkGroup(testGroupSaved, testUserSaved, function(e, result){

                if (e) return done(e);

                adminClient.exchange.security.deleteGroup(testGroupSaved, function(e, result){

                  if (e) return done(e);

                  adminClient.exchange.security.deleteUser(testUser, function(e, result){

                    if (e) return done(e);

                    console.log('we made all the updates:::');

                  })

                });

              });
            });
          });
        });
      });

    })

  });

});