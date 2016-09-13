/**
 * Created by Johan on 10/14/2015.
 */

module.exports = function () {
  return new Module();
};

function Module() {

  this.method1 = function (req, res, next, $happn, $origin) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({"secure": "value", "origin":$origin}));
  };

  this.method2 = function (req, res, next, $happn) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({"secure": "value", "origin":"NONE"}));
  };

}
