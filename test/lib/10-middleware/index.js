/**
 * Created by Johan on 10/14/2015.
 */

module.exports = function () {
  return new Module();
};

function Module() {
  this.checkIndex = function (req, res, next, $happn) {
    req.url = req.url.replace('html', 'htm');
    next();
  }
}
