var expect = require('expect.js');
var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;
var maximumPings = 1000;

var Mesh = require('../');
var test_id = Date.now() + '_' + require('shortid').generate();
var should = require('chai').should();

var dbFileName = __dirname + sep + 'temp/' + test_id + '.nedb';
var fs = require('fs-extra');

describe('b1-advanced-security.js', function(done) {

  //this.timeout(10000);

  var mesh = require('../lib/mesh')();

  var config = {
    name:"testadvancedSecurity",
    datalayer: {
      adminPassword: test_id,
      log_level: 'info|error|warning',
      filename:dbFileName
    }
  };

  after(function(done){
    fs.unlink(dbFileName, function(e){
      if (e) return callback(e);
      mesh.stop(done);
    });
  });

  before(function(done){

    mesh = new Mesh();
    mesh.initialize(config, function(err) {
      if (err) {
        console.log(err.stack);
        done(err);
      } else {
        mesh.start(done);
      }
    });

  });

  var adminClient = new Mesh.MeshClient();
  var testUserClient = new Mesh.MeshClient();
  //NB in browser is: new MeshClient();
  //in node is: require('happner').MeshClient;

  it('logs in with the admin user', function(done) {

      // Credentials for the login method
      var credentials = {
        username: '_ADMIN', // pending
        password: test_id
      }

      adminClient.login(credentials).then(function(){
        done();
      }).catch(done);

  });

  var testGroup = {
    name:'TEST GROUP' + test_id,
    
    custom_data:{
      customString:'custom1',
      customNumber:0
    },

    permissions:{
      methods:[
        //in a /Mesh name/component name/method name - with possible wildcards
        '/testadvancedSecurity/security/*'
      ],
      events:[
         //in a /Mesh name/component name/event key - with possible wildcards
         '/testadvancedSecurity/security/*'
      ]
    }
  }

  it('creates a test group, with permissions to access the security component', function(done) {

    adminClient.exchange.security.addGroup(testGroup, function(e, result){

      if (e) return callback(e);

      expect(result.name == testGroup.name).to.be(true);
      expect(result.custom_data.customString == testGroup.custom_data.customString).to.be(true);
      expect(result.custom_data.customNumber == testGroup.custom_data.customNumber).to.be(true);
      
      addedGroup = result;
      done();

    });

  });

  var testUser = {
    username:'TEST USER@blah.com' + test_id,
    password:'TEST PWD',
    custom_data:{
      something: 'usefull'
    }
  }

  it('creates a test user', function(done) {
     adminClient.exchange.security.addUser(testUser, function(e, result){
        if (e) return done(e);

        expect(result.username).to.be(testUser.username);
        expect(result.password).to.be(undefined);

        done();

     });

  });

  it('adds test group to the test user', function(done) {

    adminClient.exchange.security.linkGroup(testGroup, testUser, function(e){
      //we'll need to fetch user groups, do that later
      done(e);
    });

  });

  //var testSecurityManager;

  it('logs in with the test user', function(done) {

    testUserClient.login(testUser).then(function(){

      //do some stuff with the security manager here
      //securityManager = testUserClient.exchange.security;
      //NB - we dont have the security checks on method/component calls yet

      done();
    }).catch(done);

  });

  it('should fail to login with a bad user', function(done) {

    testUserClient.login({username:'naughty', password:'1234'}).then(function(){
      done(new Error('this was not meant to happn'));
    }).catch(function(e){

      done();

    });

  });

});

