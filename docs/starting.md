[&#9664;](data.md) data api | system components [&#9654;](system.md)

## Starting a Mesh Node.

MeshNode startup has been divided into two steps.

##### Initialize

* Starts all internal local infrastructure
* Begins listeing on the network.
* Begins connection attempts to remote MeshNodes (endpoints)
* Generates modules and componentInstances per the config
* Assembles the exchange and event api layers
* Ammends the exchange and event api with each established connection to remote MeshNodes
* Reports up

##### Start

* Calls the start method on any components that specified one. This allows components an initialization step that occurs after all mesh connections have been made.

These two steps can be done separately (by hand).

```javascript
Happngin = require('happngin');

var config = {};
var mesh = Happngin();

mesh.initialize(config, function(error) {
  if (err) ... process.exit(1);

  /* MeshNode is up */

  /* Maybe do some things to mesh before "start" */ 

  mesh.start(function(err) {
    if (err) ... process.exit(2);

    /* MeshNode is up - AND running */

  });
});

```

Alternatively, there may be no reason to get inbetween the startup, so one call will do.

```javascript
Happngin = require('happngin');

var config = {};

Happngin.start(config, function(err, mesh) {});
```

Needn't really bother with the callback either (unless you want the mesh object outside of components) 

```javascript
Happngin = require('happngin');
Happngin.start(require('./config/mesh1.js'));
```

You can even start a `Blank`

```bash
node -e 'require("happngin").start()'
```
