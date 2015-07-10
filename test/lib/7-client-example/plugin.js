module.exports = function() {
  return new Browser();
}

function Browser() {
  this.handleRequest = function(req, res, next) {
    console.log('moo');
    next(); 
  }
}
