[&#9664;](datalayer.md) datalayer | autoloading and defaulting [&#9654;](autoload.md)

## Modules and Components

* [What are Modules?](#what-are-modules)
* [What are Components?](#what-are-components)
* [Mesh Awareness (with $happn)](#mesh-awareness-with-happn)
* [An Imaginary Module (as example)](#an-imaginary-module-as-example)

### What are Modules?

[&#9650;](#)

In essence __happner__ modules are simply node modules that have the additional capacity to be created asyncronously and instantiated by configuration.

This paves the way for `code re-use by configuration` and `remote runtime initialization`

### What are Components?

[&#9650;](#)

Components are 'mesh aware' encapsulations of the Module (or module instance) they employ. It is the Components which become accessable as units of functionality on the mesh network.

### Mesh Awareness (with $happn)

[&#9650;](#)

Service injection is used to provide mesh awareness into modules. By declaring `$happn` in the arguments to a function the mesh can be used by that function. This injection methodology was selected to minimize the code footprint necessary to extend an existing codebase for use in the mesh.

##### The `$happn` service contains:

* `$happn.name` is the name of the ComponentInstance of __this__ Module
* `$happn.log` is the ComponentInstance's __named logger__
* `$happn.config` is the config of the ComponentInstance
* `$happn.emit()` to emit events from the ComponentInstance into the mesh. See [Emitting Events](events.md#emitting-events)
* `$happn.data.*` provides direct access to __this__ mesh dataLayer. See [Data Api](data.md)
* `$happn.exchange.*` provides access to local `componentName.methodName()`'s and remote `meshName.componentName.methodName()`'s. See [Exchange Api](exchange.md)
* `$happn.event.*` provides subscriber services for events emitted from local and remote mesh components.


##### The ComponentInstance

This refers to the instance of __this__ Module running as a component of the mesh. Multiple components can be configured to use the same module. If the module is a class or has a `construct` or `create` instruction in it's configs then separate instances of the module will be created for each component that uses it. In the example below both `employees` and `clients` are ComponentInstances of `group-of-people`.

eg. (config)

```javascript
  ...
  name: 'company1',
  modules: {
    'group-of-people': {} // npm install group-of-people
  },
  components: {
    'employees': {
        module: 'group-of-people'
    },
    'clients': {
        module: 'group-of-people'
    }
  }
  ...
```

The result is that 'employees' and 'clients' are two seprate instances of mesh and web functionality each sharing the same module definition and providing the following functionalities into each instance of the module:

[Web Routes](webroutes.md)

`http://localhost:port/company1/employees/...`<br/>
`http://localhost:port/company1/clients/...`<br/>

[Exchange](exchange.md)

`$happn.exchange.company1.employees.method()'s`<br/>
`$happn.exchange.company1.clients.method()'s`<br/>

[Events](events.md)

`$happn.event.company1.employees.on(), .off()`<br/>
`$happn.event.company1.clients.on(), .off()`<br/>


The above example implies that there is polymorphism at play. It is not strictly so. All functionality must be defined in the module. The components are simply views into the module, each exposing a selected subset of functionality by configuration. And each having __it's own unique mesh ""channel""__ by way of the `$happn` service injection (which is itself the actual ComponentInstance).


### An Imaginary Module (as example)

[&#9650;](#)

Having just done `npm install hello --save` you will find:

__In file__ `node_modules/hello/index.js`
```javascript
module.exports.world = function(opts, callback) {
  var error = null;
  var greeting = 'Hello World';
  callback(error, greeting);
}
```

This imaginary 'hello' module can be up and running in the mesh with a minimum of config.

```javascript
meshConfig = {
  name: 'myMeshNode', // name for this MeshNode
  components: {
    'hello': {}
  }
}
```

`$happn.exchange.myMeshNode.hello.world()` can now be called (as if a local function) from other MeshNodes in the network that have endpoints configured to connect to __this__ MeshNode. See [Endpoint Config](configuration.md#endpoint-config) 

The mesh provides some [System Components](system.md) by default. These include the browser MeshClient that can be fetched from the defaut host and port: [http://localhost:55000/api/client](http://localhost:55000/api/client)

Looking further you see that the imaginary 'hello' module also has an `app/` directory with the following:

__In file__ `node_modules/hello/app/index.html`
```html
<html>
  <head>
    <!-- Load the MeshClient script from the system api module -->
    <script src=/api/client></script>
  </head>
  <body>
    <script>
        // Connect to the mesh
        var client = new MeshClient(/* {host:,port:} */);

        client.login(/* {username:, password:} */)

        .then(function() {

          // Call the world() function from node_modules/hello/index.js
          return client.exchange.hello.world({/*opts*/}, function(error, greeting) {

              alert(greeting);

              // Note: The same function is available on a path that includes
              //       the MeshNode's name:
              //
              // mesh.exchange.myMeshNode.hello.world(...
              //
          });

        });
    </script>
  </body>
</html>
```

Logically you assume that it can be reached by browsing to [http://localhost:55000/hello/app](http://localhost:55000/hello/app).

It does not work. To enable a web route the component needs further config.

```javascript
meshConfig = {
  name: 'myMeshNode', // name for this MeshNode
  components: {
    'hello': {
      web: {
        routes: {
          app: 'static'
        }
      }
    }
  }
}
```

The mesh is now sharing the contents of the `node_modules/hello/app/` as static resources and defaults to index.html.

You browse to [http://localhost:55000/hello/app](http://localhost:55000/hello/app) and 'Hello World' pops up in the alert dialog.



