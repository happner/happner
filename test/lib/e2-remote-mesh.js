process.env.LOG_LEVEL = 'info';

var Mesh = require('../../lib/mesh');

var config = {
  name: 'remoteMeshE2',
  dataLayer: {
    port: 3030,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    secure: true,
    adminPassword: 'guessme',
  },
  endpoints: {},
  modules: {
    "remoteComponent": {
      path: __dirname + "/e2-remote-component",
      constructor: {
        type: "sync",
        parameters: []
      }
    }
  },
  components: {
    "remoteComponent": {
      moduleName: "remoteComponent",
      schema: {
        "exclusive": false,
        "methods": {
          "remoteFunction": {
            parameters: [
              {name: 'one', required: true},
              {name: 'two', required: true},
              {name: 'three', required: true},
              {name: 'callback', type: 'callback', required: true}
            ]
          }
          ,
          "causeError": {
            parameters: [
              {name: 'callback', type: 'callback', required: true}
            ]
          }
        }
      }
    }
  }
};

Mesh.create(config)
  .then(function () {
    console.log('READY');
  })
  .catch(function (err) {
    console.log(err);
    process.exit(err.code || 1);
  });
