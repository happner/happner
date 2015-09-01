var Mesh = require('../../lib/mesh');

var config = {
  name: 'system17',
  dataLayer: {
    port: 3001,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning'
  },
  modules: {
    'stress-module': {
      path: __dirname + '/17-system-stress-module'
    }
  },
  components: {
    'stress-module': {
    }
  }
}

Mesh().initialize(config, function(err) {

  if (err) {
    console.log(err);
    process.exit(err.code || 1);
  }

  console.log('go to http://localhost:3001/system17/system/app/dashboard.html');
  console.log('READY');
  

});
