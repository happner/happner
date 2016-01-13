;(function(isBrowser) {

  if (isBrowser) {
    window.Happner = window.Happner || {};
    window.Happner.MeshError = MeshError;
  }

  else {
    module.exports = MeshError;
  }

  function MeshError(message, data) {
    this.name = 'MeshError';
    this.message = message;
    this.data = data;
  }

  MeshError.prototype = Object.create(Error.prototype);
  MeshError.prototype.constructor = MeshError;


})(typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? false : true);
