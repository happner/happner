[&#9664;](system.md) system components | __back__ to contents [&#9654;](https://github.com/happner/happner#documentation)

## Using the Client

### From the browser

The api client script can be accessed from the browser at `/api/client`.

#### Loading the script.

__something.html__
```html
<html>
  <head>
    <script src=/api/client></script>
    <!-- script src="http://some.other.node.com:55000/api/client"></script -->
  </head>
  ...
```

#### Initialize and Login.

__something.html__
```html
  ...
  <body>
    <script>

      window.LOG_LEVEL = 'trace';

      // Connection options (displaying defaults)
      var options = {
        hostname: window.location.hostname,
        port: window.location.port || 80,
      };


      // Create the client instance.

      var client = new MeshClient( /* options */ );


      // Credentials for the login method
      var credentials = {
        // username: 'username', // pending
        // password: 'password', // pending
      }
      
      // login with callback
      client.login(credentials, function(e) { //...etc
      
      // or login with promise
      client.login(credentials); // .then(function() { //... etc.


      client.on('login/allow', function() {

      });

      client.on('login/deny', function(err) {
      
      });

      client.on('login/error', function(err) {

      });


    </script>
  </body>
</html>
```

#### Other Events

__something.html__
```html
  ...
  <body>
    <script>

      // got client from above


      // Component notifications to enable the dynamic creation of
      // widgets or menu updates (or similar) into the running app.

      client.on('components/created', function(array) {

        // First emit lists all components.

        // Subsequent emits list only new components
        // inserted into the running mesh node.
        // (see: mesh._createElement())

      });

      client.on('components/destroyed', function(array) {

        // Components being removed from the mesh.

      });

      client.on('connection/ended', function() {

        // server was stopped

      });

      client.on('reconnect/scheduled', function() {

        // client is attempting reconnect after lost connection

      });

      client.on('reconnect/successful', function() {

        // client successfully reconnected

      });

    </script>
  </body>
</html>
```


#### Additional Functionality

The client loads the following additional classes into the browser's runtime:

[Promise](https://github.com/petkaantonov/bluebird/blob/master/API.md) - Bluebird promise implementation.</br>
[Primus](https://github.com/primus/primus) - The websocket client used by the MeshClient.</br>
__EventEmitter__ - Same as node's EventEmitter. (Part of Primus).</br>


#### Reconnection policy
```javascript

var client = new MeshClient({
  secure: true,
  port: 8004,
  reconnect: {
    retries: Infinity,
    max: 180000
  }
});
```

#### Custom ping/pong configuration

```javascript
var client = new MeshClient({
  pubsub: {
    options: {
      ping: 25000,
      pong: 10000
    }
  }
});
```

### From a node process

```javascript

var MeshClient = require('happner').MeshClient;

var client = new MeshClient(...

// same as for the browser
```

### testing the browser client
*a browser test via chai can be run from the command line:*
```bash
gulp --gulpfile test/test-browser/gulp-01.js
```

