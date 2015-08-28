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

If the name is unspecified a random name will be used.

__BUG:__ Currently the clients do not fully re-establish connections to restarted nodes with a new random name.

### Utilities

#### Configuring the Logger

The MeshNode provides a [log4js](https://www.npmjs.com/package/log4js) logger.

There are configuration opportunities as follows:

```javascript
  // defaults
```

Or.

```javascript
  ...
  util: {
    logLevel: 'info',
    logFile: '/absolute/path/to/file.log',
    logDateFormat: 'yyyy-MM-dd hh:mm:ss',
    logLayout: '%d{yyyy-MM-dd hh:mm:ss} - %m',
    // logger: {}, // will silence all logging
    logStackTraces: false,
    logComponents: ['component', 'names'],
    logTimeDelta: false,
    logMessageDelimiter: '\t',
  }
  ...
```

###### logLevel
Default 'info' or LOG_LEVEL environment variable value<br/>
Options include: __all__ __trace__ __debug__ __info__ __warn__ __error__ __fatal__ __off__.

```javascript
LOG_LEVEL=debug bin/my.mesh
```

###### logFile
Must be absolute path.<br/>
__If not present only the console will receive the log stream.__

###### logDateFormat
To override the date format in log messages.

###### logLayout
Define your own message [layout](https://github.com/nomiddlename/log4js-node/wiki/Layouts).

###### logger
Provide your own log4js config.<br/>

###### logStackTraces
Prints the error stack. Default false.

###### logComponents
Prints __debug__ and __trace__ messages for only the listed names.

###### logTimeDelta
Includes 'milliseconds since last log message' in log message.

###### logMessageDelimiter
Delimits between timeDelta, componentName and message in log lines.


#### Using the Logger

##### Method 1

Modules and components can use the global `UTILITIES.createLogger(name, obj)`

* It does not create a new logger. It creates wrapper functions to call the existing logger more effeciently.
* It uses logLevel guards to minimise the impact of liberal trace and debug usage.
* If `obj` is provided, log methods will be created on `obj`

eg.

```javascript
module.exports = MyMeshModule;

function MyMeshModule() {
  this.log = UTILITIES.createLogger('MyMeshModule');
  // this.log.$$TRACE('', {});
  // this.log.$$DEBUG('', {});
  // this.log.info('', {});
  // this.log.warn('', {});
  // this.log.errror('..', err);
  // this.log.fatal('..', err);

  //// UTILITIES.createLogger('MyMeshModule', this);
  //// this.info('') // it will stomp existing functions on 'this'
}
MyMeshModule.prototype.m = function() {
  this.log.$$TRACE('m()');
}
```

##### Method 2

Components can access their own logger in `$happn` (as injected by the mesh, see [Mesh Awareness](modules.md#mesh-awareness-with-happn))

eg.

```javascript
module.exports = MyMeshModule;
function MyMeshModule() {}
MyMeshModule.prototype.m = function($happn) {
  $happn.log.$$TRACE('m()');
}
```

The `$$TRACE()` and `$$DEBUG()` are so named to enable optionally __FULLY__ productionizing with the following deployment step:

##### Remove all calls to DEBUG and TRACE

This is not paticularly recommended. Debugging can be usefull in production too. See `config.util.logComponents` option.

```bash
find node_modules/*/lib -type f -regex '.*\.js' \
  | grep -v components/resources/lib \
  | xargs sed -e s/[a-zA-Z\._-]*\$\$DEBUG\(.*\)\;//g -i .ORIGINAL

# do the same with \$\$TRACE
```

##### Validate the Substitutions

```bash
find node_modules/*/lib -type f -regex '.*\.js.ORIGINAL' \
  | while read FILE; do echo; echo ${FILE%.ORIGINAL}; diff ${FILE%.ORIGINAL} $FILE; done
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
`log_level` -   TODO ??datalayer logger different to mesh logger?? <br/>
`setOptions.noStore` - Flag to enable/disable storage of messages and calls between MeshNodes.<br/>
`setOptions.timeout` - Timeout for remote messaging and method calls.<br/>

__NOTE:__ The `config.dataLayer` section can be omitted if all defaults are acceptable.

### Endpoint Config

[&#9650;](#configuration)

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

See also: [What are Components?](modules.md#what-are-components)

The `config.components` section should list components to be loaded into the mesh. The full complement of possible config looks as follows:

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
          },
          'methodName2': {}
        ]
      },
      web: {
        routes: {
          method1: 'webMethod1',
          app: 'static',
          // app: ['middleware1', 'middleware2', 'static']
        }
      }
    }
  }
  ...
```

###### name-of-component
__(required)__

Components become accessable by name in the [Events](events.md) and [Exchange](exchange.md) APIs and also on [Web Routes](webroutes.md)

###### moduleName
__(optional)__

Each Component in the MeshNode should specify which [Module](#module-config) it exposes. If the `moduleName` is unspecified the mesh will attempt to use a Module by the same name as the Component's name.

###### schema
__(optional)__

The schema defines which methods on the Module should be exposed to the mesh. If no schema is specified the initializer will expose all methods and assume the last argument to each function is a 'node style' callback. This allows for the generic case to require no config.

###### schema.exclusive
__(optional)__

If true - it informs the initializer to only expose the Methods specified in `schema.methods` to the mesh.
The default is false.

###### schema.startMethod
__(optional)__

Used to specify one of the `schema.methods` to run on the mesh.start to further initialize the module once the mesh is up, running and connected to other MeshNodes.

When specifying `schema.startMethod` it is necessary to provide the initializer with the full complement of configuration for the start method. As expressed in the example config above, the start method will be called with the `opts` as specified in `value`

###### schema.methods
__(optional)__

List the methods. Each has a subconfig defining the method details. In most cases no subconfig is required.

###### web.routes
__(optional)__

This allows the binding of web routes to methods on the Module or 'static' directories on the Module's path.

`http://meshhost:port/name-of-component/method1` runs `moduleInstance.webMethod(req, res)`
`http://meshhost:port/name-of-component/static/..` serves files from `(module) __dirname`/app




