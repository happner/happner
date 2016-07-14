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
  this.excludedSpecific = function (req, res, next, $happn) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({"secure": "value"}));
  }
  this.excludedWildcard = function (req, res, next, $happn) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({"secure": "value"}));
  }
}
