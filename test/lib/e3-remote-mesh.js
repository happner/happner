var Mesh = require('../../lib/mesh');

var config = {
  name: 'remoteMesh',
  dataLayer: {
    port: 10001
  },
  endpoints: {},
  modules: {
    "remoteComponent": {
      path: __dirname + "/e3-remote-component",
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

(new Mesh()).initialize(config, function (err) {

  if (err) {
    console.log(err);
    process.exit(err.code || 1);
    return;
  }

  console.log('READY');

});
