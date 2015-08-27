[&#9664;](configuration.md) configuration | modules [&#9654;](modules.md)

## DataLayer

### What is the DataLayer?

The DataLayer is the underlying messaging and storage infrastructure in the mesh. It uses [happn](https://github.com/FieldServer/happn)'s evented storage and pubsub websocket stack.

Configured in the datalayer is the host and port upon which __this__ MeshNode listens for connections from other MeshNodes or clients.

##### The data layer allows for:

* key/value storage, see [Data Api](data.md)
* subscription to storage events by key (and wildcards)
