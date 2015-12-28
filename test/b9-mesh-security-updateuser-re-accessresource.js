var should = require('chai').should();
var path = require('path');

var meshpath = path.join(__dirname, '../lib/mesh')

var happner = require(meshpath);


var clientPath = path.join(__dirname, 'lib/b9-client.js');
var serverPath = path.join(__dirname, 'lib/b9-server.js');

var Mesh = require(meshpath);

//var ownPath = path.join(__dirname, '../index.js');

var SERVER_HOST = "localhost";
var SERVER_PORT = 8092;
var CLIENT_PORT = 8093;

var SERVER_COMPONENT_NAME = "server";
var SERVER_MESH_NAME = "server_mesh_2";

var DEVICE_KEEPALIVE_INTERVAL = 1000;
var TUNNEL_HEALTH_INTERVAL = 5000;
var TUNNEL_SERVICE_ENDPOINT = "ws://192.168.1.5:8000";

var clientConfig = {
  name: 'client',
  dataLayer: {
    port: CLIENT_PORT,
    persist: true,
    defaultRoute: "mem"
  },
  modules: {
    client: {
      path: clientPath
    }
  },
  components: {
    data: {},
    client: {
      name: "client",
      moduleName: "client",
      scope: "component",
      startMethod: "start",
      schema: {
        "exclusive": false,
        "methods": {
          "start": {
            type: "async",
            parameters: [
              {
                "name": "options",
                "required": true,
                value: {
                  serverMeshPort: SERVER_PORT,
                  serverMeshHost: SERVER_HOST,
                  serverComponentName: SERVER_COMPONENT_NAME
                }
              }
            ]
          }
        }
      }
    }
  }
};


var serverConfig = {
  name: SERVER_MESH_NAME,
  dataLayer: {
    secure: true,
    adminPassword: 'password',
    port: SERVER_PORT
  },
  modules: {
    server: {
      path: serverPath
    }
  },
  components: {
    data: {},
    server: {
      name: 'server',
      scope: "component",
      startMethod: "start",
      schema: {
        "exclusive": false,
        "methods": {
          "start": {
            type: "sync",
            parameters: [
              {
                "name": "options", "required": true, value: {
                deviceKeepaliveInterval: DEVICE_KEEPALIVE_INTERVAL,
                tunnelHealthInterval: TUNNEL_HEALTH_INTERVAL,
                tunnelServiceEndpoint: TUNNEL_SERVICE_ENDPOINT
              }
              }
            ]
          }
        }
      }
    }
  }
};

