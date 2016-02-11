module.exports = TestMesh;

var DONE = false;

function TestMesh() {}

TestMesh.prototype.method1 = function($happn, options, callback) {
  options.methodName = 'method1';
   // console.log('ran method1...');
  callback(null, options);
}

if (global.TESTING_D3) return; // When 'requiring' the module above,
                              // don't run the tests below
                             //.............
describe('d2-update-own-user', function() {

  var expect = require('expect.js');
  var should = require('chai').should();
  var mesh;
  var Mesh = require('../');

  var adminClient = new Mesh.MeshClient({secure:true});
  var test_id = Date.now() + '_' + require('shortid').generate();
  var async = require('async');

  this.timeout(20000);

  before(function(done) {

    global.TESTING_D3 = true; //.............

    mesh = this.mesh = new Mesh();

    mesh.initialize({
      name:'d2-update-own-user',
      datalayer: {
        secure: true,
        adminPassword: test_id,
      },
      modules: {
        'TestMesh': {
          path: __filename
        }
      },
      components: {
        'TestMesh': {
          moduleName: 'TestMesh',
          schema: {
            exclusive: false,
            methods: {}
          }
        }
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
          done();
        }).catch(done);

      });
    });
  });

  after(function(done) {
    delete global.TESTING_D3; //.............
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

                })

              });

            });
          });
        });
      });
    });
  });

});