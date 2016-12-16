var Mesh = require('../../lib/mesh');
var config = require('./b2-first-mesh-config');

(new Mesh()).initialize(config, function (err) {

  if (err) {

    console.log(err);
    process.exit(err.code || 1);
    return;
  }

  console.log('READY');

});
