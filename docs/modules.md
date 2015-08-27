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




### Defaulting Configuration

`$happngin.ignore`

