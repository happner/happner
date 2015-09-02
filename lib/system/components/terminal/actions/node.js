var repl = require('repl');

/* var help = function() {


  Start REPL to gain access to local MeshNode in process.


} */

module.exports = function(opts, callback) {

  callback(null, {

    description: 'Start REPL on local process.',

    // help: ((help = help.toString().split('\n')).slice(1,help.length-1)).join('\n'),

    run: function(args, done) {

      console.log('\n');
      // console.log('see local MeshNode at: localnode.*');  // NO ACCESS
      if (process.env.START_AS_ROOTED) console.log('multiple local mesh nodes at $happner.*');
      console.log();
      opts.prompt.clearListener();
      opts.prompt.node = true;

      var r = repl.start({

        prompt: "__node> ",
        input: process.stdin,
        output: process.stdout,
        useGlobal: true,
        ignoreUndefined: true,

      }).on('exit', function() {

        opts.prompt.setStreams(process.stdin, console._stdout, true, false, false);
        process.stdin.resume();
        opts.prompt.node = false;
        done();

      });

      // r.context.localnode = mesh;  // NO ACCESS
      r.context.happner = require('../../../../mesh');
      
    }
  });
}
