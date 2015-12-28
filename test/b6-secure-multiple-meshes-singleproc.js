describe('start meshes', function () {

  var should = require('chai').should();
  var path = require('path');
  
  Mesh = require('../')

  var ownPath = path.join(__dirname, '../index.js');

  var SERVER_HOST = "localhost";
  var SERVER_PORT = 8092;
  var CLIENT_PORT = 8093;

  var SERVER_COMPONENT_NAME = "server";
  var SERVER_MESH_NAME = "server_mesh";

  var clientConfig = {
    name: 'client',
    dataLayer: {
      port: CLIENT_PORT
    },
    modules: {},
    components: {}
  };


  var serverConfig = {
    name: SERVER_MESH_NAME,
    dataLayer: {
      secure: true,
      adminPassword: 'password',
      port: SERVER_PORT
    },
    modules: {},
    components: {}
  };


  function getTestAdminGroup() {
    var testMethodPath = "/" + SERVER_MESH_NAME + "/" + SERVER_COMPONENT_NAME + "/testMethod";

    var testAdminGroup = {
      name: "Test Admin",
      permissions: {
        methods: {}
      }
    };

    testAdminGroup.permissions.methods[testMethodPath] = {authorized: true};

    return testAdminGroup;
  }

  var TestUser = {
    username: 'user@oem.com',
    password: 'TEST PWD'
  };

  var clientMesh;
  var serverMesh;

  before(function (done) {
    var savedUser = null;
    var savedGroup = null;

    this.timeout(10000);

    Mesh.create(serverConfig)
        .then(addGroup)
        .then(addUser)
        .then(linkUser)
        .then(createClient)
        .then(saveClient)
        .catch(function (err) {
          done(err);
        });

    function addGroup(server) {
      serverMesh = server;
      return serverMesh.exchange.security.addGroup(getTestAdminGroup());
    }

    function addUser(group) {
      savedGroup = group;
      return serverMesh.exchange.security.addUser(TestUser);
    }

    function linkUser(user) {
      savedUser = user;
      return serverMesh.exchange.security.linkGroup(savedGroup, savedUser);
    }

    function createClient() {
      return Mesh.create(clientConfig);
    }

    function saveClient(client) {
      clientMesh = client;
      done();
    }
  });


  after(function (done) {

    var stopServerMesh = function(){
      if (serverMesh) return serverMesh.stop(done);
      done();
    }

    if (clientMesh) clientMesh.stop(function(e){
      if (e) return done(e);
      stopServerMesh();
    });
    
  });

  it('should add a user to the first mesh (serverConfig)', function (done) {

    var credentials = {
      username: '_ADMIN',
      password: 'password'
    };

    var deviceDetails = {
      description: "FieldPoP test device",
      location: "Somewhere east of somewhere",
      name: "Test device 1"
    };

    var TestUser1 = {
      username: 'user1@oem.com',
      password: 'TEST PWD'
    };

    serverMesh.exchange.security.addUser(TestUser1, function (err){
      
      if (err) console.log(err);
      should.not.exist(err);

      done();

    });

  });

});
