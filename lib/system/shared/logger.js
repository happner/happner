;(function(isBrowser) {

  // miniature logger for browser

  if (!isBrowser) return;

  window.Happner = window.Happner || {};

  window.Happner.createLogger = function(component) {

    var coerce = function(xargs) {
      var args = Array.prototype.slice.call(xargs);
      var msg = '(%s) ' + args.shift();
      args.unshift(component);
      args.unshift(msg);
      return args;
    }

    return {
      $$TRACE: function() {
        if (typeof LOG_LEVEL == 'string' && LOG_LEVEL == 'trace') {
          if ('object' === typeof console) {
            if (console.log) {
              Function.prototype.apply.call(console.log, console, coerce(arguments));
              // hack for IE8/9 (console.log has no apply)
            }
          }
        }
      },
      trace: function() {
        if (typeof LOG_LEVEL == 'string' && LOG_LEVEL == 'trace') {
          if ('object' === typeof console) {
            if (console.log) {
              Function.prototype.apply.call(console.log, console, coerce(arguments));
            }
          }
        }
      },
      $$DEBUG: function() {
        if (typeof LOG_LEVEL == 'string' && (LOG_LEVEL == 'trace' || LOG_LEVEL == 'debug')) {
          if ('object' === typeof console) {
            if (console.log) {
              Function.prototype.apply.call(console.log, console, coerce(arguments));
            }
          }
        }
      },
      debug: function() {
        if (typeof LOG_LEVEL == 'string' && (LOG_LEVEL == 'trace' || LOG_LEVEL == 'debug')) {
          if ('object' === typeof console) {
            if (console.log) {
              Function.prototype.apply.call(console.log, console, coerce(arguments));
            }
          }
        }
      },
      info: function() {
        if (typeof LOG_LEVEL == 'string' && (LOG_LEVEL == 'trace' || LOG_LEVEL == 'debug' || LOG_LEVEL == 'info')) {
          if ('object' === typeof console) {
            if (console.log) {
              Function.prototype.apply.call(console.log, console, coerce(arguments));
            }
          }
        }
      },
      warn: function() {
        if ('object' === typeof console) {
          if (console.warn) {
            Function.prototype.apply.call(console.warn, console, coerce(arguments));
          }
          else if (console.log) {
            Function.prototype.apply.call(console.log, console, coerce(arguments));
          }
        }
      },
      error: function() {
        if ('object' === typeof console) {
          if (console.error) {
            Function.prototype.apply.call(console.error, console, coerce(arguments));
          }
          else if (console.log) {
            Function.prototype.apply.call(console.log, console, coerce(arguments));
          }
        }
      },
      fatal: function() {
        if ('object' === typeof console) {
          if (console.error) {
            Function.prototype.apply.call(console.error, console, coerce(arguments));
          }
          else if (console.log) {
            Function.prototype.apply.call(console.log, console, coerce(arguments));
          }
        }
      }
    }
  }

})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
