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

      var happn = this.$happn;

      if (!happn.mesh)
        throw new Error('This module needs component level scope');

      //console.log("Message from " + message.message);

      message.message = "Component2";

      happn.mesh.exchange.component1.exposedMethod(message, function (e, response) {

      });

      callback(null, message);

    } catch (e) {
      callback(e);
    }
  }

  this.startData = function (callback) {
    var count = 0;
    var _this = this;
    var happn = this.$happn;
    happn.mesh.data.on('/component1/testDataCount', {
      event_type: 'set',
      count: options.maximumPings   // Subscribe to 1 more to make sure we don't get too many events
    }, function (message) {
      if (message.payload.data != count++) {
        happn.emit('date_test_complete', 'Test failed', function (e, response) {
        });
      }

      var timeOut;
      if (count > options.maximumPings) {
        console.log("Too many received");
        clearTimeout(timeOut);
        happn.emit('data-test-complete', "Too many messages", function (e, response) {
        });
      }

      if (count == options.maximumPings) {
        var endTime = moment.utc();
        timeOut = setTimeout(function () {
          happn.mesh.data.get('/component1/testStartTime', null, function (e, result) {
            var timeDiff = endTime - moment(result.payload[0].data);
            var message = 'Hooray, data event test is over!! ' + count + ' sets, elapsed time:' + timeDiff + 'ms';
            happn.emit('data-test-complete', message, function (e, response) {
            });
          });
        }, 500);
      }
    }, function () {
      callback();
    });
  };

  this.stop = function () {
    this.$happn.mesh.api.date.off('/module1/testDataCount');
  }
}
