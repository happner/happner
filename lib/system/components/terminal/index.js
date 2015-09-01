module.exports = Terminal;

// BUG: prompt input longer than line gets unsightly

function Terminal() {

  // Use register() to pre-load commands that should be
  // created in the prompt when it starts up.
  //
  // Needs to be done from start() methods of other modules.
  // 
  // The terminal module needs to be listed first in the config,
  //

  this.registered = require('./actions');
  this.prompt;
}

// Other modules call here to register terminal commands

Terminal.prototype.register = function($happn, commandName, definition) {

  if (this.registered[commandName]) {
    $happn.log.warn('cannot re-register command \'' +commandName+ '\'');
    return;
  }

  $happn.log.$$TRACE('register(', {name: commandName, defn: definition});

  this.registered[commandName] = definition;
}


// Start the prompt.
// Need happner mesh event's, here to start the prompt on up and running (ie. all started)

Terminal.prototype.start = function() {

  var _this = this;

  // Clear line for log message.
  // The prompt (with current content) is re-written on next line.

  UTILITIES.log.on('before', function() {

    if (_this.prompt.node) return;

    console._stdout.clearLine();  // node version 0.9 & higher (i think)
    console._stdout.cursorTo(0);
  
  });

  // Rewrite prompt after logger write
  
  var replace;
  
  UTILITIES.log.on('after', function() {

    if (_this.prompt.node) return;

    clearTimeout(replace);
    
    replace = setTimeout(function() {
      var newLine = false;
      _this.prompt.writePrompt(newLine);
    }, 10);

  });

  this.prompt.start();
}


// Use as start method

Terminal.prototype.create = function($happn, callback) {

  var _this = this;

  global.ACTIONS = {} // Stop objective from processing argv

  require('objective')(function(prompt) {
    _this.prompt = prompt;

    // Attach middleware on prompt's 'command registration' pipeline
    // to register all commands called into _this.register() by other modules

    objective.pipeline.on('prompt.commands.register.ask', function(command, next) {
      Object.keys(_this.registered).forEach(function(key) {

        var registered = _this.registered[key];
        if (typeof registered == 'function') {
          return command.create(key, registered({
            prompt: _this.prompt
          }));
        }

        command.create(key, _this.registered[key]);

      });
      next();
    });

    callback();
  });
}


// Default config

Terminal.prototype.$happner = {
  config: {
    component: {
      startMethod: 'create',
      schema: {
        exclusive: true,
        methods: {
          'create': {},
          'register': {},
          'start': {}
        }
      }
    }
  }
}
