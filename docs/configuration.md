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

This is the name of the mesh and serves to uniquely identify it in it's network.

### DataLayer Config

[&#9650;](#configuration)

See also: [What is the DataLayer?](datalayer.md#what-is-the-datalayer)

The dataLayer config section can contain the following items:

```javascript
  ...
  datalayer: {
    host: 'localhost',
    port: 8000,
    authTokenSecret: 'a256a2fd43bf441483c5177fc85fd9d3',
    systemSecret: 'mesh',
    log_level: 'info|error|warning',
    setOptions: {
      noStore: true,
      timeout: 10000
    },
  }
  ...
```

`host` - The host (ip/interface) for this mesh to listen on. __Defaults to 'localhost'.__ <br/>
`port` - The port to listen on. __Defaults to 8000.__ <br/>
`authTokenSecret` - Used to ??? __Defaults to 'a256a2fd43bf441483c5177fc85fd9d3__' <br/>
`systemSecret` - Simple authentication for remote MeshNodes and browser clients to attach to this MeshNode. __Defaults to 'mesh'__</br>
`log_level` - Just that. __Defaults to 'info|error|warning'__<br/>
`setOptions.noStore` - Flag to enable/disable storage of messages between MeshNodes. __Default to true__ <br/>
`setOptions.timeout` - Timeout for remote messaging and method calls. __Defaults to 10000__<br/>

The dataLayer config section need not be specified at all if all defaults are acceptable.

### Endpoint Config

[&#9650;](#configuration)

See also: [What are Endpoints?](endpoints.md#mdwhat-are-endpoints)

pending

### Proxy Config

[&#9650;](#configuration)

See also: [What is the Proxy Pipeline?](proxy.md#what-is-the-proxy-pipeline)

pending

### Module Config

[&#9650;](#configuration)

See also: [What are Modules?](modules.md#what-are-modules)

This section of config should list modules to be loaded into the mesh as follows:

```javascript
  ...
  modules: {
    'class-module': {
      path: '/path/to/module1',
      construct: {  // <------------- versus
        parameters: [
          {value: ''}
        ]
      }
    },
    'factory-module': {
      path: '/path/to/module2',
      create: {     // <------------- versus
        parameters: [
          {value: ''}
        ]
      }
    }
  }
  ...
```

The above will result in the initialization of the two modules named `class-module` and `factory-module`. These names can then be used in the [Component Config](#component-config) to create mesh components that use these modules.

The `path`, `construct` and `create` config elements are only necessary as follows:

* `path` - If unspecified the mesh initializer will assume that the module name is the same as the `node_module` name and will be called by `require()` as is.
* `construct` - Need only be specified if the module definition is a `class` and the defaults don't apply. <br/>See [Modules from Classes](modules-from-classes) below.
* `create` - Will need to be specified if the module should be created using a factory function. <br/>See [Modules from Factories](#modules-from-factories) below.

#### Modules from Classes

Use the `construct: {}` config element to initialize modules from Objects that require `new`.

The full config set looks something like this:

```javascript
  ...
  'module-name': {
    construct: {
      name: 'SomeThing',
      parameters: [
        {name: 'param1', value: 'A'},
        {name: 'param2', value: 'B'}
      ]
    }
  }
  ...
```

The `name` and `parameters` config elements are only necessary as follows:

* `name` - Need only be specified if the class to be instantiated is nested within the module.<br/>eg. `new moduleName.SomeThing()` as opposed to `new moduleName()`
* `parameters` - Need only be specified if arguments should be passed to the constructor.<br/>eg. `new moduleName.SomeThing('A', 'B')`<br/>Note that the `parameters.name` serves only informationally and is not reqired, the args are positioned into the constructor per their position in the parameters array.

##### Example cases.
###### Example 1 (default as class)
__in__ `node_modules/module-name/index.js`
```javascript
module.exports = ModuleName;
function ModuleName() {}
ModuleName.prototype.method = function() {}
```
```javascript
  ...
  modules: {
    'module-name': {}
  }
  ...
```

###### Example 2 (nested class)
__in__ `./lib/module-name.js`
```javascript
module.exports.SomeThing = SomeThing;
function SomeThing(param1) {
  this.param1 = param1;
}
SomeThing.prototype.method = function() {
  this.param1;
}
```
```javascript
  ...
  modules: {
    'some-thing': {
      path: __dirname + '/lib/module-name.js',
      construct: {
        name: 'SomeThing',
        parameters: [
          {name: 'param1', value: 'A'}
        ]
      }
    }
  }
  ...
```

###### Example 3 (class factory)
__in__ `./lib/module.js`
```javascript
module.exports = function(param1) {
  return new SomeThing(param1)
}
function SomeThing(param1) {
  this.param1 = param1;
}
SomeThing.prototype.method = function() {
  this.param1;
}
```
```javascript
  ...
  modules: {
    'some-thing': {
      path: __dirname + '/lib/module.js',
      construct: {
        parameters: [
          {name: 'param1', value: 'A'}
        ]
      }
    }
  }
  ...
```

#### Modules from Factories

Use the `create: {}` config element to initialize modules from synchronous or asynchronous functions that return or callback with the module definition.

The full config set looks something like this:

```javascript
  ...
  'module-name': {
    path: '...',
    create: {
      name: 'createObject',
      type: 'async',
      parameters: [
        {name: 'param1', value: 'A'},
        {name: 'param2', value: 'B'},
        {name: 'callback', parameterType: 'callback'}
      ],
      callback: {
        parameters: [
          {name: 'err', parameterType: 'error'},
          {name: 'res', parameterType: 'instance'}
        ]
      }
    }
  }
  ...
```

Most of the above config is only necessary in cases where modules being initialized deviate from popular norms.

* `type` - is necessary only to specify asynchronous. It defaults to `sync`.
* `parameters` - is only necessary if args need to be passed.
* `parameters.callback` - of `parameterType: 'callback'` is only necessary if the callback is in a peculiar argument position. It will default into the last position and need not be specified even when specifying the preceding args.
* `callback` - with `parameters` need only be specified if the callback employs something other than the standard `(error, result)` signature. The `result` is assumed to be the module `instance` to be used by the mesh.

##### Example cases.
###### Example 1 (async factory)
__in__ `node_modules/module-name/index.js`
```javascript
module.exports.createThing = function(param1, callback) {
  SomeKindOfRemoteThing.get(param1, function(err, instance) {
    callback(err, instance);
  });
}
```
```javascript
  ...
  'module-name': {
    create: {
      name: 'createThing',
      type: 'async',
      parameters: [
        {name: 'param1', value: 'https://www.'},
      ]
    }
  }
  ...
```

#### Modules from Modules

The most simple case. Modules are used directly as exported.

eg.

__in__ `node_modules/module-name/index.js`
```javascript
module.exports.method1 = function() {}
module.exports.method2 = function() {}
```
```javascript
  ...
  modules: {
    'module-name': {}
  }
  ...
```

#### TODO Modules from Instance

(something like) eg.

```javascript
  ...
  modules: {
    'module-name': {
      instance: {
        method1: function($happn) {}
      }
    }
  }
  ...
```


### Component Config

[&#9650;](#configuration)

See also: [What are Components?](components.md#what-are-components)

pending
