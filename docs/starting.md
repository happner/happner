[&#9664;](data.md) data api | system components [&#9654;](system.md)

## Starting a Mesh Node.

MeshNode startup has been divided into two steps.

##### Initialize

* Starts all internal local infrastructure
* Begins listeing on the network.
* Generates local module and componentInstances per the config
* Begins connection attempts to remote MeshNodes (endpoints)
* Assembles the exchange and event api layers
* Ammends the exchange and event api with each established connection to remote MeshNodes
* Reports initialized! (runlevel 2)

##### Start

* Calls the start method on any components that specified one. This allows components an initialization step that occurs after all mesh connections have been made.
* Reports started! (runlevel 4)

These two steps can be done separately (by hand).

```javascript
var happner = require('happner');

var config = {};
var mesh = new happner.Mesh();

// or:
// var mesh = happner(); 

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
var happner = require('happner');
var config = {};

happner.start(config, function(err, mesh) {});
```
