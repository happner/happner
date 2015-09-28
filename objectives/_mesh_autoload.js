module.exports = function() {

  context('autoload enabled', function() {

    before(function() {
      delete process.env.SKIP_AUTO_LOAD;
    });

    after(function() {
      process.env.SKIP_AUTO_LOAD = '1';
    });


    it('loads happner.js where found in node_modules',

      function(done, fs, Mesh, path, expect) {

        var required = [];

        fs.spy(function readFileSync() {
          var file = arguments[0];
          if (file.match(/\/happner.js/)) {
            required.push(path.relative(process.cwd(), file));
          }
        });

        Mesh.create({port: 52384}).then(function() {
          expect(required).to.eql([
            'node_modules/happner-dashboard/happner.js',
            'node_modules/happner-resources/happner.js'
          ]);
          done();
        }).catch(done);

      }
    );

    it('does not load the module happner.js contains no configs.autoload');


    it('loads modules in the mesh where happner.js existed with autoload config present',

      function(done, Mesh, expect) {

        Mesh.create({port: 52385}).then(function(mesh) {

          expect(mesh._mesh.elements['happner-dashboard']).to.exist;
          expect(mesh._mesh.elements['happner-resources']).to.exist;

          done();

        }).catch(done);
      }
    );

    it('allows autoloading from alternative config name and only loads modules whose happner.js define that config name');

    context('suites', function() {

      xit('arrays')

    });

  });


  context('autoload disabled', function() {

    it('does not auto load modules containing happner.js');

    it('uses autoload as default config if mesh config specifies module');

    it('can specifiy alternative config name (ie. other than "autoload")');

  });
  
}
