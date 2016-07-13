// node 7-client-example-process.js
// http://localhost:3001/ExampleMesh/ExampleComponent/ExampleFunction


var Mesh = require('../../lib/system/mesh');
var sep = require('path').sep;

var config = {
  name: 'ExampleMesh',
  dataLayer: {
    port: 3001,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
  },
  endpoints: {},
  modules: {
    "example": {
      path: __dirname + "/7-client-example",
      constructor: {
        type: "sync",
        parameters: []
      }
    }
  },

  components: {

    "api": {
      moduleName: "api",
      scope: "component",
      schema: {
        "exclusive": false
      },
      web: {
        routes: {
          // http://localhost:3001/ExampleMesh/api/client
          "client": "handleRequest"
        }
      }
    },

    "ExampleComponent": {
      moduleName: "example",
      schema: {
        methods: {
          apiFunction: {
            parameters: [
              {name: 'arg1', required: true},
              {name: 'callback', type: 'callback', required: true}
            ]
          }
        }
      },
      web: {
        routes: {
          // http://localhost:3001/ExampleMesh/ExampleComponent/staticContent/test.html
          "staticContent": "static",

          // http://localhost:3001/ExampleMesh/ExampleComponent/ExampleFunction
          "ExampleFunction": "webFunction"
        }
      }
    }

  }
};

console.log('REMOTE STARTING, port:', 3001);
(mesh = new Mesh()).initialize(config, function (e) {

  if (e) {
    console.log(e.stack);
    process.exit(e.code || 1);
  }

  console.log('REMOTE READY');

});
