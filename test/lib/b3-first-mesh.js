var Mesh = require('../../lib/mesh');

var config = {
  name: 'theFarawayTree',
  dataLayer: {
    secure: true,
    port: 51234,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    adminPassword: 'testb2'
  },
  endpoints: {},
  modules: {
    "remoteComponent": {
      path: __dirname + "/4-remote-component",
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

    console.log('spawn failed:::', err);

    console.log(err);
    process.exit(err.code || 1);
    return;
  }

  console.log('READY');

});
