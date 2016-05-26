var commander = require('commander');

var trySend = function(code, data){
  try{
    var message = code;

    if (data)
      message = message + ":::" + JSON.stringify(data);

    process.send(message);
  }catch(e){
    //do nothing
  }
}

try{

  commander

    .version(JSON.parse(require('fs').readFileSync(__dirname + '/../package.json')).version)
    .option('--conf [file]',         'Load mesh config from file/module (js)') // ie. module.exports = {/* the config */}
    .option('--trace',               'Set LOG_LEVEL=trace')
    .option('--debug',               'Set LOG_LEVEL=debug')
    .option('--warn',                'Set LOG_LEVEL=warn')
    .option('--loader', 'Used by system, indicates happner is being loaded by a proxy')
    .parse(process.argv);

  var happner = require('../');

  var __config = {};
  var __mesh = false;
  var __listening = false;

  process.on('message', function(data){
    if (data == 'listen'){
      if (!__mesh)
        return trySend('list-err', 'mesh not ready')

      __mesh.listen(function(e){
        if (e) return trySend('list-err', e.toString());
        __listening = true;
        trySend('listenin');
      });
    }
  });

  if (commander.conf)
    __config = require(commander.conf);

  __config.deferListen = true;

  happner.on('mesh-log', function(data){
    trySend('mesh-log', data);
  });

  happner.on('startup-progress', function(data){
    trySend('strt-prg', data);
  });

  happner.create(__config, function(e, mesh) {

    if (e)
      return trySend('strt-err', e.toString());

    __mesh = mesh;
    trySend('strt-rdy');

  });

}catch(e){
  trySend('strt-err',e.toString());
}

