[&#9664;](https://github.com/happner/happner#documentation) contents


## Quick Start

This demonstration creates a simple monitoring service.

* [Create a demo project](#create-a-demo-project)
* [Create the Master node module](#create-the-master-node-module)

### Create a demo project

```bash
mkdir happner-demo
cd happner-demo
npm init # and fill with defaults

npm install happner --save
```

### Create the Master node module

This creates the mesh module that will run as the monitoring service's master node.

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
