[&#9664;](https://github.com/happner/happner#documentation) contents


## Quick Start

This demonstration creates a simple monitoring service.

* [Create a demo project](#create-a-demo-project)
* [Create the Master node module](#create-the-master-node-module)
* [Create config for the Master node](#create-config-for-the-master-node)
* [Create bin runner for the Master node](#create-bin-runner-for-the-master-node)
* [Use env file for stage config](#use-env-file-for-stage-config)

### Create a demo project

```bash
mkdir happner-demo
cd happner-demo
npm init # and fill with defaults

npm install happner --save
```

### Create the Master node module

This creates the mesh module that will run as the monitoring service's master node.

Note: Master is it's own node_module! This simplifies the configurations.

```bash
mkdir node_modules/master
cd node_modules/master/
npm init    # keep index.js as entry point

vi index.js # see below
cd ../../   # cd -
```

Content of ./node_modules/master/index.js
```javascript
module.exports = Master;

/*
 * Master class (runs as mesh component)
 *
 * @api public
 * @constructor
 *
 */

function Master() {
  console.log('new master');
}

```

### Create config for the Master node

The config is `module.export`ed from a javascript file.

```bash
mkdir config
vi config/master.js
```

Content of ./config/master.js

```javascript
module.exports = {

  // This name will be used when attaching other nodes to this one.
  name: 'MasterNode',

  // Datalayer and network layer are the same thing.
  datalayer: {
    // host: '0.0.0.0',
    port: 50505,   // Listening port
    persist: true, // Store data in default nedb file
    secure: false, // Secure? (later)
  },


  // // modules only necessary upon deviation from default
  // // https://github.com/happner/happner/blob/master/docs/configuration.md#module-config
  // modules: {
  //   'master': {
  //     path: 'to/alternative/location'
  //   }
  // },

  // Include master as component
  // It assumes that 'master' is an installed node_module which exports 1 class
  components: {
    'master': {
    }
  }

}
```

### Create bin runner for the Master node

This is the "executable" that runs the Master node.

```bash
mkdir bin
touch bin/master
chmod +x bin/master
vi bin/master
```

Content of ./bin/master

```javascript
#!/usr/bin/env node

var Happner = require('happner');
var Config  = require('../config/master');

// Call create() factory which returns the promise of a mesh or error

Happner.create(Config)

.then(function(mesh) {
  // got running mesh
})

.catch(function(error) {
  console.error(error.stack || error.toString())
  process.exit(1);
});

```

**At this point it should be possible to start the `bin/master` process and `^c` to stop it**


### Use env file for stage config

Install env file loader and create env file

```
npm install dotenv --save
vi .env
```

Content of ./.env
```env
# change to ip accessable from remote
MASTER_IP=0.0.0.0
MASTER_PORT=50505
```

Update ./config/master.js
```javascript

// insert at start of file
require('dotenv').load();

// and modify datalayer in config
  ...
  datalayer: {
    host: process.env.MASTER_IP,
    port: process.env.MASTER_PORT,
    persist: true,     // Store data in default nedb file
    secure: false,     // Secure? (later)
  },
  ...

```


