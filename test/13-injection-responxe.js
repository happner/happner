var spawn = require('child_process').spawn;
var remote;

var sep = require('path').sep;
var libFolder = __dirname + sep + 'lib' + sep;

describe('injection responxe', function() {

  require('./lib/0-hooks')();

  before(function(done) {
    remote = spawn('node',[libFolder + '13-mesh']);
    remote.stdout.on('data', function(data) {

      console._stdout.write('REMOTE: ' + data.toString());

      if (!data.toString().match(/READY/)) return;
      done();
    });
  });

  after(function(done) {
    remote.kill();
    done();
  });


  it('makes the timeout happen', function(done) {

    this.timeout(15000)

    var MeshClient = require('../lib/system/api');

    MeshClient('localhost', 3001, 'mesh', function(err, client) {

      client.api.exchange.mesh1.component1.funK('ARG1', function(err, res) {

        console.log('responded with:', res);
        console.log('waiting for timeout');
        setTimeout(done, 12000);

      });
    });
  });


});