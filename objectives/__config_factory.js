// Uses devDependency node_modules/happner-test-modules to create mesh configs.


module.exports.mesh = {

  fullSingle: function(opts) {

    // One of each "class, factory and module" components

    var name = opts.name || 'mesh_name';
    var port = opts.port || 12345;
    var endpoints = opts.endpoints || {};

    return config = {

      name: name,

      port: port,

      endpoints: endpoints,

      modules: {
        'module-as-class': {
          path: 'happner-test-modules',
          construct: {
            name: 'AsClass',
            parameters: [
              {value: 'ARG'},
              {value: 'U'},
              {value: 'MENTS'}
            ]
          }
        },
        'module-as-async-factory': {
          path: 'happner-test-modules.AsFactory',
          create: {
            name: 'asyncCreate',
            type: 'async',
            parameters: [
              {value: 'ARG'},
              {value: 'U'},
              {value: 'MENTS'}
            ] 
          }
        },
        'module-as-sync-factory': {
          path: 'happner-test-modules.AsFactory',
          create: {
            name: 'syncCreate',
            // type: 'sync',
            parameters: [
              {value: 'ARG'},
              {value: 'U'},
              {value: 'MENTS'}
            ] 
          }
        },
        'module-as-module': {
          path: 'happner-test-modules.AsModule'
        }
      },
      components: {
        'as_class': {
          moduleName: 'module-as-class',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_async_factory': {
          moduleName: 'module-as-async-factory',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_sync_factory': {
          moduleName: 'module-as-sync-factory',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_module': {
          moduleName: 'module-as-module',
          startMethod: 'start',
          stopMethod: 'stop'
        },
      }
    }
  },


  fullDouble: function(opts) {

    // Two of each "class, factory and module" components

    var name = opts.name || 'mesh_name';
    var port = opts.port || 12345;
    var endpoints = opts.endpoints || {};

    return config = {

      name: name,

      port: port,

      endpoints: endpoints,

      modules: {
        'module-as-class': {
          path: 'happner-test-modules',
          construct: {
            name: 'AsClass',
            parameters: [
              {value: 'ARG'},
              {value: 'U'},
              {value: 'MENTS'}
            ]
          }
        },
        'module-as-async-factory': {
          path: 'happner-test-modules.AsFactory',
          create: {
            name: 'asyncCreate',
            type: 'async',
            parameters: [
              {value: 'ARG'},
              {value: 'U'},
              {value: 'MENTS'}
            ] 
          }
        },
        'module-as-sync-factory': {
          path: 'happner-test-modules.AsFactory',
          create: {
            name: 'syncCreate',
            // type: 'sync',
            parameters: [
              {value: 'ARG'},
              {value: 'U'},
              {value: 'MENTS'}
            ] 
          }
        },
        'module-as-module': {
          path: 'happner-test-modules.AsModule'
        }
      },
      components: {
        'as_class_1': {
          moduleName: 'module-as-class',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_class_2': {
          moduleName: 'module-as-class',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_async_factory_1': {
          moduleName: 'module-as-async-factory',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_async_factory_2': {
          moduleName: 'module-as-async-factory',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_sync_factory_1': {
          moduleName: 'module-as-sync-factory',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_sync_factory_2': {
          moduleName: 'module-as-sync-factory',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_module_1': {
          moduleName: 'module-as-module',
          startMethod: 'start',
          stopMethod: 'stop'
        },
        'as_module_2': {
          moduleName: 'module-as-module',
          startMethod: 'start',
          stopMethod: 'stop'
        },
      }

    }

  }

}