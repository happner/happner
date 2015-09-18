
module.exports = function () {
  return new Browser();
};

function Browser() {
	var _this = this;

	_this.test = function(message, done){
		done(null, message + ' tested ok');
	}

	_this.handleRequest = function($happn, req, res, next){

		// get reference to the latest script package.

		var script = $happn.tools.packages.api;

		if (req.headers['if-none-match'] == script.md5) {

      $happn.log.$$TRACE('client already has latest version ' + req.url);
      res.statusCode = 304; // <---- 304 Not Modified (RFC 7232)
      return res.end();    // <---- send nothing.
    }

    var header = {
      'Content-Type': 'text/javascript',
      'Cache-Control': "max-age=0", // <---- client should always check
      'ETag': script.md5           // <---- etag (see 'if-none-match')
    }

    if (script.gzip) {
      header['Content-Encoding'] = 'gzip'; // <---- script.data is gzipped (flag set in system/widget)
    }

    res.writeHead(200, header);
    $happn.log.$$TRACE('sending latest version ' + req.url);
    res.end(script.data);

	}
};