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

  this.timeout(3000);

  var mesh = require('../lib/mesh')();

  var config = {
    name:"testadvancedSecurity",
    datalayer: {
      secure:true,
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

  var adminClient = new Mesh.MeshClient({secure:true});
  var testUserClient = new Mesh.MeshClient({secure:true});
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

  var testGroupSaved;

  it('creates a test group, with permissions to access the security component', function(done) {

    adminClient.exchange.security.addGroup(testGroup, function(e, result){

      if (e) return callback(e);

      expect(result.name == testGroup.name).to.be(true);
      expect(result.custom_data.customString == testGroup.custom_data.customString).to.be(true);
      expect(result.custom_data.customNumber == testGroup.custom_data.customNumber).to.be(true);
      
      testGroupSaved = result;
      done();

    });

  });

  var testUser = {
    username:'TEST USER@blah.com' + test_id,
    password:'TEST PWD',
    custom_data:{
      something: 'useful'
    }
  }

  var testUserSaved;
  
  it('creates a test user', function(done) {
     adminClient.exchange.security.addUser(testUser, function(e, result){

        if (e) return done(e);

        expect(result.username).to.be(testUser.username);
        testUserSaved = result;

        done();

     });

  });

  it('adds test group to the test user', function(done) {

    adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function(e){
      //we'll need to fetch user groups, do that later
      done(e);
    });

  });

  //var testSecurityManager;

  it('logs in with the test user', function(done) {
    //TODO - this is breaking because we dont have access to /mesh/schema/* - so all good, need to fix

    testUserClient.login(testUser).then(function(){

      //do some stuff with the security manager here
      //securityManager = testUserClient.exchange.security;
      //NB - we dont have the security checks on method/component calls yet

      done();
    }).catch(function(e){
      done(e);
    });

  });

  it('should fail to login with a bad user', function(done) {

    testUserClient.login({username:'naughty', password:'1234'}).then(function(){
      done(new Error('this was not meant to happn'));
    }).catch(function(e){

      done();

    });

  });

  it('should list all groups', function(done) {

    adminClient.exchange.security.listGroups('*', function(e, groups){
      
      if (e) return done(e);

      expect(groups.length).to.be(4);

      done();

    });

  });

  it('should list all users', function(done) {

    adminClient.exchange.security.listUsers('*', function(e, users){
      
      if (e) return done(e);

      expect(users.length).to.be(3);
      done();

    });

  });

  it('should get a specific user, with rolled up group data', function(done) {

    adminClient.exchange.security.getUser(testUserSaved.username, function(e, user){
      
      if (e) return done(e);

      expect(user.groups[testGroupSaved.name] != undefined).to.be(true);
      done();

    });

  });

  it('should list the mesh permissions', function(done) {

    adminClient.exchange.security.getSystemPermissions({nocache:true}, function(e, permissions){
      
      if (e) return done(e);

      console.log(permissions);

      expect(permissions.events != undefined).to.be(true);
      expect(permissions.methods != undefined).to.be(true);
      expect(permissions.web != undefined).to.be(true);

      done();

    });

  });

});

