module.exports = SeeAbove;

function SeeAbove() {}

SeeAbove.prototype.methodName1 = function(callback) {
  callback(null, 'OK-GOOD');
}
SeeAbove.prototype.methodName2 = function() {
  // not exported into mesh. per exclusive in schema
}

SeeAbove.prototype.webMethod1 = function(req, res) {
  res.end('OK-GOOD');
}

// declare default component config to appear on module instance
SeeAbove.prototype.$happner = {
  config: {
    'component': {
      schema: {
        exclusive: true,
        methods: {
          'methodName1': {
            alias: 'moo'
          }
        }
      },
      web: {
        routes: {
          'method': 'webMethod1'
        }
      }
    }
  }
}

if (global.TESTING_15) return; // When 'requiring' the module above,
                              // don't run the tests below
                             //.............

var should = require('chai').should();
var request = require('request');
var mesh;
var Mesh = require('../');

describe('default component configs', function() {

   this.timeout(20000);

  before(function(done) {

    global.TESTING_15 = true; //.............

    mesh = this.mesh = new Mesh();

    mesh.initialize({

      util: {
        // logger: {}
      },

      modules: {
        'see-above': {
          path: __filename
        }
      },
      components: {
        'see-above': {}
      }

    }, function(err) {
      delete global.TESTING_15; //.............
      if (err) return done(err);
      done();
    });
  });

   after(function(done){
     mesh.stop(done);
  });

  it('created the module with the method schema as defaulted', function(done) {

    // console.log(this.mesh.exchange);
    should.not.exist(this.mesh.exchange['see-above'].methodName2)
    var _this = this;
    this.mesh.exchange['see-above'].methodName1(function(err, res) {
    //   res.should.equal('OK-GOOD');
    //   _this.mesh.exchange['see-above'].moo(function(err, res) {
    //     res.should.equal('OK-GOOD');
        done();
    //   });
    });
  });

  it('created the module with the web schema as defaulted', function(done) {
    request.get('http://localhost:55000/see-above/method', function(err, _, body) {
      if (err) return done(err);
      body.should.equal('OK-GOOD');
      done();
    })

  });

})
