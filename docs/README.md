## Configuration

Mesh configuration contains several sections.

* [Name](#name)
* [DataLayer](#dataLayer)
* [Endpoints](#endpoints)
* [Proxy](#proxy)
* [Modules](#modules)
* [Components](#components)

These are arranged as a set of key/value pairs on the config object:

```javascript
config = {
    name: 'mesh-name',
    dataLayer: {},
    endpoints: {},
    proxy: {},
    modules: {},
    components: {}
}
```

### Name

pending

### DataLayer

pending

### Endpoints

pending

### Proxy

pending

### Modules

This section of config should list modules to be loaded into the mesh as follows:

```javascript
  ...
  modules: {
    'class-module': {
      path: '/path/to/module1',
      construct: {
        parameters: [
          {value: ''}
        ]
      }
    },
    'factory-module': {
      path: '/path/to/module2',
      create: {
        parameters: [
          {value: ''}
        ]
      }
    }
  }
  ...
```

#### Modules from Classes

#### Modules from Factories

### Components

pending
