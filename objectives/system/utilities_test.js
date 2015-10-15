objective('utilities', function() {

  before(function(Utilities) {

    mock('utils', new Utilities());

  })

  context('findInModules()', function() {

    it('recurses the array of module.paths for modules with specific filename in its root',

      function(done, utils, should) {

        utils.findInModules('package.json', function(e, results) {

          // console.log(results.filter(function(d) {
          //   return d.base;
          // }));

          (results.length > 100).should.equal(true);

          utils.findInModules('non-existant', function(e, results) {

            (results.length == 0).should.equal(true);
            done();

          });

        });

      }
    );

  });

});
