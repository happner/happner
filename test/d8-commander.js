describe('d8 commander checks', function () {
  this.timeout(10000);
  var commander = require('commander');

  it('should parse with extra options', function (done) {

    var options = ['--conf test.conf','--trace','--debug','--warn','--loader', '--max-old-space-size'];

    commander
      .allowUnknownOption()
      .option('--conf [file]',         'Load mesh config from file/module (js)') // ie. module.exports = {/* the config */}
      .option('--trace',               'Set LOG_LEVEL=trace')
      .option('--debug',               'Set LOG_LEVEL=debug')
      .option('--warn',                'Set LOG_LEVEL=warn')
      .option('--loader', 'Used by system, indicates happner is being loaded by a proxy')
      .parse(options);

    done();

  });

});
