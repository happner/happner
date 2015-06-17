module.exports = function () {
  return new Resources();
};

function Resources() {
	var _this = this;

	_this.handleRequest = function(req, res, next){

		next();
	}
};