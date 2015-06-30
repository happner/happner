
module.exports = function() {
  return new ModuleFive();
}

function ModuleFive() {

  this.preProcessor = function(req, res, next) {
    req.url = '/preprocessed-' + req.url.slice(1,req.url.length);
    next();
  }

}
