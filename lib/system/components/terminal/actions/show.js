
// NO ACCESS to _mesh

var help = function() {/*


  Sneaky runtime accessable free text capability.
  -----------------------------------------------

  Write help for show command.

  Used below with a function.toString().


*/}

module.exports = function(mesh, callback) {

  var action = {

    description: 'Shows the details of thing.',

    
    // help: '\n\nHelp text.\nAppears on "help show"\n\n',
    help: ((help = help.toString().split('\n')).slice(1,help.length-1)).join('\n'),

    run: function(args, done) {
      if (args.length == 0) {
        console.log('\nshow [thing] (use tab to discover/autocomplete');
        return done();
      }

      console.log(); // start output on newline after prompt

      try {
        if (args.length == 2) {
          console.log(mesh._mesh[ args[0] ][ args[1] ]);
        } else {
          console.log(mesh._mesh[ args[0] ]);
        }
      } catch (e) {
        console.log(undefined);
      }
      
      done();
    },

    autoComplete: function(args, callback) {
      if (args[0] == 'endpoints') {
        return callback(null, Object.keys(mesh._mesh.endpoints));
      }

      if (args[0] == 'exchange') {
        return callback(null, Object.keys(mesh._mesh.exchange));
      }
      
      if (args[0] == 'modules') {
        return callback(null, Object.keys(mesh._mesh.modules));
      }
      
      if (args[0] == 'components') {
        return callback(null, Object.keys(mesh._mesh.components));
      }
      
      return callback(null, ['config', 'endpoints', 'exchange', 'modules', 'components']);
    }  

  }

  callback(null, action);
}
