var commander = require('commander');

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
  var config = {};

  if (commander.conf)
    config = require(commander.conf);

  if (commander.loader)
    config.deferListen = true;

  happner.create(config, function(e, mesh) {

    if (e){
      console.log("failed to start happn: ", e);
      return process.exit(1);
    }

    

  });

}catch(e){
  console.log("failed to start happn: ", e);
}

