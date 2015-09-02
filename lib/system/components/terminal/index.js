module.exports = Terminal;

var prompt = require('./prompt');

function Terminal() {

  this.commands = require('./actions');
}

// Other modules call here to register terminal commands

Terminal.prototype.register = function($happn, commandName, definition) {

  $happn.log.$$DEBUG('register ' + commandName);

  if (this.commands[commandName]) {
    $happn.log.warn('cannot re-register command \'' +commandName+ '\'');
    return;
  }

  $happn.log.$$TRACE('register(', {name: commandName, defn: definition});

  this.commands[commandName] = definition;

}


// Start the prompt.
// Need happner mesh event's, here to start the prompt on up and running (ie. all started)

Terminal.prototype.start = function($happn, prefix, callback) {

  var _this = this;

  UTILITIES.log.on('before', function() {

    if (prompt.node) return;

    // Clear line for log message.
    // The prompt (with current content) is re-written on next line.

    console._stdout.clearLine();  // node version 0.9 & higher (i think)
    console._stdout.cursorTo(0);
  
  });

  
  var replace;
  
  UTILITIES.log.on('after', function() {

    if (prompt.node) return;

    // Rewrite prompt after logger write (moments later)

    clearTimeout(replace);
    
    replace = setTimeout(function() {
      var newLine = false;
      prompt.writePrompt(newLine);
    }, 10);

  });

  prompt.start($happn, prefix, this.commands, callback);

}

// Default config

Terminal.prototype.$happner = {
  config: {
    component: {
      schema: {
        exclusive: true,
        methods: {
          'register': {},
          'start': {},
        }
      }
    }
  }
}
