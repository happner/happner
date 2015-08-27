[&#9664;](endpoints.md) datalayer | components [&#9654;](components.md)

## Modules

### What are Modules?

In essence happngin modules are simply node modules that have the additional capacity to be created asyncronously and instantiated by configuration.

This paves the way for `code re-use by configuration` and `remote runtime initialization`

### Mesh Awareness (with $happn)

Service injection is used to provide mesh awareness into modules. By declaring `$happn` in the arguments to a mesh visible function the mesh can be used by that function. This injection methodology was selected to minimize the effort footprint necessary to extend an existing codebase for use in the mesh.

##### The `$happn` service contains:

* `$happn.name` is the name of the ComponentInstance of __this__ Module
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
        moduleName: 'group'
    },
    'clients': {
        moduleName: 'group'
    }
  }
  ...
```

The result is that there are two seprate instances of mesh and web functionality each __sharing the same module instance__.

eg. (web routes)

`http://localhost:port/company1/employees/...`
`http://localhost:port/company1/clients/...`

The above example implies that there is polymorphism at play. It is not so. All functionality must be defined in the module. The components are simply views into the module, each exposing a selected subset of functionality by confgiuration. And each having it's own unique mesh ""channel"" by way of the `$happn` service injection which is itself the actual ComponentInstance.

__NOTE:__ The module instance is shared by all components that use it. This can lead to unexpected behaviour.

"You are not alone with your 'this'"...


### Defaulting Configuration

`$happngin.ignore`

