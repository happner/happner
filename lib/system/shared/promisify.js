;(function(isBrowser) {

  if (isBrowser) {
    window.Happner = window.Happner || {};
    window.Happner.Promisify = Promisify;
    // Promise (bluebird) will have been already loaded into browser
  }

  else {
    module.exports = Promisify;
    Promise = require('bluebird');
  }

  function Promisify(originalFunction, opts) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      var _this = this;

      if (opts && opts.unshift) args.unshift(opts.unshift);

      // No promisify if last passed arg is function (ie callback)

      if (typeof args[args.length - 1] == 'function') {
        return originalFunction.apply(this, args);
      }

      return new Promise(function(resolve, reject) {
        // push false callback into arguments
        args.push(function(error, result, more) {
          if (error) return reject(error);
          if (more) {
            var args = Array.prototype.slice.call(arguments);
            args.shift(); // toss undefined error
            return resolve(args); // resolve array of args passed to callback
          }
          return resolve(result);
        });
        try {
          return originalFunction.apply(_this, args);
        } catch (error) {
          return reject(error);
        }
      });
    }
  }

})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
