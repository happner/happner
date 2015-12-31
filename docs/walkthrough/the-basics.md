[&#9664;](https://github.com/happner/happner#documentation) contents

## The Basics

This includes:

* Creating mesh nodes with basic configuration.
* Creating modules to run as components in the mesh.
* Creating endpoint connecting one mesh node to another.
* Calling a component method on the remote node.
* Emitting events from a component.
* Using browser client and subscribing to component events.

**Here is the result of this walkthrough [happner-demo#01-the-basics](https://github.com/happner/happner-demo/tree/01-the-basics).**

### Contents

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
* [Create report function on Master](#create-report-function-on-master)
* [Call report function from Agent](#call-report-function-from-agent)
* [Add configurable list of inspectors for Agent](#add-configurable-list-of-inspectors-for-agent)
* [Update Master to emit event with each received metric](#update-master-to-emit-event-with-each-received-metric)

###

* [Serve browser content from Master](#serve-browser-content-from-master)
* [Create login script](#create-login-script)
* [Create client script and style](#create-client-script-and-style)
* [Install smoothie charts](#install-smoothie-charts)
* [Load scripts into browser](#load-scripts-into-browser)

***

### Create a demo project

[&#9650;](#)

```bash
mkdir happner-demo
cd happner-demo
npm init # and fill with defaults

npm install happner --save
```

### Create the Master node module

[&#9650;](#)

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

[&#9650;](#)

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
    port: 50505,    // Listening port
    persist: false, // Persist data across restarts? (later)
    secure: false,  // Secure? (later)
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

[&#9650;](#)

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

[&#9650;](#)

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
    persist: false, // Persist data across restarts? (later)
    secure: false,  // Secure? (later)
  },
  ...

```

**Important: Both `bin/master` and `bin/agent` expect to find `.env` file in the current diretctory, so don't cd into `bin/` to run them.**

***

### Create the Agent node module

[&#9650;](#)

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

[&#9650;](#)

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

[&#9650;](#)

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
    // 'agent': {
    'master': {
      startMethod: 'start',
      stopMethod: 'stop',
    }
  }
  ...
```

**ALSO** Do the same for `./node_modules/agent/index.js` and `./config/agent.js`

### Create report function on Master

[&#9650;](#)

This is a function defined on the master that will be repetatively called by the agents to report their metrics.

**Note: A more elegant design might be for the agent to emit metrics and the master to be subscribed. But this would require an endpoint connection from master pointing to eveny agent. ie. The existing endpoint from agent to master is not bi-directional**


Update `./node_modules/master/index.js`

```javascript

// Add after start and stop functions

/**
 * Metric object
 *
 * @typedef Metric
 * @type {object}
 * @property {Number} ts - utc timestamp
 * @property {String} key
 * @property {Number} val
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

  callback(null, {thank: 'u'});
}
```

### Call report function from Agent

[&#9650;](#)

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

  var hostname = os.hostname();

  this.interval = setInterval(function() {

    var metric = {
      ts: Date.now(),
      key: 'test/metric',
      val: 1,
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


### Add configurable list of inspectors for Agent

[&#9650;](#)

Because the config is a javascript file it is possible to pass functions as config.

Add custom item onto component config for agent inspector functions (keyed on metric name)

Update `./configs/agent.js`

```javascript

// modify component config to include list of inspectors
  ...
  components: {
    'agent': {
      startMethod: 'start',
      stopMethod: 'stop',
      inspectors: {

        // keeping these inspectors as selfcontained "lambdas" 
        // means they could conceivably be configured on the
        // master, and dynamically propagated on change to 
        // all agents (with eval on the agent (unfortunately?)) 

        'load/average-1': {
          interval: 1000,
          fn: function(callback) {
            var os = require('os');
            callback(null, os.loadavg()[0]);
          }
        },
        // 'load/average-5': {
        //   interval: 1000,
        //   fn: function(callback) {
        //     var os = require('os');
        //     callback(null, os.loadavg()[1]);
        //   }
        // },
        // 'load/average-15': {
        //   interval: 1000,
        //   fn: function(callback) {
        //     var os = require('os');
        //     callback(null, os.loadavg()[2]);
        //   }
        // },
        'memory/percent-free': {
          interval: 1000,
          fn: function(callback) {
            var os = require('os');
            var total = os.totalmem();
            var free = os.freemem();
            var percent = Math.round(free / total * 100 * 1000) / 1000; // to 3 decimal places
            callback(null, percent);
          }
        }
      }
    }
  }
  ...

```

And update the Agent module (`start()` and `stop()` functions) to use this new config.

Update `./node_modules/agent/index.js`

```javascript

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

  var hostname = os.hostname();
  var inspectors = $happn.config.inspectors;

  Object.keys(inspectors).forEach(function(key) {

    var interval = inspectors[key].interval || 10000;
    var inspect = inspectors[key].fn;

    // run multiple inspectors each in separate interval

    inspectors[key].runner = setInterval(function() {

      // TODO: properly deal with inspector taking longer than interval
      
      inspect(function(error, result) {

        if (error) return $happn.log.error("inspector at key: '%s' failed", key, error);

        // submit inspect result to master

        var metric = {
          ts: Date.now(),
          key: key,
          val: result
        }

        $happn.exchange.MasterNode.master.reportMetric(hostname, metric, function(error, result) {
          // callback as called by master.reportMetric
          if (error) return $happn.log.error('from reportMetric', error);
          // $happn.log.info('result from reportMetric: %j', result);
        });

      });

    }, interval);

  });

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

  // stop all inspector intervals
  var inspectors = $happn.config.inspectors;
  Object.keys(inspectors).forEach(function(key) {
    clearInterval(inspectors[key].runner);
  });
  
  callback();
}

```

### Update Master to emit event with each received metric

[&#9650;](#)

A browser in the client will be subscribing to these events

Update reportMetric() in `./node_modules/master/index.js`

```javascript
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

  var eventKey = 'metrics/' + hostname + '/' + metric.key;
  var eventData = metric;

  $happn.log.debug("emitting '%s': '%j'", eventKey, eventData);

  $happn.emit(eventKey, eventData);

  callback();
}
```

**Note: The debug log message will not be seen unless util.logLevel is set to 'debug' or the process is started LOG_LEVEL environment variable**

eg.

```bash
LOG_LEVEL=debug bin/master
LOG_COMPONENTS=master,another LOG_LEVEL=debug bin/master
```

***

### Serve browser content from Master

[&#9650;](#)

Create a directory for static content containing index.html

```bash
mkdir node_modules/master/app
touch node_modules/master/app/index.html
```

Add web route to static content in Master component config.

Update `./configs/master.js`

```javascript
  ..
  components: {
    'master': {
      startMethod: 'start',
      stopMethod: 'stop',

      web: {
        routes: {
          // serves static content in node_modules/master/app at http://.../master/app
          'app': 'static'
        }
      }
    }
  }
  ..
```

### Create login script

[&#9650;](#)

This script is used to connect to the mesh.

Content of `./node_modules/master/app/login.js`

```javascript
(function(context) {

  // defaults to page address
  var options = {
    // host: '',
    // port: 80
  }

  // unnecessary: secure not set true in mesh/datalayer config
  var credentials = {
    // username: '',
    // password: '',
  }

  var client = new MeshClient(options);

  client.login(credentials); // .then(...

  client.on('login/deny', function(error) {
    console.error(error);
    alert(error.toString()) 
  });

  client.on('login/error', function(error) {
    console.error(error);
    alert(error.toString()) 
  });

  // run client on login success

  client.on('login/allow', function() {
    context.runClient(client);
  });

})(this);
```


### Create client script and style

[&#9650;](#)

This script is called after successfull login with the connected client. It subscribes to `metrics/*` and accordingly builds graphs into the browser.

Content of `./node_modules/master/app/client.js`

```javascript
(function(context) {
  context.runClient = function(client) {

    var hosts = {};

    client.event.master.on('metrics/*', function(data, meta) {

      // extract hostname/chart/item from event path
      var pathPart = meta.path.match(/metrics\/(.*)$/)[1];
      var keys = pathPart.split('/');
      var hostname  = keys.shift();
      var chartname = keys.shift();
      var itemname  = keys.join('/');

      var metric = data;

      updateMetric(hostname, chartname, itemname, metric);
    });


    var updateMetric = function(hostname, chartname, itemname, metric) {
      ensureHost(hostname);
      ensureHostChart(hostname, chartname);
      ensureHostChartItem(hostname, chartname, itemname);

      updateHostChartItem(hostname, chartname, itemname, metric);
    }


    // ensure host element in document
    var ensureHost = function(hostname) {
      if (typeof hosts[hostname] !== 'undefined') return;

      var host = document.createElement("div");
      host.id = 'host-' + hostname;
      host.className = 'host';

      var heading = document.createElement("div");
      heading.className = 'host-heading';
      heading.innerHTML = hostname;
      host.appendChild(heading);

      var content = document.createElement("div");
      content.className = 'host-content';
      host.appendChild(content);
      
      document.body.appendChild(host);

      hosts[hostname] = {
        root: host,
        content: content,
        charts: {},
        lastWrite: Date.now()
      }
    }


    // ensure chart element in host element in document
    var ensureHostChart = function(hostname, chartname) {
      if (typeof hosts[hostname].charts[chartname] !== 'undefined') return;

      var container = document.createElement("div");
      container.className = 'chart';

      var heading = document.createElement("div");
      heading.className = 'chart-heading';
      heading.innerHTML = chartname;
      container.appendChild(heading);

      var canvas = document.createElement("canvas");
      canvas.id = 'canvas-' + hostname + '-' + chartname;
      canvas.className = 'chart-canvas';
      canvas.width = 500;
      canvas.height = 100;
      container.appendChild(canvas);

      var host = hosts[hostname];
      host.content.appendChild(container);

      var options = {
        maxValueScale: 1.02,
        minValueScale: 1.02,
        labels: {
          fillStyle: '#aaaaaa'
        }
      };
      var chart = new SmoothieChart(options);
      chart.streamTo(canvas);

      host.charts[chartname] = {
        // canvas: canvas,
        heading: heading,
        chart: chart,
        items: {}
      }
    }


    // ensure item (line) in host/chart
    var ensureHostChartItem = function(hostname, chartname, itemname) {
      if (typeof hosts[hostname].charts[chartname].items[itemname] !== 'undefined') return;
      var host = hosts[hostname];
      var chart = host.charts[chartname];

      var series = new TimeSeries();
      var options = {strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.15)', lineWidth: 1};
      chart.chart.addTimeSeries(series, options);

      chart.items[itemname] = {
        series: series
      }

      var heading = chartname + " (" + Object.keys(chart.items).join(', ') + ")";
      chart.heading.innerHTML = heading;
    }

    // update item
    var updateHostChartItem = function(hostname, chartname, itemname, metric) {
      var host = hosts[hostname];
      var chart = host.charts[chartname];
      var item = chart.items[itemname];

      item.series.append(metric.ts, metric.val);
      host.lastWrite = Date.now();
    }


    // watch for hosts being removed
    setInterval(function() {
      var now = Date.now();
      Object.keys(hosts).forEach(function(hostname) {
        var host = hosts[hostname];
        if (now - host.lastWrite < 7000) return;
        
        document.body.removeChild(host.root);
        delete hosts[hostname];
      });
    }, 1000);

  }
})(this);
```

Content of `./node_modules/master/app/client.css`

```css
body {
    background-color: black;
}

.host {
    border: 1px solid grey;
    width: 520px;
    padding-bottom: 20px;
    margin-bottom: 4px;
}

.host-heading {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.2em;
    font-family: courier;
    text-align: center;
}

.chart-heading {
    padding-top: 7px;
    color: rgba(255, 255, 255, 0.4);
    width: 500px;
    font-family: courier;
    font-size: 1em;
    text-align: center;
}

.chart {
  position: relative;
  top: 50%;
  left: 50%;
  margin-left: -250px;
}

```

### Install smoothie charts

[&#9650;](#)

Using smoothie charts to graph streaming data.

Install into master app directory

```bash
cd node_modules/master/app
wget http://github.com/joewalnes/smoothie/raw/master/smoothie.js
cd - # cd ../../../
```

### Load scripts into browser

[&#9650;](#)

Content of `./node_modules/master/app/index.html`

```html
<html>
  <head>
    <!--
      get built-in api client script from mesh 
      this defines MeshClient class
    -->
    <script type="text/javascript" src="/api/client"></script>
    <script type="text/javascript" src="/master/app/smoothie.js"></script>

    <!--
      load app client
      this defines window.runClient()
    -->
    <script type="text/javascript" src="/master/app/client.js"></script>
    <link rel='stylesheet' href='/master/app/client.css'></link>

    <!--
      connect to mesh
      this calls window.runClient() with the connected client instance
    -->
    <script type="text/javascript" src="/master/app/login.js"></script>
  </head>
</html>

```

Start `bin/master` and `bin/agent`.

And connect to [http://MASTER_IP:MASTER_PORT/master/app](http://127.0.0.1:50505/master/app)

