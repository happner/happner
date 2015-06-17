function MeshError(message, data) {
  this.name = 'MeshError';
  this.message = message;
  this.data = data;
}

MeshError.prototype = Object.create(Error.prototype);
MeshError.prototype.constructor = MeshError;

module.exports = MeshError;