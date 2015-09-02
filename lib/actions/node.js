var repl = require('repl');

var help = function() {/*


  Start REPL to gain access to local MeshNode in process.

  > node
  node> lo <tabtab>
  node> localnode. <tabtab>

  local MeshNode: localnode.*
  multiple local MeshNodes: $happner.*


*/}

module.exports = function(mesh, prompt, callback) {
  callback(null, {

    description: 'Start REPL on local process.',

    help: ((help = help.toString().split('\n')).slice(1,help.length-1)).join('\n'),

    run: function(args, done) {

      console.log('\n');
      console.log('see local MeshNode at: localnode.*');
      console.log('multiple local MeshNodes: $happner.*');
      console.log();
      prompt.clearListener();
      prompt.node = true;

      repl.start({

        prompt: "node> ",
        input: process.stdin,
        output: process.stdout,
        useGlobal: true,
        ignoreUndefined: true,

      }).on('exit', function() {

        prompt.setStreams(process.stdin, console._stdout, true, false);
        process.stdin.resume();
        prompt.node = true;
        done();

      }).context.localnode = mesh;
      
    }
  });
}