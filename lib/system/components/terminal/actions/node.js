var repl = require('repl');
var history = require('repl.history');
var fs = require('fs-extra');
var path = require('path');

var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var historyFile = path.normalize(home + '/.happner/repl_history');

/* var help = function() {


  Start REPL to gain access to local MeshNode in process.


} */

module.exports = function(opts, callback) {

  var canHistory = true;

  try {
    fs.ensureDirSync(path.dirname(historyFile));
  } catch(e) {
    opts.$happn.log.warn('no read/write at ' + historyFile);
    opts.$happn.log.info('continuing without history');
    canHistory = false;
  }

  callback(null, {

    description: 'Start REPL on local process.',

    // help: ((help = help.toString().split('\n')).slice(1,help.length-1)).join('\n'),

    run: function(args, done) {

      console.log('\n');
      console.log('see local mesh component (the terminal) at: local.*');
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

      r.context.happner = require('../../../../mesh');
      r.context.local = opts.$happn;

      if (canHistory) history(r, historyFile);
      
      var stack = [];
      var tags = {};

      r.context.$callback = function CallbackStub(err, res) {
        var tag = 'last';

        var callback = function(err, res) {
          var result = {tag:tag,err:err,res:res};
          stack.push(result);
          tags[tag] = result;
          r.context.$callback.err = err;
          r.context.$callback.res = res;

          if (err) {
            console.log('ERROR:\n' + (err.stack || err.toString()) + '\n');
            return;
          }
          console.log('RESULT:\n' + JSON.stringify(res, null, 2) + '\n');
        }

        if (typeof err == 'string') {
          // hope there are no more throwings of 'string'...
          tag = err;
          return callback;
        }
          
        callback(err, res);
      }

      r.context.$callback.______ = 'run $callback.README()'

      r.context.$callback.README = function() {
        var text = function() {/*

        local.name       // **this** mesh component (The terminal)
        local.exchange.* // access to other component.functions
                             //    or: endpoint.component.functions (remote)
                             //
        local.emit()     // makes you breakfast
        local.event.*    // .kitchen.oven.on() and .kitchen.oven.off()
                             // (   does not turn the oven on and off    ) 
                             //       it subscribes and unsubscribes
                             //
        local.data.*     // access datalayer
                             //
        

        call register on the terminal component (this component)
        --------------------------------------------------------

        __node> local.exchange.terminal.register('hello', {}, $callback)

        Note the use of $callback. 

        It's a callback stub that populates accessable results.

        

        NB: remote calls take time and results don't arrive before completion
        NB: the prompt does not come back! ever! (hit return)! its back


        See what $callback has from the `register('hello'` call

        __node> $callback
        { [Function: CallbackStub]
          ______: 'run $callback.README()',
          README: [Function],
          err: [Error: Missing action.run(args, callback)],  <<<----------Error
          res: undefined,
          stack: [Getter] }

        __node> $callback.stack   // history

        __node> $callback.tags    // tagged history


        To use the tags:

        __node> t = local.exchange.terminal

                                              // callback is important on terminal commands
                                             //
        __node  action = {run:function(args,cb){console.log('\nhello world'), cb()}}
        
        __node> t.register('hello', action, $callback('MY_TAG'))

        __node> // end of previous line is tag name
        
        __node> $callback
        { [Function: CallbackStub]
          ______: 'run $callback.README()',
          README: [Function],
          err: null,
          res: { status: 'ok' },
          stack: [Getter] }

        __node> $callback.tags.MY_TAG
        { tag: 'MY_TAG', err: null, res: { status: 'ok' } }

        __node> ^d

        Exit to the mesh prompt and run the new 'hello' command

        >> hello

        ...
        

        */}
        text = text.toString().split('\n');
        text.pop();
        text.shift();
        console.log(text.join('\n'));
      }


      r.context.$callback.err = null;
      r.context.$callback.res = null;

      Object.defineProperty(r.context.$callback, 'stack', {
        get: function() {
          return stack;
        },
        enumerable: true
      });

      Object.defineProperty(r.context.$callback, 'tags', {
        get: function() {
          return tags;
        },
        enumerable: true
      });

    }
  });
}
