module.exports = TestMesh;

var DONE = false;

function TestMesh() {}

TestMesh.prototype.method1 = function($happn, options, callback) {
  options.methodName = 'method1';
   // console.log('ran method1...');
  callback(null, options);
}

if (global.TESTING_D2) return; // When 'requiring' the module above,
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

    global.TESTING_D2 = true; //.............

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
    delete global.TESTING_D2; //.............
    mesh.stop(done);
  })

  it('adds a test user, modifies the users password with the admin user, logs in with the test user', function(done) {

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

            testUserClient = new Mesh.MeshClient({secure:true});
            return testUserClient.login(testUser).then(done).catch(done);

          });

        });
      });
    });

  });

  it('adds a test user, logs in with the test user - modifies the users password successfully', function(done) {

     var testGroup = {
      name:'TESTGROUP2' + test_id,

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

    adminClient.exchange.security.addGroup(testGroup, function(e, result){

      if (e) return done(e);

      testGroupSaved = result;

      var testUser = {
        username:'TESTUSER2' + test_id,
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

            testUserClient = new Mesh.MeshClient({secure:true});

            testUserClient.login(testUser).then(function(){

              testUser.password = 'NEW PWD';
              testUser.custom_data = {changedCustom:'changedCustom'};

              testUserClient.exchange.security.updateOwnUser(testUser, function(e, result){

                if (e) return done(e);
                expect(result.custom_data.changedCustom).to.be('changedCustom');
                testUserClient.login(testUser).then(done).catch(done);

              });

            }).catch(function(e){
              done(e);
            });

          });

      });

    });

  });

  it('adds a test user, logs in with the test user - fails to modify the user using updateUser', function(done) {

     var testGroup = {
      name:'TESTGROUP3' + test_id,

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

    adminClient.exchange.security.addGroup(testGroup, function(e, result){

      if (e) return done(e);

      testGroupSaved = result;

      var testUser = {
        username:'TESTUSER3' + test_id,
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

            testUserClient = new Mesh.MeshClient({secure:true});

            testUserClient.login(testUser).then(function(){

              testUser.password = 'NEW PWD';
              testUser.custom_data = {changedCustom:'changedCustom'};

              testUserClient.exchange.security.updateUser(testUser, function(e, result){

               expect(e.toString()).to.be('AccessDenied: unauthorized');
               done();

              });

            }).catch(function(e){
              done(e);
            });

          });

      });

    });

  });



});