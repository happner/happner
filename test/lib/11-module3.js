module.exports = Module3;

function Module3() {

}

Module3.prototype.methodWithHappn = function(req, $happn, res, next) {

  res.end(JSON.stringify($happn.config));

}

Module3.prototype.methodWithoutHappn = function(req, res) {
  res.end('ok')
}

