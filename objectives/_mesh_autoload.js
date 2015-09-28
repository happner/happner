module.exports = function() {

  before(function() {
    delete process.env.SKIP_AUTO_LOAD;
  });

  after(function() {
    process.env.SKIP_AUTO_LOAD = '1';
  });

  it('loads happner.js where found in node_modules', function(done, fs, Mesh, path, expect) {

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

  });
  
}
