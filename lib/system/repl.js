var repl = require('repl');
var net = require('net');
var fs = require('fs');

var running = false;  // one per process
var server, log;

module.exports.create = function(instance) {
  if (!instance._mesh.config.repl) return;
  if (running) return;
  
  var config = instance._mesh.config.repl;

  running = true;
  log = log || UTILITIES.createLogger('Repl');
  log.$$TRACE('create()');

  server = net.createServer(function(socket) {
  
    log.info('connection on ' + config.socket);
    var r = repl.start({
      prompt: instance._mesh.config.name + '> ',
      input: socket,
      output: socket,
      terminal: true,
      ignoreUndefined: (typeof config.ignoreUndefined == 'undefined') ? false : config.ignoreUndefined,
      useGlobal: true,
      useColors: (typeof config.useColors == 'undefined') ? true : config.useColors
    });

    if ($happngin.nodes) r.context.$happngin = $happngin;
    r.context.meshNode = instance;
    r.context.callback = function defaultCallbackStub(err, res) {



    }

    socket.on('close', function() {
      log.info('connection departed ' + config.socket);
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
    log.info('listening at ' + config.socket);
  });

  var clearFd = function() {
    if (config.socket) {
      try {
        log.$$DEBUG('deleting config.socket');
        fs.unlinkSync(config.socket);
      } catch (e) {}
    }
  }

  // server.on('close', function() {
  //   console.log('EXIT??');
  //   clearFd()
  // });

  process.on('exit', clearFd);
  process.on('SIGINT', function() {
    console.log();
    log.$$DEBUG('on SIGINT');
    process.exit(0);
  });
  process.on('uncaughtException', function(err) {
    log.fatal('uncaughtException', err);
    process.exit(1);
  });

}
