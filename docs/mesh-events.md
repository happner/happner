## mesh instance connection events
as endpoints disconnect/reconnect, the mesh emits the following events:
```javascript

//when an endpoint disconnects due to a network fault, or a remote restart
mesh.on('endpoint-reconnect-scheduled', function(evt) { 
 
});
 
//when an endpoint reconnects after a network fault, or a remote restart
mesh.on('endpoint-reconnect-successful', function(evt) { 
  
});
  
//when an endpoint has intentianally disconnected
mesh.on('connection-ended', function(evt) { 
   
});
 
```

## Mesh prototype events
the mesh prototype emits a few events:
```javascript

var Mesh = require('happner');

Mesh.on('startup-progress', function(data){
  //as the mesh starts up, it emits progress messages
});

Mesh.on('mesh-log', function(data){
  //every time the mesh's logger is called this event is emitted
});

mesh.create(function(e, instance){
  //mesh was created, the above events were emitted while the mesh was starting
});

```
