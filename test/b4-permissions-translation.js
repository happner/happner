module.exports = SecuredComponent;

var DONE = false;

function SecuredComponent() {}

SecuredComponent.prototype.method1 = function($happn,opt1,callback) {
  callback(null, [opt1]);
}

SecuredComponent.prototype.method2 = function($happn,opt1, opt2, callback) {
  callback(null, [opt1, opt2]);
}

SecuredComponent.prototype.method3 = function($happn,opt1, opt2, opt3, callback) {
  callback(null, [opt1, opt2, opt3]);
}



if (global.TESTING_B4) return; // When 'requiring' the module above,
                              // don't run the tests below
                             //............. 

var should = require('chai').should();
var mesh;
var Mesh = require('../');

var adminClient = new Mesh.MeshClient({secure:true});
var test_id = Date.now() + '_' + require('shortid').generate();

describe('component start and validation -', function() {

  this.timeout(20000);

  before(function(done) {

    global.TESTING_B4 = true; //.............

    mesh = this.mesh = new Mesh();

    mesh.initialize({
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

      console.log(permissions);

      expect(permissions.events != undefined).to.be(true);
      expect(permissions.methods != undefined).to.be(true);
      expect(permissions.web != undefined).to.be(true);

      done();

    });

    done();
 });

 xit('we add a test user that belongs to a group that has permissions to access all of the ProtectedComponent methods, we test that this works', function(done) {
    done();
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