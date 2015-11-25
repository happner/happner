describe('b1-advanced-security.js', function(done) {

  this.timeout(3000);

  var expect = require('expect.js');
  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;
  var maximumPings = 1000;

  var Mesh = require('../');
  var test_id = Date.now() + '_' + require('shortid').generate();
  var should = require('chai').should();

  var dbFileName = __dirname + sep + 'temp/' + test_id + '.nedb';
  var fs = require('fs-extra');

  var mesh = new Mesh();

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
      if (e) return done(e);
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
      methods:{
        //in a /Mesh name/component name/method name - with possible wildcards
        '/testadvancedSecurity/security/*':{authorized:true}
      },
      events:{
         //in a /Mesh name/component name/event key - with possible wildcards
         '/testadvancedSecurity/security/*':{authorized:true}
      }
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

  it('logs in with the test user', function(done) {
    
    testUserClient.login(testUser).then(function(){

      //do some stuff with the security manager here
      //securityManager = testUserClient.exchange.security;
      //NB - we dont have the security checks on method/component calls yet

      done();
    }).catch(function(e){
      done(e);
    });

  });

  it('changes the password and custom data for the test user, then logs in with the new password', function(done) {
    
    var updatedPassword = 'PWD-UPD';

    testUserSaved.password = updatedPassword;
    testUserSaved.custom_data = {'changedCustom':'changedCustom'};

    adminClient.exchange.security.updateUser(testUserSaved, function(e, result){

      if (e) return done(e);
      expect(result.custom_data.changedCustom).to.be('changedCustom');
      testUserClient.login(testUserSaved).then(done).catch(done);

    });

  });

  it('fails to modify permissions using a non-admin user', function(done) {
    
     var testGroup = {
      name:'B1USER_NONADMIN' + test_id,
      
      custom_data:{
        customString:'custom1',
        customNumber:0
      },

      permissions:{
        methods:{},
        events:{}
      }
    }

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    adminClient.exchange.security.addGroup(testGroup, function(e, result){

      if (e) return done(e);

      testGroupSaved = result;
    
      var testUser = {
        username:'B1USER_NONADMIN' + test_id,
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
  
            if (e) return done(e);

            testUserClient = new Mesh.MeshClient({secure:true});

            testUserClient.login(testUser).then(function(){

            testUserClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function(e, result){
      
                if (!e)
                   return done(new Error('this was not meant to happn'));

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

      expect(groups.length).to.be(5);

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


  it('delete a user, fail to access the system with the deleted user', function(done) {

    adminClient.exchange.security.deleteUser(testUserSaved, function(e, result){
      
      if (e) return done(e);

      testUserClient.login({username:testUserSaved.username, password:'PWD-UPD'}).then(function(){
        done(new Error('this was not meant to happn'));
      }).catch(function(e){

        expect(e.toString()).to.be('AccessDenied: Invalid credentials');
        done();

      });

    });

  });

  //deleteUser

});

