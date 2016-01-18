var Mesh = require('../../lib/mesh');

var config = {
  name: 'test_6',
  version:'1.0.0',
  dataLayer: {
    port: 3111,
    log_level: 'info|error|warning'
  },
  endpoints: {},
  components: {
    data:{}
  }
};

(new Mesh()).initialize(config, function(err) {

  if (err) {
    console.log(err);
    process.exit(err.code || 1);
    return;
  }

  console.log('READY');

});
