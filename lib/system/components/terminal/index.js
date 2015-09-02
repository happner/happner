module.exports = Terminal;

var prompt = require('./prompt');

// BUG: prompt input longer than line gets unsightly

function Terminal() {

  this.commands = require('./actions');
}

// Other modules call here to register terminal commands

Terminal.prototype.register = function($happn, commandName, definition) {

  console.log('register', commandName);

  if (this.commands[commandName]) {
    $happn.log.warn('cannot re-register command \'' +commandName+ '\'');
    return;
  }

  $happn.log.$$TRACE('register(', {name: commandName, defn: definition});

  this.commands[commandName] = definition;
}


// Start the prompt.
// Need happner mesh event's, here to start the prompt on up and running (ie. all started)

Terminal.prototype.start = function() {

  var _this = this;

  // Clear line for log message.
  // The prompt (with current content) is re-written on next line.

  UTILITIES.log.on('before', function() {

    if (prompt.node) return;

    console._stdout.clearLine();  // node version 0.9 & higher (i think)
    console._stdout.cursorTo(0);
  
  });

  // Rewrite prompt after logger write
  
  var replace;
  
  UTILITIES.log.on('after', function() {

    if (prompt.node) return;

    clearTimeout(replace);
    
    replace = setTimeout(function() {
      var newLine = false;
      prompt.writePrompt(newLine);
    }, 10);

  });

  prompt.start(this.commands);
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
