module.exports = Data;

// For shared data.

function Data() {}

Data.prototype.set = function($happn, path, data, opts, callback){
  return $happn.data.set(path, data, opts, function(err,result) {
    if (err == null) $happn.emit(path,data);
    callback(err,result);
  });
}

Data.prototype.on = function($happn, path, opts, handler, callback){
  // handler is arriving undefined when opts is unspecified by the caller (dodging)
  if (!handler) return $happn.data.on(path, opts, callback); // opts is handler
  return $happn.data.on(path, opts, handler, callback);
}

Data.prototype.off = function($happn, path, callback){
  return $happn.data.off(path, callback);
}

Data.prototype.get = function($happn, path, opts, callback){
  return $happn.data.get(path, opts, callback);
}

Data.prototype.getPaths = function($happn, path, callback){
  return $happn.data.getPaths(path, callback);
}

Data.prototype.remove = function($happn, path, opts, callback){
  return $happn.data.remove(path, opts, callback);
}
