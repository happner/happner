global.ACTIONS = module.exports = {

  // ACTIONS on global to override objective presenting it's own cli interface at --help

  run: function(program) {

    // commander: https://github.com/tj/commander.js

    program
    .version(JSON.parse(require('fs').readFileSync(__dirname + '/../../package.json')).version)
    .option('')  //spacer
    .option('--noisey',          'Demonstrate with noisy log.')

    program.parse(process.argv);


    // program options available on require('lib/actions')

    module.exports.program = program;

    delete global.ACTIONS.run; // once!
    module.exports.running = false; // true prevents starting localmesh and prompt
  },

  show: require('./show'),
  node: require('./node'),
}
