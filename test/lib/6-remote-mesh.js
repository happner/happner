var Mesh = require('../../lib/mesh');
var path = require('path');

var config = require(path.join(__dirname, '6-remote-mesh-config'));

(new Mesh()).initialize(config, function (err) {

  if (err) {
    console.log(err);
    process.exit(err.code || 1);
    return;
  }

  console.log('READY');

});
