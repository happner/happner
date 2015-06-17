var fs = require('fs'),
byline = require('byline');

module.exports = function () {
  return new Browser();
};

function Browser() {
	var _this = this;

	_this.cached = null;

	var path = require('path');
	var stream = require('stream')
	var liner = new stream.Transform( { objectMode: true } );

	liner._transform = function (chunk, encoding, done) {
	     var data = chunk.toString()
	     if (this._lastLineData) data = this._lastLineData + data 
	 
	     var lines = data.split('\n') 
	     this._lastLineData = lines.splice(lines.length-1,1)[0] 
	 
	     lines.forEach(this.push.bind(this));

	     done();
	}

	liner._flush = function (done) {
	     if (this._lastLineData) this.push(this._lastLineData)
	     this._lastLineData = null
	     done()
	}

	_this.test = function(message, done){
		done(null, message + ' tested ok');
	}

	_this.handleRequest = function(req, res, next){

		var _this = this;

		res.setHeader("Content-Type", "application/javascript");

		if (_this.cached)
			return res.end(_this.cached);

		var path = require('path');
		var stream = byline(fs.createReadStream(path.resolve(__dirname, '../../api.js'), { encoding: 'utf8' }));
		var js = '';

		stream.on('readable', function() {
			var line;

			while (null !== (line = stream.read())) {

				if (line.indexOf('//BEGIN SERVER-SIDE ADAPTER - DO NOT REMOVE THIS COMMENT') > -1){
					line = '/*';
				}
				else if (line.indexOf('//END SERVER-SIDE ADAPTER') > -1){
					line = '*/';
				}
				else if (line.indexOf('/*BEGIN CLIENT-SIDE ADAPTER - DO NOT REMOVE THIS COMMENT') > -1){
					line = '';
				}
				else if (line.indexOf('*///END CLIENT-SIDE ADAPTER') > -1){
					line = '';
				}

				js += line + '\n';
			}
		});	

		stream.on('end', function() {
		  	_this.cached = js;
			res.end(_this.cached);
		});
	}
};