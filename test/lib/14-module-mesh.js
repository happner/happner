module.exports = function() {
  return new ModuleMesh();
}
 function ModuleMesh() {

  var _this = this;

  _this.getReading = function(parameters, callback) {
    callback(undefined, Math.random());
  }

}
