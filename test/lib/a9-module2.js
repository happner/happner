/**
 * Created by Johan on 4/14/2015.
 * Updated by S.Bishop 6/1/2015.
 */

var traverse = require('traverse');

module.exports = function (options) {
  return new Component2(options);
};

function Component2(options) {

  this.storeData = function ($happn, path, data, parameters, callback) {

    try {

      $happn.data.set(path, data, parameters, callback);

    } catch (e) {
      callback(e);
    }
  }

  this.lookForForbiddenMethods = function ($happn, callback) {
    try {

      //look in $happn

      var forbiddenFruit = ['_remoteOff'];
      var innocenceLost = [];

      traverse($happn).map(function () {

        if (forbiddenFruit.indexOf(this.key) >= 0)
          innocenceLost.push(this.path);

      });

      return callback(null, innocenceLost);
    } catch (e) {
      return callback(e);
    }

  }

  this.subscribeToData = function ($happn, options) {
    $happn.data.on(options.path, {event_type: 'set', count: 0}, options.handler, options.callback);
  };

  this.unsubscribeFromData = function ($happn, options) {
    $happn.data.off(options.path, options.callback);
  };

  this.setData = function ($happn, options) {
    $happn.data.set(options.path, options.value, {}, options.callback);
  };

  this.start = function (arg, $happn) {

  };

  this.stop = function () {

  }
}
