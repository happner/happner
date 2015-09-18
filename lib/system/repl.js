var repl = require('repl');
var net = require('net');
var fs = require('fs');

var running = false;  // one per process
var server, log;

                                    // First Mesh to call repl.start has instance
module.exports.create = function(instance) {

  if (!instance._mesh.config.repl) {
    if (process.env.UNROOT_ON_REPL) delete global.$happner;
    return;
  }
  if (running) return;
  
  var config = instance._mesh.config.repl;

  running = true;
  log = log || instance.log.createLogger('Repl');
  log.$$TRACE('create()');



  // This occurs before components start.
  // They can remain isolated but repl can still have access to all as follows
  // START_AS_ROOTED=1 UNROOT_ON_REPL=1 node my_mesh_nodes.js

  var happner = global.$happner;

  if (process.env.UNROOT_ON_REPL) delete global.$happner;


  server = net.createServer(function(socket) {
  
    log.info('connection on %s', config.socket);
    var r = repl.start({
      prompt: instance._mesh.config.name + '> ',
      input: socket,
      output: socket,
      terminal: true,
      ignoreUndefined: (typeof config.ignoreUndefined == 'undefined') ? false : config.ignoreUndefined,
      useGlobal: true,
      useColors: (typeof config.useColors == 'undefined') ? true : config.useColors
    });

    if (happner) r.context.$happner = happner;
    
    r.context.localnode = instance;

    // default callback stub gets result back across the socket

    r.context.$callback = function TypicalCallbackStub(err, res) {

      if (err) {
        socket.write('ERROR:\n' + (err.stack || err.toString()) + '\n');
        return;
      }
      socket.write('RESULT:\n' + JSON.stringify(res, null, 2) + '\n');
    }

    socket.on('close', function() {
      log.info('connection departed %s', config.socket);
    });

    socket.on('error', function(err) {});

  });

  server.listen(config.socket, function() {
    // console.log('ok')
  });

  server.on('error', function(err) {
    log.error('server error', err);
  });

  server.on('listening', function() {
    log.info('listening at %s', config.socket);
  });

  var clearFd = function() {
    if (config.socket) {
      try {
        log.$$DEBUG('deleting %s', config.socket);
        fs.unlinkSync(config.socket);
      } catch (e) {}
    }
  }

  // server.on('close', function() {
  //   console.log('EXIT??');
  //   clearFd()
  // });

  process.on('exit', clearFd);


}
