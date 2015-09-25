var Mesh = require('../../lib/system/mesh');

var config = {
  name: 'mesh1',
  dataLayer: {
    port: 3001,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  modules: {
    'module1': {
      path: __dirname + '/13-module1'
    }
  },
  components: {
    'component1': {
      moduleName: 'module1'
    }
  }
}

(new Mesh()).initialize(config, function(err) {

  if (err) {
    console.log(err);
    process.exit(err.code || 1);
  }

  console.log('READY');

});
