/**
 * Created by Johan on 10/14/2015.
 */

// Uses unit test 2 modules
var should = require('chai').should();
var Mesh = require('../');
var http = require('http');
var test_id = require('shortid').generate();
var expect = require('expect.js');

describe('c7-permissions-web', function (done) {

  this.timeout(20000);

  var defaultTimeout = (process.arch == 'arm') ? 50000 : 10000;

  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var config = {
    name: "middlewareMesh",
    datalayer: {
      secure:true,
      port:10000,
      adminPassword:test_id
    },
    modules: {
      "middlewareTest": {
        path: libFolder + "c7-permissions-web"
      }
    },
    components: {
      "www": { // <------------------- because of www, routes.static goes /
        moduleName: "middlewareTest",
        // scope: "component",//either component(mesh aware) or module - default is module
        schema: {
          "exclusive": false,//means we dont dynamically share anything else
          "methods": {}
        },
        web: {
          routes: {
            "static": ["checkIndex","static"]
          }
        }
      }
    }
  };

  var mesh;

  before(function (done) {
    this.timeout(defaultTimeout);
    mesh = new Mesh();
    mesh.initialize(config, function (err) {
      if (err) return done(err);
      mesh.start(done);
    });
  });

  after(function (done) {
    mesh.stop(done);
  })

  var http = require('http');

  function doRequest(path, token, callback){

    var http_request_options = {
      host: '127.0.0.1',
      port:10000
    };

    http_request_options.path = path;

    http_request_options.headers = {'Cookie': ['happn_token=' + token]}

    http.request(http_request_options, callback).end();
  }


  it('fails to access a file, missing the token', function (done) {
    this.timeout(defaultTimeout);

    doRequest('/index.html', null, function(response){

      expect(response.statusCode).to.equal(403);
      done();

    });

  });

  var adminClient = new Mesh.MeshClient({secure:true, port:10000});

  it('logs in wth the admin user, we have a token - we can access the file', function (done) {
    
    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    }

    adminClient.login(credentials).then(function(){
      
      doRequest('/index.html', adminClient.token, function(response){

        expect(response.statusCode).to.equal(200);
        done();

      });
     
    }).catch(done);

  });

  it('creates a test user, fails to log in, add group with web permission and log in ok', function(done) {
    
    var testGroup = {
      name:'TESTUSER_' + test_id,
      
      custom_data:{
        customString:'custom1',
        customNumber:0
      },

      permissions:{
        web:{}
      }
    }

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    }

    adminClient.login(credentials).then(function(){
      
      adminClient.exchange.security.addGroup(testGroup, function(e, result){

        if (e) return done(e);

        testGroupSaved = result;
      
        var testUser = {
          username:'TEST_USER' + test_id,
          password:'TEST PWD',
          custom_data:{
            something: 'useful'
          }
        }

        adminClient.exchange.security.addUser(testUser, function(e, result){

            if (e) return done(e);
            testUserSaved = result;

            adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function(e){
              //we'll need to fetch user groups, do that later
              if (e) return done(e);

              testUserClient = new Mesh.MeshClient({secure:true, port:10000});

              testUserClient.login(testUser).then(function(){

                doRequest('/index.html', testUserClient.token, function(response){

                  expect(response.statusCode).to.equal(403);
                  
                  testGroupSaved.permissions.web = {
                    '/index.html':{actions:['get', 'put', 'post'], description:'a test web permission'}
                  };

                  adminClient.exchange.security.updateGroup(testGroupSaved, function(e, updated){

                    if (e) return done(e);

                     doRequest('/index.html', testUserClient.token, function(response){

                      expect(response.statusCode).to.equal(200);
                      done();

                     });

                  });


                });

              }).catch(function(e){
                done(e);
              });

            });

        });
      });
     
    }).catch(done);

  });

});
