
#### Added $happn argument injection for mesh awareness in component instances.

__NON BACKWARD COMPATIBLE CHANGE__

* `this` has been restored to refer to single module instance.
* Mesh awareness per component instance is enabled via `$happn` injected where specified into methods

In mesh config:

```javascript
modules: {
  'shared-module-name': {}
},
components: {
  'component1': {
    moduleName: 'shared-module-name',
    startMethod: 'startMe',
    web: {
      routes: {
        'webMethod': 'meshAwareWebMethod'
      }
    }
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

MyModule.prototype.startMe = function($happn) {
  this.property == 'TO LET'; // Module instance variables remain available on 'this'.
                            // NB. Remember the module instance is shared among all component instances 
  $happn.config;
  $happn.emit;
  $happn... /etc
}
                                                       // can be injected into any position
                                                      // 
MyModule.prototype.meshAwareMethod = function(arg1, $happn, arg2, callback) {
  
  //
  // Still called via exchange with only (arg1, arg2, callback)
  // eg.
  // 
  //     mesh.api.exchange.component1.meshAwareMethod('arg1', 'arg2', callback)
  //

}

MyModule.prototype.meshAwareWebMethod = function($happn, req, res, next) {
  // web methods can also be mesh aware
}

```