describe('cc-mesh-client-security-login', function() {


  var clientMesh;
  var serverMesh;

  before(function (done) {
    var savedUser = null;
    var savedGroup = null;
    this.timeout(100000);

    happner.create(serverConfig)
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
      return serverMesh.exchange.security.addGroup(getOemAdminGroup());
    }

    function addUser(group) {
      savedGroup = group;
      return serverMesh.exchange.security.addUser(OemUser);
    }

    function linkUser(user) {
      savedUser = user;
      return serverMesh.exchange.security.linkGroup(savedGroup, savedUser);
    }

    function createClient() {
      return happner.create(clientConfig);
    }

    function saveClient(client) {
      clientMesh = client;
      done();
    }
  });

  // it('a - client should register a device on the server', function (done) {
  //   this.timeout(5000);

  //   var device = {
  //     device_info: "someInfo"
  //   };

  //   clientMesh.exchange.client.registerDevice(OemUser, device, function(err){
  //     if(err) console.log(err);
  //     should.not.exist(err);

  //     console.log('device registered:::');

  //     clientMesh.exchange.client.requestSomethingSpecial("some_data", function(err, data){
  //       if(err) console.log(err);

  //       should.not.exist(err);
  //       data.should.eql('success');

  //       console.log('requestSomethingSpecial ok:::');

  //       device = {
  //         device_info: "some New Info"
  //       };

  //       clientMesh.exchange.client.registerDevice(OemUser, device, function(err){
  //         if(err) console.log(err);
  //         should.not.exist(err);

  //         console.log('device registered again:::');



  //         clientMesh.exchange.client.requestSomethingSpecial("some_data", function(err, data){
  //           if(err) console.log(err);
  //           should.not.exist(err);
  //           data.should.eql('success');

  //           done();
  //         });


  //       });
  //     });
  //   });
  // });

  //  it('a - client should register a device on the server', function (done) {
  //   this.timeout(5000);

  //   var device = {
  //     device_info: "someInfo"
  //   };

  //   clientMesh.exchange.client.registerDevice(OemUser, device, function(err){
  //     if(err) console.log(err);
  //     should.not.exist(err);

  //     console.log('device registered:::');

  //     clientMesh.exchange.client.requestSomethingSpecial("some_data", function(err, data){
  //       if(err) console.log(err);

  //       should.not.exist(err);
  //       data.should.eql('success');

  //       console.log('requestSomethingSpecial ok:::');

  //       clientMesh.exchange.client.requestSomethingSpecial("some_data", function(err, data){

  //           if(err) console.log(err);
  //           should.not.exist(err);
  //           data.should.eql('success');

  //           done();
  //         });
  //       });
  //   });
  // });

  it('a - client should register a device on the server', function (done) {
    this.timeout(5000);

    var device = {
      device_info: "someInfo"
    };

    clientMesh.exchange.client.registerDevice(OemUser, device, function(err){
      if(err) console.log(err);
      should.not.exist(err);

      console.log('device registered:::');

      clientMesh.exchange.client.requestSomethingSpecial("some_data", function(err, data){
        if(err) console.log(err);

        should.not.exist(err);
        data.should.eql('success');

        console.log('requestSomethingSpecial ok:::');

        device = {
          device_info: "some New Info"
        };

        clientMesh.exchange.client.registerDevice(OemUser, device, function(err){
          if(err) console.log(err);
          should.not.exist(err);

          console.log('device registered again:::');

          clientMesh.exchange.client.requestSomethingSpecial("some_data", function(err, data){

            console.log('final request:::', arguments);

            if(err) console.log(err);
            should.not.exist(err);
            data.should.eql('success');

            done();
          });
        });
      });
    });
  });

  });

//   it('a - client should register a device on the server', function (done) {
//     this.timeout(5000);

//     var device = {
//       device_info: "someInfo"
//     };

//     clientMesh.exchange.client.registerDevice(OemUser, device, function(err){
//       if(err) console.log(err);
//       should.not.exist(err);

//       console.log('device registered:::');

//       clientMesh.exchange.client.requestSomethingSpecial("some_data", function(err, data){
//         if(err) console.log(err);

//         should.not.exist(err);
//         data.should.eql('success');

//         console.log('requestSomethingSpecial ok:::');

//         device = {
//           device_info: "some New Info"
//         };

//         clientMesh.exchange.client.registerDevice(OemUser, device, function(err){
//           if(err) console.log(err);
//           should.not.exist(err);

//           console.log('device registered again:::');

//           var _testClient = new Mesh.MeshClient({
//             secure: true,
//             port: SERVER_PORT,
//             hostname: '127.0.0.1'
//           });

//           _testClient.login({username:'user', password:'password'}).then(function () {
//             console.log('logged in as _testClient:::');

//             _testClient.exchange.server_mesh_2.server.doSomethingSpecial("some_data", function(err, data){

//               console.log('final request:::', arguments);

//               if(err) console.log(err);
//               should.not.exist(err);
//               data.should.eql('success');

//               done();
//             });
            
//           }).catch(function (err) {
//             console.log("login error");
//             done(err);
//           });

          
//         });
//       });
//     });
//   });

// });


function getOemAdminGroup() {
  var regesterDeviceMethodPath = "/" + SERVER_MESH_NAME + "/" + SERVER_COMPONENT_NAME + "/registerDevice";

  var oemAdminGroup = {
    name: "OEM Admin",
    permissions: {
      methods: {}
    }
  };

  oemAdminGroup.permissions.methods[regesterDeviceMethodPath] = {authorized: true};

  return oemAdminGroup;
}

var OemUser = {
  username: 'user',
  password: 'password',
  customData: {
    oem: "OEM A",
    company: "Enterprise X"
  }
};