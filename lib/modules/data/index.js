module.exports = Data;

// For shared data.

function Data() {}

Data.prototype.set = function ($happn, path, data, opts, callback) {

  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  return $happn.data.set(path, data, opts, function (err, result) {
    callback(err, result);
    if (err == null && !opts.noPublish) $happn.emit(path, data);
  });
};

Data.prototype.on = function ($happn, path, opts, handler, callback) {

  if (typeof opts == 'function') {
    callback = handler;
    handler = opts;
    opts = {};
  }

  return $happn.data.on(path, opts, handler, callback);
};

Data.prototype.off = function ($happn, path, callback) {
  return $happn.data.off(path, callback);
};

Data.prototype.offAll = function ($happn, callback) {
  return $happn.data.offAll(callback);
};

Data.prototype.offPath = function ($happn, path, callback) {
  return $happn.data.offPath(path, callback);
};

Data.prototype.get = function ($happn, path, opts, callback) {

  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  return $happn.data.get(path, opts, callback);
};

Data.prototype.getPaths = function ($happn, path, callback) {
  return $happn.data.getPaths(path, callback);
};

Data.prototype.remove = function ($happn, path, opts, callback) {

  if (typeof opts == 'function') {
    callback = opts;
    opts = {};
  }

  return $happn.data.remove(path, opts, callback);
};
