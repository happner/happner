
// Create hooks for starting and stoping meshes in test contexts
//
// eg.
//
//        var StartStop = require('/this/file');
//
//        StartStop.createMesh(1, 'configName')  // create 1 mesh with specified config
//
//        .createClient(1)                       // (chained from above) Attach one client to the new mesh
//
//        .components                      // Late instert components (After mesh start)
//
//        .createAsClass(1, 'modulePath' 'componentName')
//


var ConfigFactory = require('./__config_factory');

// var meshes = []; // tricky on stop

var __mesh;

module.exports.createMesh = function(count, opts, configName) {
  if (count != 1) throw new Error('not yet implemented ++');

  if (typeof opts == 'string') {
    configName = opts;
    opts = {};
  }

  opts = opts || {};
  opts.port = opts.port || 10001;
  opts.name = opts.name || 'mesh_name';

  configName = configName || 'fullSingle';

  var _mesh;

  before(function(done, Mesh) {
    this.timeout(1000);

    Mesh.create(ConfigFactory.mesh[configName]({
      name: opts.name,
      port: opts.port,
      endpoints: {}
    }))
    .then(function(mesh) {
      __mesh = mesh;
      _mesh = mesh;
      mock('mesh', mesh);
      mock('Xm', mesh.exchange);
      mock('Em', mesh.event);
      mock('Dm', mesh.data);
    })
    .then(done).catch(done);
  });

  after(function(done) {   // <-------------------- BUG: objective: not running this.
    _mesh.stop().then(done).catch(done);
  });

  return module.exports; // chainable
}

module.exports.createClient = function(count, opts) {
  if (count != 1) throw new Error('not yet implemented ++');

  opts = opts || {};

  before(function(done, Mesh) {
    this.timeout(1000);

    Mesh.MeshClient(opts.port || 10001)
    .then(function(client) {
      mock('client', client);
      mock('Xc', client.exchange);
      mock('Ec', client.event);
    })
    .then(done).catch(done);
  })

  return module.exports;
}

var components;

module.exports.components = components = {

  createAsClass: function(count, componentName, modulePath) {
    if (count != 1) throw new Error('not yet implemented ++');

    if (typeof modulePath === 'undefined') {
      // Allow null modulepath, leads to moduleName being required
      modulePath = modulePath || 'happner-test-modules.AsLate';
    }
    componentName = componentName || 'late';

    before(function(done, mesh) {
      mesh._createElement({
        module: {
          name: componentName,
          config: {
            path: modulePath,
            construct: {
              parameters: [
                {value: 'ARGU'},
                {value: 'MENT'},
                {value: 'S'},
              ]
            }
          }
        },
        component: {
          name: componentName,
          config: {
            module: componentName,
          }
        }
      })
      .delay(50)
      .then(done).catch(done);
    });

    return components; // chainable .create()
  },

  createAsDefault: function(count, componentName) {
    if (count != 1) throw new Error('not yet implemented ++');

    before(function(done, mesh) {
      mesh._createElement({
        module: {
          name: 'happner-test-modules',
          config: {
            construct: {
              parameters: [
                {value: 'ARGU'},
                {value: 'MENT'},
                {value: 'S'},
              ]
            }
          }
        },
        component: {
          name: componentName,
          config: {
            module: 'happner-test-modules',
          }
        }
      })
      .delay(50)
      .then(done).catch(done);
    });

    return components; // chainable .create()
  }


}
