var expect = require('expect.js');

describe('e3-test-utils', function () {

  it('tests getting function parameters', function(done){
    var utils = require('../lib/system/utilities');

    var testFunc = function(param1/**param1 comment**/, param2/*param2 comment*/, option1, option2){

    };

    var params = utils.getFunctionParameters(testFunc);
    expect(params.length).to.be(4);
    expect(params[1]).to.be("param2");

    done();

  });

  it('tests getting function parameters', function(done){

    var utils = require('../lib/system/utilities');

    var params = utils.findInModules('async', function(e, results){
      done();
    });

  });

  it('tests stringifying errors', function(done){

    var utils = require('../lib/system/utilities');

    var error = new Error('test error');

    var stringifiedError = utils.stringifyError(error);

    var parsedError = JSON.parse(stringifiedError);

    expect(parsedError.stack).to.not.be(null);
    expect(parsedError.message).to.be("test error");

    done();

  });

  it('tests removing characters from a string', function(done){

    var str = "tthis is a test stringh";

    var utils = require('../lib/system/utilities');

    var removedLeading = utils.removeLeading('t', str);
    var removedLast = utils.removeLast('h', removedLeading);

    var removedLeadingNull = utils.removeLeading('t', null);
    var removedLastNull = utils.removeLast('t', null);

    var removedLeadingUndefined = utils.removeLeading('t', undefined);
    var removedLastUndefined = utils.removeLast('t', undefined);

    expect(removedLeading).to.be('this is a test stringh');
    expect(removedLast).to.be('this is a test string');
    expect(str).to.be('tthis is a test stringh');

    expect(removedLeadingNull).to.be(null);
    expect(removedLastNull).to.be(null);

    expect(removedLeadingUndefined).to.be(undefined);
    expect(removedLastUndefined).to.be(undefined);

    done();

  });

});
