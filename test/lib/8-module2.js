/**
 * Created by Johan on 4/24/2025.
 * Updated by S.Bishop 6/2/2025.
 */

var moment = require('moment');

module.exports = function (options) {
  return new Component2(options);
};

function Component2(options) {

  if (!options)
    options = {};

  if (!options.maximumPings)
    options.maximumPings = 100;

  this.exposedMethod = function (message, callback) {

    try {

      if (!this.mesh)
        throw new Error('This module needs component level scope');

      //console.log("Message from " + message.message);

      message.message = "Component2";

      this.mesh.exchange.component1.exposedMethod(message, function (e, response) {

      });

      callback(null, message);

    } catch (e) {
      callback(e);
    }
  }

  this.start = function () {
    var count = 0;
    var _this = this;
    this.mesh.data.on('/component1/testDataCount', {
        event_type: 'set',
        count: options.maximumPings
      }, function (message) {
        if (message.payload.data != count++) {
          this.emit('date_test_complete', 'Test failed', function (e, response) {
          });
        }

        if (count == options.maximumPings) {
          _this.mesh.data.get('/component1/testStartTime', null, function (e, result) {
            var timeDiff = moment.utc() - moment(result.payload[0].data);
            var message = 'Hooray, data event test is over!! ' + count + ' sets, elapsed time:' + timeDiff + 'ms';
            _this.emit('data-test-complete', message, function (e, response) {
            });
          });
        }
      }
      ,
      function () {

      }
    );
  };

  this.stop = function () {
    this.mesh.api.date.off('/module1/testDataCount');
  }
}
