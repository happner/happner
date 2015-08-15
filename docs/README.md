## Configuration

Mesh configuration contains several sections.

* [Mesh Name](#mesh-name)
* [DataLayer Config](#datalayer-config)
* [Endpoint Config](#endpoint-config)
* [Proxy Config](#proxy-config)
* [Module Config](#module-config)
* [Component Config](#component-config)

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

### Mesh Name

pending

### DataLayer Config

[&#9650;](#configuration)

pending

### Endpoint Config

[&#9650;](#configuration)

See also: [What are Endpoints?](#pending)

pending

### Proxy Config

[&#9650;](#configuration)

See also: [What are Proxy?](#pending)

pending

### Module Config

[&#9650;](#configuration)

See also: [What are Modules?](#pending)

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

The above will result in the initialization of the two modules named `class-module` and `factory-module`. These names can then be used in the [Component Config](#component-config) to create components that use these modules.

The `path`, `construct` and `create` config elements are optional. When the `path` is unspecified the mesh initializer will assume that the module 


#### Modules from Classes

Use the `construct: {}` config element to initialize modules from Objects that require `new`. 


#### Modules from Factories

#### Defaults

### Component Config

[&#9650;](#configuration)

See also: [What are Components?](#pending)

pending
