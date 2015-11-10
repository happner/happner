module.exports = function() {

  context('autoload enabled', function() {

    before(function() {
      delete process.env.SKIP_AUTO_LOAD;
    });

    after(function() {
      process.env.SKIP_AUTO_LOAD = '1';
    });


    xit('loads happner.js where found in node_modules',

      function(done, fs, Mesh, path, expect) {

        var required = [];

        var count = 0;

        fs.stub(function readdir(dir, callback) {
          if (dir.match(/node_modules$/)) {
            count++;
            if (count <= 2) {
              // fake presence of module__1 and module__2 with happner.js file
              callback(null, ['module__' + count]);
              first = false;
              return;
            }
          }
          if (dir.match(/module__/)) {
            return callback(null, ['happner.js'])
          }
          mock.original.apply(this, arguments);
        });

        fs.stub(function lstat(filename, callback) {
          if (filename.match(/module__/) && filename.match(/happner.js/)) {
            callback(null, {});
            return;
          }
          mock.original.apply(this, arguments);
        })

        fs.stub(function readFileSync() {
          var file = arguments[0];
          if (file.match(/\/happner.js/)) {
            required.push(path.relative(process.cwd(), file));
          }
          if (file.match(/module__/) && file.match(/package\.json/)) {
            return JSON.stringify({
              version: '0.0.1'
            });
          }
          mock.original.apply(this, arguments);
        });

        Mesh.create({port: 52384}).then(function() {
          expect(required).to.eql([
            // 'node_modules/happner-dashboard/happner.js',
            // 'node_modules/happner-resources/happner.js'
          ]);
          done();
        }).catch(done);

      }
    );

    xit('does not load the module if happner.js contains no configs.autoload',

      function(done, fs, Mesh, path, expect, txt) {

        // force require to reload happner-resources/happner.js

        delete require.cache[process.cwd() + '/' + 'node_modules/happner-resources/happner.js'];


        // stub fs.readFileSync() to return alternate file content for happner-resources/happner.js

        fs.stub(function readFileSync(file) {

          // call original readFileSync for all but happner-resources/happner.js

          if (path.relative(process.cwd(), file) != 'node_modules/happner-resources/happner.js') {
            return mock.original.apply(this, arguments);
          }

          // 'pretend' happner-resources/happner.js content contains no autoload

          var alternateContent = txt(function() {/* 

            module.exports = {
              configs: {
                // 'autoload': [],
                'someotherconfigsuite': []
              }
            }

            // console.log('confirm run');

          */});

          return alternateContent;

        });

        Mesh.create({port: 52386}).then(function(mesh) {

          expect(mesh._mesh.elements['happner-dashboard']).to.exist;
          expect(mesh._mesh.elements['happner-resources']).to.not.exist;

          done();

        }).catch(done).finally(function() {

          // delete again so that subsequent tests get the original 

          delete require.cache[process.cwd() + '/' + 'node_modules/happner-resources/happner.js'];

        });

      }
    );


    xit('loads modules in the mesh where happner.js existed with autoload config present',

      function(done, Mesh, expect) {

        Mesh.create({port: 52385}).then(function(mesh) {

          expect(mesh._mesh.elements['happner-dashboard']).to.exist;
          expect(mesh._mesh.elements['happner-resources']).to.exist;

          done();

        }).catch(done);
      }
    );

    it('allows autoloading from alternative config name and only loads modules whose happner.js define that config name');

  });


  context('autoload disabled', function() {

    it('does not auto load modules containing happner.js');

    it('uses autoload as default config if mesh config specifies module');

    it('can specifiy alternative config name (ie. other than "autoload")');

  });
  
}
