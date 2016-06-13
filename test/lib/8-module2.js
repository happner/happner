/**
 * Created by Johan on 4/24/2025.
 * Updated by S.Bishop 6/2/2025.
 */


module.exports = function (options) {
  return new Component2(options);
};

function Component2(options) {

  if (!options)
    options = {};

  if (!options.maximumPings)
    options.maximumPings = 100;

  this.exposedMethod = function (message, callback, $happn) {

    try {

      message.message = "Component2";

      $happn.exchange.component1.exposedMethod(message, function (e, response) {

      });

      callback(null, message);

    } catch (e) {
      callback(e);
    }
  }

  this.startData = function ($happn, callback) {
    var count = 0;
    var _this = this;
    $happn._mesh.data.on('/component1/testDataCount', {
      event_type: 'set',
      count: options.maximumPings   // Subscribe to 1 more to make sure we don't get too many events
    }, function (message) {
      if (message.count != count++) {
        $happn.emit('date_test_complete', {m: 'Test failed'}, function (e, response) {
        });
      }

      var timeOut;
      if (count > options.maximumPings) {
        console.log("Too many received");
        clearTimeout(timeOut);
        $happn.emit('data-test-complete', {m: "Too many messages"}, function (e, response) {
        });
      }

      if (count == options.maximumPings) {
        var endTime = Date.now();
        timeOut = setTimeout(function () {
          $happn._mesh.data.get('/component1/testStartTime', null, function (e, result) {

            var timeDiff = endTime - result.timestamp;
            var message = 'Hooray, data event test is over!! ' + count + ' sets, elapsed time:' + timeDiff + 'ms';
            $happn.emit('data-test-complete', {m: message}, function (e, response) {
            });
          });
        }, 500);
      }
    }, function () {
      callback();
    });
  };

  // huh?
  this.stop = function ($happn) {
    $happn.mesh.api.date.off('/module1/testDataCount');
  }
}
