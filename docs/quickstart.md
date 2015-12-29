[&#9664;](https://github.com/happner/happner#documentation) contents


## Quick Start

This demonstration creates a simple monitoring service.

* [Create a demo project](#create-a-demo-project)
* [Create the Master node module](#create-the-master-node-module)
* [Create config for the Master node](#create-config-for-the-master-node)
* [Create bin runner for the Master node](#create-bin-runner-for-the-master-node)

###

* [Use env file for stage config](#use-env-file-for-stage-config)

###

* [Create the Agent node module](#create-the-agent-node-module)
* [Create the Agent mesh runner and config](#create-the-agent-mesh-runner-and-config)

###

* [Create Start and Stop methods on Master and Agent components](#create-start-and-stop-methods-on-master-and-agent-components)



### Create a demo project

```bash
mkdir happner-demo
cd happner-demo
npm init # and fill with defaults

npm install happner --save
```

### Create the Master node module

This creates the mesh module that will run as the monitoring service's master node.

**Note: Master is it's own node_module! This simplifies the configurations.**

```bash
mkdir node_modules/master
cd node_modules/master/
npm init    # keep index.js as entry point

vi index.js # see content below
cd ../../   # cd -
```

Content of `./node_modules/master/index.js`

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

Content of `./config/master.js`

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

Content of `./bin/master`

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

***

### Use env file for stage config

Install env file loader and create env file

```
npm install dotenv --save
vi .env
```

Content of `./.env`
```env
# change to ip accessable from remote
MASTER_IP=0.0.0.0
MASTER_PORT=50505
```

Update `./config/master.js`
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

***

### Create the Agent node module

This agent is installed into a mesh node running at each host to be monitored. It connects an `endpoint` to the master to report metrics.

**Note: Agent is it's own node_module! This simplifies the configurations.**


```bash
mkdir node_modules/agent
cd node_modules/agent/
npm init    # keep index.js as entry point

vi index.js # see content below
cd -        # cd ../../
```

Content of `./node_modules/agent/index.js`
```javascript
module.exports = Agent;

/*
 * Agent class (runs as mesh component)
 *
 * @api public
 * @constructor
 *
 */

function Agent() {
  console.log('new agent');
}

```


### Create the Agent mesh runner and config

Same as Master, create config and bin files for Agent.

**Note: Agent config includes an endpoint connecting to the Master**

Content of `./config/agent.js`

```javascript
require('dotenv').load();

module.exports = {

  // Allow default name
  // name: 'agent',

  datalayer: {
    port: 0,         // Listen at random port (allows more than one agent instance per host)
    persist: false,  // No storage
    secure: false,   // Secure? (later)
  },

  // Connect endpoint to MasterNode

  endpoints: {
    'MasterNode': {
      config: {
        host: process.env.MASTER_IP,
        port: process.env.MASTER_PORT,
        // // Secure? (later)
        // username: '',
        // password: '',
      }
    }
  },

  // Include agent as component

  components: {
    'agent': {
    }
  }

}
```

Content of `./bin/agent`

```javascript
#!/usr/bin/env node

var Happner = require('happner');
var Config  = require('../config/agent');

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

Remember to make agent executable:

```bash
chmod +x bin/agent
```

**At this point is should be possible to start both `bin/master` and `bin/agent`.**

***

### Create Start and Stop methods on Master and Agent components

Start and Stop methods are used to assemble and tear down the component runtime. Additionally the `$happn` service can optionally be injected to perform any necessary interactions with the mesh.

Update `./node_modules/master/index.js`

```javascript

// Add these functions after constructor

/*
 * Start method (called at mesh start(), if configured)
 *
 * @api public
 * @param {ComponentInstance} $happn - injected by the mesh when it calls this function
 * @param {Function} callback
 *
 */

Master.prototype.start = function($happn, callback) {
//Agent.proto...
  $happn.log.info('starting master component');
  callback();
}


/*
 * Stop method (called at mesh stop(), if configured)
 *
 * @api public
 * @param {ComponentInstance} $happn - injected by the mesh when it calls this function
 * @param {Function} callback
 *
 */

Master.prototype.stop = function($happn, callback) {
//Agent.proto...
  $happn.log.info('stopping master component');
  callback();
}

```

Update `./config/master.js`

```javascript

// Modify component declaration to include start and stop methods

  ...
  components: {
    'master': {
      startMethod: 'start',
      stopMethod: 'stop',
    }
  }
  ...
```

**ALSO** Do the same for `./node_modules/agent/index.js` and `./config/agent.js`


### Create report function on Master

This is a function defined on the master that will be repetatively called by the agent to report metrics.

** Note: A more elegant design might be for the agent to emit metrics and the master to be subscribed. But this would require an endpoint connection from master pointing to eveny agent. ie. The existing endpoint from agent to master is not bi-directional **


Update `./node_modules/master/index.js`

```javascript

// Add after start and stop functions

/**
 * Metric object
 *
 * @typedef Metric
 * @type {object}
 * @property {Number} timestamp - utc
 * @property {String} key
 * @property {Number} values
 *
 */

/*
 * Report metric method (called by remote agents across the exchange)
 *
 * @api public
 * @param {ComponentInstance} $happn - injected by the mesh when it calls this function
 * @param {String} hostname - of the agent
 * @param {Metric} metric
 * @param {Function} callback
 *
 */

Master.prototype.reportMetric = function($happn, hostname, metric, callback) {

  $happn.log.info("metric from '%s': %j", hostname, metric);

  callback(null, {thanks: 1});
}


```

### Call report function from Agent

Functions on the master (being an endpoint) become available on the Agent via the exchange.

Reminder: `./configs/agent.js` specifies **startMethod** and **stopMethod** in `components/agent/`.

Using the Agent's start method, set up an interval that calls `reportMetric()` on the Master

Update `./node_modules/agent/index.js`

```javascript

// up top
var os = require('os');

// update start and stop methods:


/*
 * Start method (called at mesh start(), if configured)
 *
 * @api public
 * @param {ComponentInstance} $happn - injected by the mesh when it calls this function
 * @param {Function} callback
 *
 */

Agent.prototype.start = function($happn, callback) {
  $happn.log.info('starting agent component');

  this.interval = setInterval(function() {

    var hostname = os.hostname();
    var metric = {
      ts: Date.now(),
      key: 'test/metric',
      value: 1,
    }

    // call remote function exchange.<endpoint>.<component>.<method>

    $happn.exchange.MasterNode.master.reportMetric(hostname, metric, function(err, res) {
      // callback as called by master.reportMetric
      if (err) return $happn.log.error('from reportMetric', err);
      $happn.log.info('result from reportMetric: %j', res);
    });

  }, 1000);

  callback();
}


/*
 * Stop method (called at mesh stop(), if configured)
 *
 * @api public
 * @param {ComponentInstance} $happn - injected by the mesh when it calls this function
 * @param {Function} callback
 *
 */

Agent.prototype.stop = function($happn, callback) {
  $happn.log.info('stopping agent component');

  // stop the interval running when component is stopped
  clearInterval(this.interval);

  callback();
}


```

**Note: The stop method explicitly undoes what the start method did (clearInterval) - this allows for components to be dynamically added and removed from the mesh without leaving things behind.**
