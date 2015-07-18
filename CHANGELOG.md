
#### Added this.$happn for mesh awareness in component instances.

__NON BACKWARD COMPATIBLE CHANGE__

* `this` has been restored to refer to module instance.
* `this.$happn` contans the mesh aware component instance.
* IMPORTANT - If you have multiple component instances of a shared module then `this.$happn` is only ensured to refer to the correct component instance for the duration of the call tick.

In mesh config:

```javascript
modules: {
  'shared-module-name': {}
},
components: {
  'component1': {
     moduleName: 'shared-module-name',
     startMethod: 'startMe'
  },
  'component2': {
     moduleName: 'shared-module-name',
     startMethod: 'startMe'
  }
}
```

In `node-modules/shared-module-name/index.js`:

```javascript

module.exports = MyModule;

function MyModule() {
  this.property = 'TO LET';
}

MyModule.prototype.startMe = function() {
  this.property == 'TO LET'; // Module instance variables remain available on 'this'.
  this.$happn.config;        // Component instance available in 'this.$happn'
  this.$happn.describe;
  this.$happn.emit;
  this.$happn.mesh;
}

MyModule.prototype.method = function(callback) {
  this.$happn.config; // Is assured to refer the component instance
  var _this = this;
  var happn = _this.$happn;

  setTimeout(function() {
    _this.$happn.config; // This may now possibly refer to another component instance 
                        // of the shared module - If there are any other instances.

    happn.config; // Is still assured.

  }, 1);
}

```