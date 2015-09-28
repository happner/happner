objective.only('utilities', function() {

  before(function(Utilities) {

    mock('utils', new Utilities());

  })

  context('findInModules()', function() {

    it('recurses the array of module.paths for modules with specific filename in its root',

      function(done, utils) {

        
        utils.findInModules('moo', function(e, result) {

          done();

        });



        

      }
    );

  });

});