
var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;
var maximumPings = 1000;

var Mesh = require('../');
var test_id = Date.now() + '_' + require('shortid').generate();
var should = require('chai').should();

var dbFileName = libFolder + test_id + '.nedb';

describe('b1-advanced-security.js', function(done) {

  //this.timeout(10000);

  var mesh = require('../lib/mesh')();

  var config = {
    name:"testadvancedSecurity",
    dataLayer: {
      adminSecret:'test_id',
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
  //NB in browser is: new MeshClient();
  //in node is: require('happner').MeshClient;

  var securityManager;

  it('logs in with the admin user', function(done) {

      // Credentials for the login method
      var credentials = {
        username: 'ADMIN', // pending
        password: test_id
      }

      adminClient.login(credentials).then(function(){
        securityManager = adminClient.api.exchange.security;
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
      '/some/test/path':{actions:['*']},
      '/some/test/path*':{actions:['*']},
      '/some/test/path1':{actions:['get']},
      '/some/test/path2':{actions:['set']},
      '/some/test/path3':{actions:['on']},
      '/some/test/path4':{actions:['remove']},
    }
  }

  it('creates a test group, with some permissions', function(done) {

    securityManager.upsertGroup(testGroup, function(e, result){

      if (e) return callback(e);

      expect(result.name == testGroup.name).to.be(true);
      expect(result.custom_data.customString == testGroup.custom_data.customString).to.be(true);
      expect(result.custom_data.customNumber == testGroup.custom_data.customNumber).to.be(true);
      
      addedGroup = result;
      callback();

    });

  });

  it('creates a test user', function(done) {


   
  });



  it('adds test group to the test user', function(done) {

   
   
  });

});









