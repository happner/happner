describe('01_browsertest_security', function() {

  this.timeout(10000);

  it('rejects login promise on bad credentials', function(done) {
    var client = new Happner.MeshClient({port: 55000});
    client.login({
      username: 'username',
      password: 'bad password'
    })
      .then(function() {
        client.disconnect();
        done(new Error('should not allow'));
      })
      .catch(function(error) {
        error.toString().should.equal('AccessDenied: Invalid credentials');
        done();
      })
      .catch(done);
  });

  it('emits login/deny on bad credentials', function(done) {
    var client = new Happner.MeshClient({port: 55000});
    client.on('login/deny', function(error) {
      try {
        error.toString().should.equal('AccessDenied: Invalid credentials');
        done();
      } catch (e) {
        done(e);
      }
    });
    client.login({
      username: 'username',
      password: 'bad password'
    })
      .then(function() {
        client.disconnect();
        done(new Error('should not allow'));
      })
  });

  it('emits login/allow on good credentials', function(done) {
    var client = new Happner.MeshClient({port: 55000});
    client.on('login/allow', function() {
      done();
    });
    client.login({
      username: 'username',
      password: 'password'
    })
      .catch(done)
  });

  context('events', function() {
    // publish allowed/denied
    // subscribe allowed/denied
  });

  context('data', function() {
    // ?
  });

  context('exchange', function() {
    var client;

    before('start client', function(done) {
      client = new Happner.MeshClient({port: 55000});
      client.login({
        username: 'username',
        password: 'password'
      })
        .then(function() {
          done();
        })
        .catch(done);
    });

    after('stop client', function() {
      client.disconnect();
    });

    it('allows access to allowed methods', function(done) {
      client.exchange.test.allowedMethod({key: 'value'})
        .then(function(result) {
          // result.should.eql({}); // ???
          ({
            key: 'value',
            meshName: 'Server',
            originUser: 'username'
          }).should.eql(result);
          done();
        })
        .catch(done);
    });

    it('denies access to denied methods', function(done) {
      client.exchange.test.deniedMethod({key: 'value'})
        .then(function(result) {
          done(new Error('should not allow'));
        })
        .catch(function(error) {
          error.toString().should.equal('AccessDenied: unauthorized');
          done();
        })
        .catch(done);
    });
  });

});
