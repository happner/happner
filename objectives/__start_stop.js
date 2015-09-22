
// Create hooks for starting and stoping meshes in test contexts
//
// eg.
//
//        var StartStop = require('/this/file');
//
//        StartStop.mesh(1, 'configName')  // create 1 mesh with specified config
//
//        .client(1)                       // (chained from above) Attach one client to the new mesh
//
//        .components                      // Late instert components (After mesh start)
//
//        .createAsClass(1, 'modulePath' 'componentName')
//


var ConfigFactory = require('./__config_factory');

// var meshes = []; // tricky on stop

var _mesh;

module.exports.mesh = function(count, configName) {
  if (count != 1) throw new Error('not yet implemented ++');

  configName = configName || 'fullSingle';

  before(function(done, Mesh) {
    this.timeout(1000);

    Mesh.start(ConfigFactory.mesh[configName]({
      name: 'mesh_name',
      port: 10001,
      endpoints: {}
    }))
    .then(function(mesh) {
      _mesh = mesh;
      mock('mesh', mesh);
      mock('Xm', mesh.exchange);
      mock('Em', mesh.event);
      mock('Dm', mesh.data);
    })
    .then(done).catch(done);
  });

  after(function(done, mesh) {
    mesh.stop().then(done).catch(done);
  });

  return module.exports; // chainable
}

module.exports.client = function(count) {
  if (count != 1) throw new Error('not yet implemented ++');

  before(function(done, Mesh) {
    this.timeout(1000);

    Mesh.MeshClient(10001)
    .then(function(client) {
      mock('client', client);
      mock('Xc', client.exchange);
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
      }).then(done).catch(done);
    });

    return components; // chainable .create()
  }


}
