
#### Added this.$happn for mesh awareness in component instances.

__NON BACKWARD COMPATIBLE CHANGE__

* `this` has been restored to refer to module instance.
* `this.$happn` contans the mesh aware component instance.
* `this.$happn.config` contains the component's config fragment.
* IMPORTANT `this.$happn` is only ensured to refer to the correct instance for the duration of the call tick. 

In mesh config:

```javascript
modules: {
  'module-name': {}
},
components: {
  moduleName: 'module-name',
  startMethod: 'startMe'
}
```

In node-modules/module-name/index.js:

```javascript

module.exports = MyModule;

function MyModule() {
  this.property = 'TO LET';
}

MyModule.startMe = function() {
  this.property == 'TO LET'; // Module instance variables remain available.
  this.$happn.config;        // Component instance available in this.$happn
  this.$happn.describe;
  this.$happn.emit;
  this.$happn.mesh;
}

MyModule.remoteReadme = function(callback) {
  this.$happn.config; // Is assured to refer the component instance
  var _this = this;
  var happn = _this.$happn;

  setTimeout(function() {
    _this.$happn.config; // This may now possibly refer to another component instance 
                        // of the same module - If there are any.

    happn; // Is still assured.

  }, 1);
}

```