describe('c6 - https', function (done) {

  this.timeout(120000);

  //require('benchmarket').start();
  //after(//require('benchmarket').store());

  var Mesh = require('../')

  var spawn = require('child_process').spawn;
  var expect = require('expect.js');
  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;

  var test_id = Date.now() + '_' + require('shortid').generate();
  var should = require('chai').should();

  after(function (done) {
    remote.kill();
    done();
  });

  var testClient;

  before(function (done) {

    // spawn remote mesh in another process
    remote = spawn('node', [libFolder + 'c6-remote-mesh']);

    //NB - the remote mesh is configured to initialize the datalayer with https, by setting the transport option:
    //   dataLayer: {
    //   transport:{
    //     mode:'https'
    //   },
    //   port: 3111,
    // },

    remote.stdout.on('data', function (data) {

      if (data.toString().match(/READY/)) {
        testClient = new Mesh.MeshClient({port: 3111, protocol: 'https', allowSelfSignedCerts: true});
        testClient.login().then(function (e) {
          done(e);
        });
      }

    });

  });

  it('fails to connect, wrong transport on client', function (done) {

    var nodeProc = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
    var timeout;
    var beenDone = false;

    if (nodeProc == '0.10') {
      timeout = setTimeout(function () {
        beenDone = true;
        done();
      }, 3000);
    }

    var badClient = new Mesh.MeshClient({port: 3111});
    badClient.login().then(function (e) {
      done(new Error('this was not meant to happen'));
    }).catch(function (e) {
      if (!beenDone){
        expect(e.toString()).to.equal('Error: socket hang up');
        if (nodeProc != '0.10') done();
      }
    });
  });

  it('does a set on the datalayer component', function (done) {

    testClient.exchange.test_c6.data.set('/c6-https/set', {"val": "set"}, function (e, result) {

      if (e) return done(e);

      expect(result.val).to.be("set");

      done();

    });

  });

  it('does a get on the datalayer component', function (done) {

    testClient.exchange.test_c6.data.set('/c6-https/get', {"val": "get"}, function (e, result) {

      if (e) return done(e);

      expect(result.val).to.be("get");

      testClient.exchange.test_c6.data.get('/c6-https/get', {}, function (e, getresult) {

        if (e) return done(e);

        // console.log('get happened:::', getresult);

        expect(getresult.val).to.be("get");
        done();

      });

    });

  });


  it('does a delete on the datalayer component', function (done) {

    testClient.exchange.test_c6.data.set('/c6-https/delete', {"val": "delete"}, function (e, result) {

      if (e) return done(e);

      expect(result.val).to.be("delete");

      testClient.exchange.test_c6.data.get('/c6-https/delete', {}, function (e, getresult) {

        if (e) return done(e);

        expect(getresult.val).to.be("delete");

        testClient.exchange.test_c6.data.remove('/c6-https/delete', {}, function (e, removeresult) {

          if (e) return done(e);

          // console.log('delete happened:::', removeresult);

          testClient.exchange.test_c6.data.get('/c6-https/delete', {}, function (e, getremovedresult) {

            if (e) return done(e);

            expect(getremovedresult).to.be(null);
            done();

          });


        });

      });

    });

  });

  //require('benchmarket').stop();

});

