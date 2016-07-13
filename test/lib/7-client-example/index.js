module.exports = function () {
  return new Example();
}

function Example() {

  this.apiFunction = function (arg1, callback) {
    callback(null, arg1 + arg1);
  }

  this.webFunction = function (req, res, next) {
    res.end('fan tastic');
    // next();
  }

}
