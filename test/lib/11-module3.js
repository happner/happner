module.exports = Module3;

function Module3() {

}

Module3.prototype.methodWithHappn = function(req, $happn, res, next) {
  res.end(JSON.stringify($happn.config));
}

Module3.prototype.methodWithoutHappn = function(req, res) {
  res.end('ok')
}

Module3.prototype.methodWithHappnInFront = function($happn, req, res, next) {
  res.end(JSON.stringify({
    config: $happn.config,
    next: next.toString()
  }));
}

Module3.prototype.methodWithHappnInMiddle = function(req, res, $happn, next) {
  res.end(JSON.stringify({
    config: $happn.config,
    next: next.toString()
  }));
}

Module3.prototype.methodWithHappnInEnd = function(req, res, next, $happn) {
  res.end(JSON.stringify({
    config: $happn.config,
    next: next.toString()
  }));
}

