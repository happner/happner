[&#9664;](starting.md) starting a mesh node | using the client [&#9654;](client.md)

## System Components

The mesh starts with a default set of system components running.

### Api

This component serves the MeshClient script for use in the browser.

[http://localhost:55000/api/client](http://localhost:55000/api/client)

eg.

```html
<script type='text/javascript' src='/api/client'></script>
```

### Resources

Serves the static contents of `node_modules/happner/resources/...`. This includes a bower directory, already present in the bower directory are the jquery and async libraries required for the /api/client script to work out of the box.

A bower.json file exists with a fuller listing of usefull modules and can be installed as follows: 

```bash
# sudo install bower -g
cd node_modules/happner/resources
bower install
```

http://localhost:55000/resources/...

eg.

```html
<script type='text/javascript' src='/resources/bower/async/lib/async.js'></script>
```


### Dashboard



pending