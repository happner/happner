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

      var opts = {
        hostname: 'defaults to where _this_ page came from',
        port: 'defaults to where _this_ page came from',
      };

      // Create the client instance.

      var client = new MeshClient( /* opts */ );

    </script>
  </body>
</html>
```




#### Bonus Functionality

The client loads the following additional classes into the browser's runtime:

[Promise](https://github.com/petkaantonov/bluebird/blob/master/API.md) - Bluebird promise implementation.</br>
[Primus](https://github.com/primus/primus) - The websocket client used by the MeshClient.</br>
EventEmitter - Precisely the same as node's EventEmitter. (Part of Primus).</br>

