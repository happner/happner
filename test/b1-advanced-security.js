var Promise = require('bluebird');
var request = Promise.promisify(require('request'));

describe('b1 - advanced security', function (done) {

  require('benchmarket').start();

  this.timeout(120000);

  var expect = require('expect.js');
  var sep = require('path').sep;
  var libFolder = __dirname + sep + 'lib' + sep;
  var maximumPings = 1000;

  var Mesh = require('../');
  var test_id = Date.now() + '_' + require('shortid').generate();

  var should = require('chai').should();

  var dbFileName = __dirname + sep + 'temp/' + test_id + '.nedb';
  var fs = require('fs-extra');

  var mesh = new Mesh();

  var DELETEFILE = false;

  var config = {
    name: "meshname",
    datalayer: {
      secure: true,
      adminPassword: test_id,
      filename: dbFileName
    },
    modules: {
      'module': {
        instance: {
          method1: function ($happn, callback) {
            $happn.emit('event1');
            callback(null, 'reply1');
          },
          method2: function ($happn, callback) {
            $happn.emit('event2');
            callback(null, 'reply2');
          },
          webmethod1: function (req, res) {
            res.end('ok1');
          },
          webmethod2: function (req, res) {
            res.end('ok2');
          }
        }
      }
    },
    components: {
      'component': {
        module: 'module',
        web: {
          routes: {
            webmethod1: 'webmethod1',
            webmethod2: 'webmethod2'
          }
        }
      }
    }
  };

  before(function (done) {

    mesh = new Mesh();
    mesh.initialize(config, function (err) {
      if (err) {
        console.log(err.stack);
        done(err);
      } else {
        mesh.start(done);
      }
    });

  });

  var adminClient = new Mesh.MeshClient({secure: true});
  var testUserClient = new Mesh.MeshClient({secure: true});
  //NB in browser is: new MeshClient();
  //in node is: require('happner').MeshClient;

  before('logs in with the admin user', function (done) {

    // Credentials for the login method
    var credentials = {
      username: '_ADMIN', // pending
      password: test_id
    };

    adminClient.login(credentials).then(function () {
      done();
    }).catch(done);

  });

  after('logs out', function (done) {
    adminClient.disconnect(done);
  });

  after(function (done) {
    if (DELETEFILE)
      fs.unlink(dbFileName, function (e) {
        if (e) return done(e);
        mesh.stop({reconnect: false}, done);
      });
    else
      mesh.stop({reconnect: false}, done);
  });

  var testGroup = {
    name: 'TEST GROUP' + test_id,

    custom_data: {
      customString: 'custom1',
      customNumber: 0
    },

    permissions: {
      methods: {
        //in a /Mesh name/component name/method name - with possible wildcards
        '/meshname/security/*': {authorized: true}
      },
      events: {
        //in a /Mesh name/component name/event key - with possible wildcards
        '/meshname/security/*': {authorized: true}
      }
    }
  }

  var testGroupSaved;

  it('creates a test group, with permissions to access the security component', function (done) {
    adminClient.exchange.security.addGroup(testGroup, function (e, result) {

      if (e) return callback(e);

      expect(result.name == testGroup.name).to.be(true);
      expect(result.custom_data.customString == testGroup.custom_data.customString).to.be(true);
      expect(result.custom_data.customNumber == testGroup.custom_data.customNumber).to.be(true);

      testGroupSaved = result;
      done();

    });

  });

  var testUser = {
    username: 'TEST USER@blah.com' + test_id,
    password: 'TEST PWD',
    custom_data: {
      something: 'useful'
    }
  }

  var testUserSaved;

  it('creates a test user', function (done) {
    adminClient.exchange.security.addUser(testUser, function (e, result) {

      if (e) return done(e);

      expect(result.username).to.be(testUser.username);
      testUserSaved = result;

      done();

    });

  });

  it('adds test group to the test user', function (done) {

    adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {
      //we'll need to fetch user groups, do that later
      done(e);
    });

  });

  it('logs in with the test user', function (done) {

    testUserClient.login(testUser).then(function () {

      //do some stuff with the security manager here
      //securityManager = testUserClient.exchange.security;
      //NB - we dont have the security checks on method/component calls yet

      done();
    }).catch(function (e) {
      done(e);
    });

  });

  it('changes the password and custom data for the test user, then logs in with the new password', function (done) {

    var updatedPassword = 'PWD-UPD';

    testUserSaved.password = updatedPassword;
    testUserSaved.custom_data = {'changedCustom': 'changedCustom'};

    adminClient.exchange.security.updateUser(testUserSaved, function (e, result) {

      if (e) return done(e);
      expect(result.custom_data.changedCustom).to.be('changedCustom');
      testUserClient.login(testUserSaved).then(done).catch(done);

    });

  });

  it('fails to modify permissions using a non-admin user', function (done) {

    var testGroup = {
      name: 'B1USER_NONADMIN' + test_id,

      custom_data: {
        customString: 'custom1',
        customNumber: 0
      },

      permissions: {
        methods: {},
        events: {}
      }
    }

    var testGroupSaved;
    var testUserSaved;
    var testUserClient;

    adminClient.exchange.security.addGroup(testGroup, function (e, result) {

      if (e) return done(e);

      testGroupSaved = result;

      var testUser = {
        username: 'B1USER_NONADMIN' + test_id,
        password: 'TEST PWD',
        custom_data: {
          something: 'useful'
        }
      }

      adminClient.exchange.security.addUser(testUser, function (e, result) {

        if (e) return done(e);

        expect(result.username).to.be(testUser.username);
        testUserSaved = result;

        adminClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e) {

          if (e) return done(e);

          testUserClient = new Mesh.MeshClient({secure: true});

          testUserClient.login(testUser).then(function () {

            testUserClient.exchange.security.linkGroup(testGroupSaved, testUserSaved, function (e, result) {

              if (!e)
                return done(new Error('this was not meant to happn'));

              expect(e.toString()).to.be('AccessDenied: unauthorized');

              done();

            });

          }).catch(function (e) {
            done(e);
          });

        });
      });
    });

  });

  it('should fail to login with a bad user', function (done) {

    testUserClient.login({username: 'naughty', password: '1234'}).then(function () {
      done(new Error('this was not meant to happn'));
    }).catch(function (e) {

      done();

    });

  });

  it('should list all groups', function (done) {

    adminClient.exchange.security.listGroups('*', function (e, groups) {

      if (e) return done(e);

      expect(groups.length).to.be(5);

      done();

    });

  });

  it('should list all users', function (done) {

    adminClient.exchange.security.listUsers('*', function (e, users) {

      if (e) return done(e);

      expect(users.length).to.be(3);
      done();

    });

  });

  it('should get a specific user, with rolled up group data', function (done) {

    adminClient.exchange.security.getUser(testUserSaved.username, function (e, user) {

      if (e) return done(e);

      expect(user.groups[testGroupSaved.name] != undefined).to.be(true);
      done();

    });

  });

  it('should be able to link another group to a user', function (done) {

    var testGroup2 = {
      name: 'TEST GROUP 2 ' + test_id,
      permissions: {
        methods: {},
        events: {}
      }
    };

    adminClient.exchange.security.addGroup(testGroup2, function (e, group2) {
      if (e) return done(e);
      adminClient.exchange.security.getUser(testUserSaved.username, function (e, user) {
        if (e) return done(e);
        adminClient.exchange.security.linkGroup(group2, user, function (e) {
          if (e) return done(e);
          adminClient.exchange.security.getUser(testUserSaved.username, function (e, user_new) {
            if (e) return done(e);
            expect(user_new.groups[testGroupSaved.name] != undefined).to.be(true);
            expect(user_new.groups[testGroup2.name] != undefined).to.be(true);
            done();
          });
        });
      });
    });
  });


  it('delete a user, fail to access the system with the deleted user', function (done) {

    adminClient.exchange.security.deleteUser(testUserSaved, function (e, result) {

      if (e) return done(e);

      testUserClient.login({username: testUserSaved.username, password: 'PWD-UPD'}).then(function () {
        done(new Error('this was not meant to happn'));
      }).catch(function (e) {

        expect(e.toString()).to.be('AccessDenied: Invalid credentials');
        done();

      });

    });

  });

  var testGroupAdmin = {
    name: 'TEST GROUP ADMIN',

    custom_data: {
      customString: 'custom1',
      customNumber: 0
    },

    permissions: {
      methods: {
        //in a /Mesh name/component name/method name - with possible wildcards
        '/meshname/security/*': {authorized: true}
      },
      events: {
        //in a /Mesh name/component name/event key - with possible wildcards
        '/meshname/security/*': {authorized: true}
      }
    }
  };

  var testGroupUser = {
    name: 'TEST GROUP USER',

    custom_data: {
      customString: 'custom2',
      customNumber: 0
    },

    permissions: {
      methods: {
        //in a /Mesh name/component name/method name - with possible wildcards
        '/meshname/security/*': {authorized: false}
      },
      events: {
        //in a /Mesh name/component name/event key - with possible wildcards
        '/meshname/security/*': {authorized: false}
      }
    }
  };

  it('should not allow to call methods from /meshname/security after groups is updated to TEST GROUP USER',
    function (done) {
      this.timeout(2000);
      var testUser = {
        username: 'user1',
        password: 'password',
        custom_data: {
          role: 'TEST GROUP ADMIN'
        }
      };
      var all_groups = [], admin_group, user_group, user_data, new_meshClient;
      adminClient.exchange.security.addGroup(testGroupAdmin)
        .then(function () {
          return adminClient.exchange.security.addGroup(testGroupUser);
        }).then(function () {
        return adminClient.exchange.security.listGroups('*');
      }).then(function (groups) {
        all_groups = groups;
        return adminClient.exchange.security.addUser(testUser);
      }).then(function (user_data) {
        user = user_data;
        for (var i = 0; i < all_groups.length; i++) {
          if (all_groups[i].name === 'TEST GROUP ADMIN') admin_group = all_groups[i];
          if (all_groups[i].name === 'TEST GROUP USER') user_group = all_groups[i];
        }
        //Linking the group to TEST GROUP ADMIN first.
        return adminClient.exchange.security.linkGroup(admin_group, user);
      }).then(function () {
        //UnLinking the group from TEST GROUP ADMIN.
        return adminClient.exchange.security.unlinkGroup(admin_group, user);
      }).then(function () {
        //Linking the group to TEST GROUP USER next.
        return adminClient.exchange.security.linkGroup(user_group, user);
      }).then(function () {
        new_meshClient = new Mesh.MeshClient({secure: true});
        return new_meshClient.login(testUser);
      }).then(function () {
        //Expected to throw an error as the TEST GROUP USER has no permission for this method.
        new_meshClient.exchange.security.getUser(testUser.username, function (e, user) {
          expect(e.message).to.equal('unauthorized');
          expect(user).to.be(undefined);
          return done();
        });
      }).catch(function (e) {
        return done(e);
      });

    });


  //deleteUser

  context('update group', function () {

    var user, groupName = 'group';

    before('create test user', function (done) {

      user = {
        username: 'username',
        password: 'password'
      };

      var group = {
        name: groupName,
        custom_data: {
          customString: 'custom1',
          customNumber: 0
        },
        permissions: {
          methods: {
            '/meshname/component/method1': {authorized: true}
          },
          events: {
            '/meshname/component/event1': {authorized: true}
          },
          web: {
            '/component/webmethod1': {
              authorized: true,
              actions: [
                'get',
                'put',
                'post',
                'head',
                'delete'
              ]
            }
          }
        }
      };

      Promise.all([
        adminClient.exchange.security.addGroup(group),
        adminClient.exchange.security.addUser(user)
      ])
        .spread(adminClient.exchange.security.linkGroup)
        .then(function (ignore) {})
        .then(done)
        .catch(done);

    });

    var client;

    before('login test user and verify security', function (done) {

      var _client = new Mesh.MeshClient();

      _client.login(user)
        .then(function () {
          client = _client;

          // permissions working?
          client.event.component.on('event1', function () {

            // ensure not allowed
            client.exchange.component.method2()
              .catch(function (error) {
                if (error.name == 'AccessDenied') return done();
                done(error);
              });

          });

          client.exchange.component.method1().catch(done);

        })
        .catch(done);

    });

    var webmethod;

    before('can do permitted webmethod', function (done) {

      if (!client.token) return done(new Error('oh'));

      webmethod = function (method, path) {
        var j = request.jar();
        var cookie = request.cookie('happn_token=' + client.token);
        var url = 'http://localhost:55000' + path;
        j.setCookie(cookie, url);
        return request({method: method, url: url, jar: j})
          .then(function (res) {
            return res[1]; //body
          })
      };

      webmethod('get', '/component/webmethod1')
        .then(function (body) {
          if (body !== 'ok1') {
            return done(new Error('Failed on webmethod1: ' + body));
          }
          done();
        })
        .catch(done);

    });

    before('cannot do denied webmethod', function (done) {

      webmethod('get', '/component/webmethod2')
        .then(function (body) {
          if (!body.match(/^unauthorized access/)) {
            return done(new Error('Failed to not fail to access inaccessible'))
          }
          done();
        })
        .catch(done);

    });

    after('logout test user', function (done) {
      if (!client) return done();
      client.disconnect(done);
    });

    var addPermissions;

    before('permissions to add', function () {
      addPermissions = {
        methods: {
          '/meshname/component/method2': {authorized: true}
        },
        events: {
          '/meshname/component/event2': { /*authorized: true */} // assumed true
        },
        web: {
          '/component/webmethod1': {authorized: true, actions: ['options']},
          '/component/webmethod2': {authorized: true, actions: ['get']}
        }
      };
    });


    it('can add group permissions', function (done) {

      adminClient.exchange.security.addGroupPermissions(groupName, addPermissions)

        .then(function (updatedGroup) {
          delete updatedGroup._meta;

          // console.log('ADD RESULT\n%s\n', JSON.stringify(updatedGroup, null, 2));

          expect(updatedGroup).to.eql({
            name: 'group',
            custom_data: {
              customString: 'custom1',
              customNumber: 0
            },
            permissions: {
              methods: {
                'requests/meshname/component/method1': {authorized: true},
                'responses/meshname/component/method1/*': {authorized: true},
                'requests/meshname/component/method2': {authorized: true},
                'responses/meshname/component/method2/*': {authorized: true}
              },
              events: {
                'meshname/component/event1': {authorized: true},
                'meshname/component/event2': {authorized: true}
              },
              web: {
                'component/webmethod1': {
                  authorized: true,
                  actions: [
                    'get',
                    'put',
                    'post',
                    'head',
                    'delete',
                    'options'
                  ]
                },
                'component/webmethod2': {
                  authorized: true,
                  actions: [
                    'get'
                  ]
                }
              }
            }
          });
        })

        // can use new event and method permission?
        .then(function () {
          return new Promise(function (resolve, reject) {
            client.event.component.on('event2', function () {
              resolve();
            });

            client.exchange.component.method2().catch(reject);
          });
        })

        // can use new webmethod permission
        .then(function () {
          return webmethod('get', '/component/webmethod2');
        })

        .then(function (body) {
          expect(body).to.equal('ok2');
        })


        .then(done).catch(done);

    });

    it('can remove group permissions', function (done) {

      adminClient.exchange.security.addGroupPermissions(groupName, addPermissions)

        .then(function () {
          var removePermissions = {
            methods: {
              '/meshname/component/method1': {} // remove whole permission path
            },
            events: {
              'meshname/component/event1': {}
            },
            web: {
              '/component/webmethod1': {
                actions: [ // remove ONLY these actions
                  'put',
                  'head',
                  'moo' // does not break it
                ]
              }
            }
          };

          return adminClient.exchange.security.removeGroupPermissions(groupName, removePermissions)
        })

        .then(function (updatedGroup) {

          // console.log('REMOVE RESULT\n%s\n', JSON.stringify(updatedGroup, null, 2));

          delete updatedGroup._meta;
          expect(updatedGroup).to.eql({
            name: 'group',
            custom_data: {
              customString: 'custom1',
              customNumber: 0
            },
            permissions: {
              methods: {
                'requests/meshname/component/method2': {authorized: true},
                'responses/meshname/component/method2/*': {authorized: true}
              },
              events: {
                'meshname/component/event2': {authorized: true}
              },
              web: {
                'component/webmethod1': {
                  authorized: true,
                  actions: [
                    'get',
                    'post',
                    'delete',
                    'options' // depends on previous test (sorry)
                  ]
                },
                'component/webmethod2': {
                  authorized: true,
                  actions: [
                    'get'
                  ]
                }
              }
            }
          })
        })

        // cant do method1 anymore
        .then(function () {
          return new Promise(function (resolve, reject) {
            client.exchange.component.method1().catch(function (error) {
              if (error.name != 'AccessDenied') {
                return reject(new Error('Not AccessDenied'));
              }
              resolve();
            })
          });
        })

        // cant put
        .then(function () {
          return webmethod('put', '/component/webmethod1')
        })

        .then(function (body) {
          if (!body.match(/^unauthorized/)) throw new Error('Not Unauthorized');
        })

        // can still get
        .then(function () {
          return webmethod('get', '/component/webmethod1')
        })

        .then(function (body) {
          if (body !== 'ok1') throw new Error('Unauthorized');
        })

        .then(done).catch(done);

    });

  });

  after(require('benchmarket').store());
  require('benchmarket').stop();

});
