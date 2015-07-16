var Mesh = require('../../lib/system/mesh');
var meshName = 'mesh' + process.argv[2];

var config = {
  name: meshName,
  dataLayer: {
    port: 3000 + parseInt(process.argv[2]),
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  modules: {
    'module': {
      path: __dirname + '/10-module'
    }
  },
  components: {
    'component': {
      moduleName: 'module'
    }
  }
}

Mesh().initialize(config, function(err, m) {
  if (err) {
    console.log(err);
    process.exit(err.code || 1);
  }
  console.log('READY');
});
