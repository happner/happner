module.exports = function () {
  return new Dashboard();
};

function Dashboard() {
	var _this = this;

	_this.handleRequest = function(req, res, next){

		next();
	}
};