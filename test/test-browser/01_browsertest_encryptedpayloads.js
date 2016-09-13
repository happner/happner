describe('01_browsertest_encryptedpayloads', function () {

  expect = window.expect;

  this.timeout(10000);

  var client;

  before('it creates the client', function (done) {

    client = new Happner.MeshClient({
      port: 55000,
      secure: true
    });

    client.login({username: '_ADMIN', password: 'xxx'}).then(done).catch(done);

  });

  it('client can call more than one method in sequence (callback)', function (done) {

    client.exchange.test.method1(function (e, result) {

      if (e) return done(e);
      expect(result).to.equal('result1');

      var args = {};

      client.exchange.test.method2(args, function (e, result) {

        if (e) return done(e);
        expect(result).to.equal('result2');
        done();

      });
    });

  });


  it('client can call more than one method in sequence (promise)', function (done) {

    client.exchange.test.method1()

      .then(function (result) {
        expect(result).to.equal('result1');
        var args = {};
        return client.exchange.test.method2(args);
      })

      .then(function (result) {
        expect(result).to.equal('result2');
      })

      .then(done).catch(done);

  });

  it('client can listen for an event - then recieve an event by calling a method', function (done) {

    client.event.test.on('test-emmission', function (data) {
      done();
    })

    client.exchange.test.doEmit({test: "test"}, function (e, result) {
      console.log('emit function went ok:::');
    })

  });

});
