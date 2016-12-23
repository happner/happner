var sm = require("happner-serial-mocha")
  , path = require("path")
  , fs = require("fs")
  , pack = require("./package.json")
  ;

var testDir;

if (!pack.tracey){

  testDir = __dirname + path.sep + 'test';

} else {

  if (!pack.tracey.testFolder) throw new Error('tracey configuration needs to specify a test folder');

  testDir = path.resolve(__dirname, pack.tracey.testFolder);
}

var files = [];

fs.readdirSync(testDir).forEach(function (filename) {

  var filePath = testDir + path.sep + filename;
  var file = fs.statSync(filePath);

  if (!file.isDirectory() && filename.indexOf('.js') > -1) files.push(filePath);
});

var reportDir = testDir + path.sep + 'reports';

sm.runTasks(files, null, reportDir)

  //sm.runTasks(files, 'lib/serialReporter.js', true)
  .then(function(results){
    //dont remove the ::::output results:::: tags, they are used to take out the test results json
    console.log('::::output results::::');
    console.log(JSON.stringify(results, null, 2));
    console.log('::::output results::::');
  })

  .catch(function(e){
    console.log('tracey test run broke:::', e);
  });
