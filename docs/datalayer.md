[&#9664;](configuration.md) configuration | modules and components [&#9654;](modules.md)

## DataLayer

### What is the DataLayer?

The DataLayer is the underlying messaging and storage infrastructure in the mesh. It uses [happn](https://github.com/happner/happn)'s evented storage and pubsub websocket stack.

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
