var Mesh = require('../../lib/mesh');

var config = {
  name: 'test_c6',
  dataLayer: {
    transport:{
      mode:'https'
    },
    port: 3111,
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
