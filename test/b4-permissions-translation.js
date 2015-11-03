module.exports = SecuredComponent;

var DONE = false;

function SecuredComponent() {}

SecuredComponent.prototype.method1 = function($happn, options, callback) {
  options.methodName = 'method1';
  console.log('ran method1...');
  callback(null, options);
}

SecuredComponent.prototype.method2 = function($happn, options, callback) {
  options.methodName = 'method2';
  console.log('ran method2...');
  callback(null, options);
}

SecuredComponent.prototype.method3 = function($happn, options, callback) {
  options.methodName = 'method3';
   console.log('ran method3...');
  callback(null, options);
}

if (global.TESTING_B4) return; // When 'requiring' the module above,
                              // don't run the tests below
                             //............. 

var expect = require('expect.js');
var should = require('chai').should();
var mesh;
var Mesh = require('../');

var adminClient = new Mesh.MeshClient({secure:true});
var test_id = Date.now() + '_' + require('shortid').generate();
var async = require('async');

describe('component start and validation -', function() {

  this.timeout(20000);

  before(function(done) {

    global.TESTING_B4 = true; //.............

    mesh = this.mesh = new Mesh();

    mesh.initialize({
      name:'b4_permissions_translation',
      util: {
        // logLevel: ['error']
      },
      datalayer: {
        secure:true,
        adminPassword: test_id,
        log_level: 'error'
      },
      modules: {
        'SecuredComponent': {
          path: __filename
        }
      },
      components: {
        'SecuredComponent': {
          moduleName: 'SecuredComponent',
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
            console.log(err.stack);
            //process.exit(err.errno || 1);
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
    delete global.TESTING_16; //.............
    mesh.stop(done);
  })


 it('we examine the output of the mesh permissions and ensure that they reflect our module', function(done) {

    adminClient.exchange.security.getSystemPermissions({nocache:true}, function(e, permissions){
      
      if (e) return done(e);

      //console.log(permissions);

      expect(permissions.events != undefined).to.be(true);
      expect(permissions.methods != undefined).to.be(true);
      expect(permissions.web != undefined).to.be(true);

      //console.log(permissions.methods['/b4_permissions_translation/SecuredComponent/*']);

      expect(permissions.methods['/b4_permissions_translation/SecuredComponent/*'].action[0]).to.be('*');
      expect(permissions.methods['/b4_permissions_translation/SecuredComponent/method1'].action[0]).to.be('*');
      expect(permissions.methods['/b4_permissions_translation/SecuredComponent/method2'].action[0]).to.be('*');
      expect(permissions.methods['/b4_permissions_translation/SecuredComponent/method3'].action[0]).to.be('*');

      done();

    });

 });

 it('we add a test user that belongs to a group that has permissions to access all of the ProtectedComponent methods, we test that this works', function(done) {

    var testGroup = {
      name:'B4_TEST GROUP' + test_id,
      
      custom_data:{
        customString:'custom1',
        customNumber:0
      },

      permissions:{
        methods:{
          //in a /Mesh name/component name/method name - with possible wildcards
          '/b4_permissions_translation/SecuredComponent/*':{action:['*']}
        }
      }
    }

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    adminClient.exchange.security.addGroup(testGroup, function(e, result){

      if (e) return callback(e);

      testGroupSaved = result;
    
      console.log('added group:::', testGroupSaved);

      var testUser = {
        username:'B4_TEST_ALL_USER_' + test_id,
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

              //do some stuff with the security manager here
              //securityManager = testUserClient.exchange.security;
              //NB - we dont have the security checks on method/component calls yet

              console.log('logged in:::');

              async.eachSeries(['method1','method2','method3'], function(method, methodCB){

                testUserClient.exchange.b4_permissions_translation.SecuredComponent[method]({}, function(e, result){

                  if (e) return methodCB(e);
                  expect(result.methodName).to.be(method);
                  methodCB();

                });

              }, done);

            }).catch(function(e){
              done(e);
            });

          });

      });
    });
 });

 xit('we add a test user that belongs to a group that has permissions to access none of the ProtectedComponent methods, we test that this works', function(done) {
    done();
 });

 xit('we add a test user that belongs to a group that has permissions to access one of the ProtectedComponent methods, we test that this works', function(done) {
    done();
 });

 xit('we add a test user that belongs to a group that has permissions to access all of the ProtectedComponent events, we test that this works', function(done) {
    done();
 });

 xit('we add a test user that belongs to a group that has permissions to access none of the ProtectedComponent events, we test that this works', function(done) {
    done();
 });

 xit('we add a test user that belongs to a group that has permissions to access one of the ProtectedComponent events, we test that this works', function(done) {
    done();
 });


});