[&#9664;](readme.md) contents | datalayer [&#9654;](datalayer.md)

## Configuration

Mesh configuration contains several sections.

* [Mesh Name](#mesh-name)
* [Utilities](#utilities)
* [DataLayer Config](#datalayer-config)
* [Endpoint Config](#endpoint-config)
* [Module Config](#module-config)
* [Component Config](#component-config)

These are arranged as a set of key/value pairs on the config object:

```javascript
config = {
    name: 'mesh',
    util: {},
    dataLayer: {},
    endpoints: {},
    modules: {},
    components: {}
}
```

### Mesh Name

The `config.name` is the name of __this__ MeshNode and serves to uniquely identify it in it's network.

If the name is unspecified and the mesh has no endpoints it will default the name to 'mesh'. If their are endpoints a random default name will be used.

### Utilities

#### Configuring the Logger

The MeshNode provides a [log4js](https://www.npmjs.com/package/log4js) logger configured as follows:

```javascript
  ...
  util: {
    logLevel: 'info',
    logFile: '/absolute/path/to/file.log',
    logDateFormat: 'yyyy-MM-dd hh:mm:ss',
    logLayout: '%d{yyyy-MM-dd hh:mm:ss} - %m',
    // logger: {},
    logStackTraces: false
  }
  ...
```

`logFile` - (optional) Must be absolute path. __If not present only the console will receive the log stream.__<br/>
`logDateFormat` - (optional) To override the date format in log messages.<br/>
`logLayout` - (optional) Define your own message [layout](https://github.com/nomiddlename/log4js-node/wiki/Layouts).<br/>
`logger` - (optional) Provide your own log4js config. All preceding config keys will have no affect.<br/>
`logStackTraces` - (optional) Prints the error stack. Default false.

__NOTE:__ Definining `util.logger` as empty `{}` will silence all logging.

#### Using the Logger

The logger is accessable on the global `UTILITIES`

```javascript
UTILITIES.log(message, level, componentName, obj)
```

`level` - (optional) Defaults to 'info'
`componentName` - (optional) Defaults to ''
`obj` - (optional) Object or Error


Alternatively mesh modules and components can use `UTILITIES.createLogger(name)`

* It does not create a new logger. It creates wrapper functions to call the existing logger more effeciently.
* It tests for `level enabled` before calling into the logger - this minimises the impact of excessive trace and debug usage. 

eg.

```javascript
module.exports = MyMeshModule;

function MyMeshModule() {
  this.log = UTILITIES.createLogger('MyMeshModule');
  // this.log.trace('', {});
  // this.log.debug('', {});
  // this.log.info('', {});
  // this.log.warn('', {});
  // this.log.errror('..', err);
  // this.log.fatal('..', err);

  //// UTILITIES.createLogger('MyMeshModule', this);
  //// this.info('') // it will stomp existing
}
MyMeshModule.prototype.m = function() {
  this.log.trace('m()');
}

```


### DataLayer Config

[&#9650;](#configuration)

See also: [What is the DataLayer?](datalayer.md#what-is-the-datalayer)

The `config.dataLayer` section can contain the following items (shown with defaults):

```javascript
  ...
  datalayer: {
    host: 'localhost',
    port: 8000,
    authTokenSecret: 'mesh',
    systemSecret: 'mesh',
    log_level: 'info|error|warning',
    setOptions: {
      noStore: true,
      timeout: 10000
    },
  }
  ...
```

`host` - The host (ip/interface) for __this__ MeshNode to listen on.<br/>
`port` - The port to listen on.<br/>
`authTokenSecret` - Used to encrypt the session webtoken. <br/>
`systemSecret` - Simple authentication. Other MeshNodes and browser clients use this secret to authenticate.</br>
`log_level` - __?????????????????????????????????????????__<br/>
`setOptions.noStore` - Flag to enable/disable storage of messages and calls between MeshNodes.<br/>
`setOptions.timeout` - Timeout for remote messaging and method calls.<br/>

__NOTE:__ The `config.dataLayer` section can be omitted if all defaults are acceptable.

### Endpoint Config

[&#9650;](#configuration)

See also: [What are Endpoints?](endpoints.md#mdwhat-are-endpoints)

The `config.endpoints` section should list all remote MeshNodes to which __this__ MeshNode should attach upon initialization - as follows:

```javascript
  ...
  endpoints: {
    'quay1-berth1-crane1': {
      host: 'crane1.berth1.quay1.harbour.com',
      port: 919,
      secret: 'ƒ¡ƒ†¥'
    },
    'quay1-berth2-crane1': {
      host: 'crane1.berth2.quay1.harbour.com',
      port: 919,
      secret: 'ƒ¡ƒ†¥'
    },
  }
  ...
```

The above attaches __this__ MeshNode to two remote MeshNodes.

`quay1-berth1-crane1` - The remote MeshNode's name (as configured in the remote's `config.name`)<br/>
`.host` - The remote MeshNode ip/hostname (as configured in the remote's `config.dataLayer.host`)<br/>
`.port` - The remote MeshNode post (as configured in the remote's `config.dataLayer.port`)<br/>
`.secret` - The remote MeshNode secret (as configured in the remote's `config.dataLayer.systemSecret`)<br/>

__NOTE:__ The `config.endpoints` section can be omitted if __this__ MeshNode attaches to no other.

### Module Config

[&#9650;](#configuration)

See also: [What are Modules?](modules.md#what-are-modules)

The `config.module` section should list modules to be loaded into the mesh as follows:

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

__NOTE:__ The `config.modules` section can be omitted if the [Components (see below)](#component-config) are calling modules that require no config and are named after their `require()` name.


### Component Config

[&#9650;](#configuration)

See also: [What are Components?](components.md#what-are-components)

The `config.components` section should list components to be loaded into the mesh. The full complement of possibly config looks as follows:

```javascript
  ...
  components: {
    'name-of-component': {
      moduleName: 'name-of-implementing-module',
      schema: {
        exclusive: true,
        startMethod: 'start',
        methods: [
          'start': {
            type: 'async',
            parameters: [
              {name: 'opts', required: true, value: {op:'tions'}},
              {name: 'optionalOpts'},
              {name: 'callback', required: true, type: 'callback'}
            ],
            callback: {
              parameters: [
                {name: 'error', type: "error"},
              ]
            }
          },
          'methodName1': {
            alias: 'mn1',
            parameters: [
              {name: 'opts', required: true, value: {op:'tions2'}},
              {name: 'callback', required: true, type: 'callback'}
            ]
          },
          'methodName2': {}
        ]
      },
      web: {

      }
    }
  }
  ...
```









