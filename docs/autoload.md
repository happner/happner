[&#9664;](modules.md) modules and components | event api [&#9654;](event.md)

## Autoloading and Defaulting

Modules can be packaged with a configuration file (`happner.js`) that is used by the loading MeshNode to default or autoload elements into the mesh.

The `happner.js` file should be placed into the module's root.

eg. (typical node_module with happner.js file)

```
lib/*
node_modules/*
index.js
package.json
happner.js
```

### happner.js file format

The `happner.js` can define an assortment of configs. Each config should define an element or suite of elements to be loaded into the mesh.

An element is the combination of a module and component definition.  

eg. (defining two configs)

```javascript
module.exports = {
  configs: {

    'configName1': {
      module: {
        name: 'module-name',
        config: {
          // module's config
        }
      },
      component: {
        name: 'module-name',
        config: {
          // component's config
        }
      }
    },

    // the following config will load multiple elements into the mesh

    'configName2': [
      {
        module: {/* with name: and config: (as above) */},
        component: {/* as above */},
      }, 
      {
        module: {},
        component: {},
      }
    ],

  }
}
```
