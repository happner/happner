[&#9664;](configuration.md) configuration | modules and components [&#9654;](modules.md)

## Datalayer

### What is the Datalayer?

The Datalayer is the underlying messaging and storage infrastructure in the mesh. It uses [happn](https://github.com/happner/happn)'s evented storage and pubsub websocket stack.

Configured in the datalayer is the host and port upon which __this__ MeshNode listens for connections from other MeshNodes or clients.

##### The data layer allows for:

* key/value storage, see [Data Api](data.md)
* subscription to storage events by key (and wildcards)


### Datalayer Events

Components with `accessLevel: 'mesh'` in their config have direct access to datalayer event emitter.

Note: Data content of these events is in flux. 

##### Event: attach

Another MeshNode has attached to this one.

```javascript
$happn._mesh.datalayer.events.on('attach', function(ev) {
  ev == {
    info: {
      mesh: {
        name: "remote_mesh_name"
      },
      _browser: false,
      _local: false
    }
  };
});
```

##### Event: detatch

An attached MeshNode has disconnected.

```javascript
$happn._mesh.datalayer.events.on('detatch', function(ev) {
  ev == {
    info: {
      mesh: {
        name: "remote_mesh_name"
      },
      _browser: false,
      _local: false
    }
  }
});

```

### Datalayer Compaction

The datalayer can be set to compact at an interval, or can also be compacted by a call:

*the following code demonstrates an interval compaction configuration:*
```javascript
var config = {
  datalayer: {
    port: 55007,
    filename:test_file_interval,
    compactInterval:10000//compact every 10 seconds
  },
  components: {
    "data": {}
  }
};

var Happner = require('happner');
var config = {};

Happner.create(config, function(err, mesh) {
  /* _ */
});
```

*the following code demonstrates how to kick of a compaction job:*

```javascript
var config = {
  datalayer: {
    port: 55006,
    filename:test_file_call
  },
  components: {
    "data": {}
  }
};

var Happner = require('happner');
var config = {};

Happner.create(config, function(err, mesh) {
  mesh.exchange.system.compactDBFile(function(e){
    //your file was successfully compacted
  });
});


```
