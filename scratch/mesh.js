process.env.DEBUG='*'

var config = {
  name: 'mesh1',
  dataLayer: {
    port: 3001,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'SEcREt',
    log_level: 'info|error|warning',
    setOptions: {
      timeout: 50000
    },
  },
  modules: {
    module1: {
      path: __dirname + '/module1'
    }
  },
  components: {
    component1: {
      moduleName: 'module1',
      web: {
        routes: {
          // http://localhost:3001/mesh1/component1/app/index.html
          'app': 'static'
        }
      }
    }
  }
}

var Mesh = require('../')
mesh = Mesh()
mesh.initialize(config, callback);

function callback(err) {
  if (err) {
    console.log(err);
    process.exit(err.errno);
  }

  mesh.api.exchange.mesh1.component1.start(function(err, res) {
    console.log(err);
    console.log('module config', res.config);
  });
  
}
