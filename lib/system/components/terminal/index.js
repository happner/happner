module.exports = Terminal;

// BUG: prompt input longer than line gets unsightly

function Terminal() {

  // Use register() to pre-load commands that should be
  // created in the prompt when it starts up.

  this.registered = {};
  this.prompt;
}


Terminal.prototype.register = function(commandName, definition) {
  
}


Terminal.prototype.start = function() {
  this.prompt.start();  
}


Terminal.prototype.create = function($happn, callback) {

  var _this = this;

  global.ACTIONS = {} // Stop objective from processing argv

  require('objective')(function(prompt) {
    _this.prompt = prompt;
    callback();
  });
}


Terminal.prototype.$happner = {
  config: {
    component: {
      startMethod: 'create',
      schema: {
        exclusive: true,
        methods: {
          'create': {},
          'start': {}
        }
      }
    }
  }
}
