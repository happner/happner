[&#9664;](datalayer.md) datalayer | events [&#9654;](events.md)

## Modules and Components

### What are Modules?

In essence happngin modules are simply node modules that have the additional capacity to be created asyncronously and instantiated by configuration.

This paves the way for `code re-use by configuration` and `remote runtime initialization`

### What are Components?

Components are 'mesh aware' encapsulations of the Module they employ. It is the Components which become accessable as units of functionality on the mesh network.

### Mesh Awareness (with $happn)

Service injection is used to provide mesh awareness into modules. By declaring `$happn` in the arguments to a function the mesh can be used by that function. This injection methodology was selected to minimize the code footprint necessary to extend an existing codebase for use in the mesh.

##### The `$happn` service contains:

* `$happn.name` is the name of the ComponentInstance of __this__ Module
* `$happn.log` is the ComponentInstance's __named logger__
* `$happn.config` is the config of the ComponentInstance
* `$happn.module` contains the config and instance of __this__ Module as used by multiple ComponentInstances
* `$happn.emit()` to emit events from the ComponentInstance into the mesh. See [Emitting Events](events.md#emitting-events)
* `$happn.mesh` the ComponentInstance's view into the mesh
* `$happn.mesh.data.*` provides direct access to __this__ MeshNode's dataLayer. See [Data Api](data.md)
* `$happn.mesh.exchange.*` provides access to local `componentName.methodName()` and remote `meshName.componentName.methodName()`. See [Exchange Api](exchange.md)
* `$happn.mesh.event.*` provides subscriber services for events emitted from local `componentName` and remote `meshName.componentName`


##### The ComponentInstance

This refers to the instance of __this__ Module running as a component of the mesh. Multiple components can be configured to use the same module instance. In the example below both `employees` and `clients` are ComponentInstances of `group-of-people`.

eg. (config)

```javascript
  ...
  name: 'company1',
  modules: {
    'group-of-people': {} // npm install group-of-people
  },
  components: {
    'employees': {
        moduleName: 'group-of-people'
    },
    'clients': {
        moduleName: 'group-of-people'
    }
  }
  ...
```

The result is that 'employees' and 'clients' are two seprate instances of mesh and web functionality each sharing the same module instance and providing the following functionalities:

[Web Routes](webroutes.md)

`http://localhost:port/company1/employees/...`<br/>
`http://localhost:port/company1/clients/...`<br/>

[Exchange](exchange.md)

`$happn.mesh.exchange.company1.employees.method()'s`<br/>
`$happn.mesh.exchange.company1.clients.method()'s`<br/>

[Events](events.md)

`$happn.mesh.event.company1.employees.on(), .off()`<br/>
`$happn.mesh.event.company1.clients.on(), .off()`<br/>


The above example implies that there is polymorphism at play. It is not strictly so. All functionality must be defined in the module. The components are simply views into the module, each exposing a selected subset of functionality by configuration. And each having __it's own unique mesh ""channel""__ by way of the `$happn` service injection (which is itself the actual ComponentInstance).

__NOTE:__ The module is __shared by all components that use it__. This includes the case of the module as an instance of a class. "You are not alone with your 'this'".

### An Imaginary Module (as example)

Having just done `npm install hello --save` you will find:

__In file__ `node_modules/hello/index.js`
```javascript
module.exports.world = function(opts, callback) {
  var error = null;
  var greeting = 'Hello World';
  callback(error, greeting);
}
```

The imaginary 'hello' module can be up and running in the mesh with a minimum of config.

```javascript
meshConfig = {
  name: 'myMeshNode', // name for this MeshNode
  components: {
    'hello': {}
  }
}
```

`$happn.mesh.exchange.myMeshNode.hello.world()` can now be called (as if a local function) from other MeshNodes in the network that have endpoints configured to connect to __this__ MeshNode. See [Endpoint Config](configuration.md#endpoint-config) 

The mesh provides some [System Components](system.md) by default. These include the browser MeshClient that can be fetched from the defaut host and port: [http://localhost:8000/api/client](http://localhost:8000/api/client)

__INTERRUPT:__ An additional step is required to fully enable the browser client as follows:

```bash
sudo install bower -g
cd node_modules/happngin/lib/system/components/resources
bower install
```

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
        MeshClient(function(error, mesh) {

            // Call the world() function from node_modules/hello/index.js
            mesh.api.exchange.hello.world(function(error, greeting) {

                alert(greeting);

                // Note: The same function is available on a path that includes
                //       the MeshNode's name:
                //
                // mesh.api.exchange.myMeshNode.hello.world(...
                //
            });
        });
    </script>
  </body>
</html>
```

Logically you assume that it can be reached by browsing to [http://localhost:8000/hello/app/index.html](http://localhost:8000/hello/app/index.html).

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

The mesh is now sharing the contents of the `node_modules/hello/app/`.

You browse to [http://localhost:8000/hello/app/index.html](http://localhost:8000/hello/app/index.html) and 'Hello World' pops up in the alert dialog.

More on configuring modules and components in [Configuration](configuration.md).


### Default Configs



`$happngin.ignore`

