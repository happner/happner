[&#9664;](system.md) system components | __back__ to contents [&#9654;](https://github.com/happner/happner#documentation)

## Using the Client

### From the browser

The api client script can be accessed from the browser at `/api/client`.

#### Loading the script.

__index.html__
```html
<html>
  <head>
    <script src=/api/client></script>
    <!-- script src="http://some.other.node.com:55000/api/client"></script -->
  </head>
  ...
```

#### Using the script.

__index.html__
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
        secret: 'mesh',
        // username: 'username', // pending
        // password: 'password', // pending
      }

      client.login(credentials); // .then(function(client) {...








    </script>
  </body>
</html>
```




#### Bonus Functionality

The client loads the following additional classes into the browser's runtime:

[Promise](https://github.com/petkaantonov/bluebird/blob/master/API.md) - Bluebird promise implementation.</br>
[Primus](https://github.com/primus/primus) - The websocket client used by the MeshClient.</br>
EventEmitter - Precisely the same as node's EventEmitter. (Part of Primus).</br>

