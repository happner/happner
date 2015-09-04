var huh;

var keypress = require('keypress');
var async = require('async');
var started = false;
var running = false;
var inStream;
var outStream;

var command  = '';
var prePrompt = '> ';
var postPrompt = '';
var promptWidth = prePrompt.length;
var offset = 0;
var searching = false;
var prompting = false;
var handleKeyStrokes = null;
var isLocal = true;

var fs = require('fs-extra');
var normalize = require('path').normalize;
var sep = require('path').sep;
var dirname = require('path').dirname;

var searching;
var historyCursor = 0;
var latestCommand = '';
var keyListener;

var home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var historyFile = normalize(home + '/.happner/term_history');

var history;

process.on('exit', function() {
  try {
    return fs.writeFileSync(historyFile, history.join('\n'));
  } catch (_error) {}
});


var bell = function() {
  return outStream.write('\u0007');
};

var commands = {
  'help': {
    run: function(args, callback) {
      return showHelp(args, callback);
    },
    help: "\n\"hope this helps\"\n",
    autoComplete: function(args, callback) {
      var cmd;
      return callback(null, (function() {
        return Object.keys(commands);
      })());
    }
  }
};

var showHelp = function(args, callback) {
  var cmd;
  if (args.length > 0) {
    cmd = args[0];
    if (commands[cmd] == null) {
      outStream.write("\n" + cmd + " does not exist\n\n");
      return callback();
    }
    outStream.write(commands[cmd].help || ("\nno help for " + cmd + "\n\n"));
    return callback();
  }
  outStream.write('\n');
  outStream.write("help [command]           Per command help.\n");
  outStream.write('\n');
  for (cmd in commands) {
    outStream.write(cmd);
    outStream.cursorTo(25);
    outStream.write(commands[cmd].description || 'No description.');
    outStream.write('\n');
  }
  return callback();
};


var setPrompt = function(newPrompt) {
  prePrompt = newPrompt;
  return promptWidth = prePrompt.length;
};

var writePrompt = function(newline) {
  try {
    if (newline) {
      outStream.write("\n" + prePrompt + command + postPrompt);
    } else {
      outStream.write(prePrompt + command + postPrompt);
    }
    return outStream.cursorTo(promptWidth + command.length);
  } catch(e) {}
};

var appendToCommand = function(char) {
  var ch, chars, j, len;
  chars = [];
  for (j = 0, len = command.length; j < len; j++) {
    ch = command[j];
    chars.push(ch);
  }
  chars.splice(command.length - offset, 0, char);
  command = chars.join('');
  outStream.clearLine();
  outStream.cursorTo(0);
  writePrompt();
  outStream.cursorTo(command.length - offset + promptWidth);
  if (searching) {
    return updateSearch();
  }
};

var runCommand = function() {
  if (!isLocal) outStream.write('\n');
  var args, callback, cmd, err;
  command = command.trim();
  if (command.length === 0) {
    return writePrompt(true);
  }
  running = true;
  args = command.split(' ');
  cmd = args[0];
  args = args.slice(1);
  if (commands[cmd] != null) {
    if (history[0] !== command) {
      history.unshift(command);
    }
    while (history.length > 2000) {
      history.pop();
    }
    command = '';
    try {
      callback = function(err, res) {
        running = false;
        if (err != null) {
          outStream.write('\n');
          outStream.write("" + (err.toString()) + '\n');
        } else {
          // outStream.write('\n');
          if (res != null) {
            outStream.write(JSON.stringify(res,null,2) + '\n');
          }
        }
        writePrompt(true);
        return handleKeyStrokes = null;
      };
      // callback.write = function(text) {
      //   outStream.clearLine();
      //   outStream.cursorTo(0);
      //   return outStream.write(text.toString());
      // };
      // callback.writeLine = function(text) {
      //   return console.log(text);
      // };
      commands[cmd].run(args, callback);
      handleKeyStrokes = commands[cmd].keyStrokes;
      return;
    } catch (_error) {
      err = _error;
      running = false;
      outStream.write("" + (err.toString()) + '\n');
    }
  } else {
    outStream.write("\n" + cmd + ": command not found\n");
    command = '';
    running = false;
  }
  return writePrompt(false);
};

var lastPart = void 0;

var autoCompleteStartsWith = function(args, array) {
  var accum, col, j, k, l, len, len1, letter, newArray, part, ref3, shortest, word;
  if (array.length === 0) {
    array = null;
  }
  part = (function() {
    try {
      return args[args.length - 1];
    } catch (_error) {}
  })();
  part || (part = '');
  accum = '';
  if (part.length > 0) {
    newArray = [];
    array.map(function(word) {
      if (word.indexOf(part) === 0) {
        return newArray.push(word);
      }
    });
    if (newArray.length === 1) {
      return [newArray[0], true, newArray];
    }
    if (newArray.length !== 0) {
      array = newArray;
    } else {
      bell();
      return [null, false, []];
    }
  }
  shortest = 1000;
  for (j = 0, len = array.length; j < len; j++) {
    word = array[j];
    if (!(shortest < word.length)) {
      shortest = word.length;
    }
  }
  for (col = k = 0, ref3 = shortest; 0 <= ref3 ? k <= ref3 : k >= ref3; col = 0 <= ref3 ? ++k : --k) {
    letter = void 0;
    for (l = 0, len1 = array.length; l < len1; l++) {
      word = array[l];
      if (!word[col]) {
        continue;
      }
      letter || (letter = word[col]);
      if (letter !== word[col]) {
        return [accum, false, array];
      }
    }
    if (letter != null) {
      accum += letter;
    }
  }
  return [accum, false, array];
};

var writeAutoCompletePosibilities = function(array, type) {
  var last, nextPaths, parts, path;
  if (type === 'path') {
    nextPaths = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = array.length; j < len; j++) {
        path = array[j];
        parts = path.split(sep);
        last = parts.length - 1;
        if (parts[last] === '') {
          results.push(path = parts[last - 1] + sep);
        } else {
          results.push(path = parts[last]);
        }
      }
      return results;
    })();
    outStream.write("\n\n" + (nextPaths.join('\n')) + '\n\n');
    return;
  }
  return outStream.write("\n\n" + (array.join('\n')) + '\n\n');
};

var autoCompleteAssemble = function(possibles, args, completion, arg) {
  var fullMatch, matches, part, type;
  part = arg[0], fullMatch = arg[1], matches = arg[2];
  if (part == null) {
    return;
  }
  type = void 0;
  try {
    type = completion.type;
  } catch (_error) {}
  if (fullMatch) {
    command = command.substr(0, command.length - args[args.length - 1].length);
    command += part + ' ';
    outStream.clearLine();
    outStream.cursorTo(0);
    writePrompt();
    lastPart = void 0;
    return;
  }
  if (part.length === 0) {
    writeAutoCompletePosibilities(possibles, type);
    writePrompt(true);
    lastPart = void 0;
    return;
  }
  if (part === lastPart) {
    writeAutoCompletePosibilities(matches, type);
    console.log();
  }
  lastPart = part;
  command = command.substr(0, command.length - args[args.length - 1].length);
  command += part;
  outStream.clearLine();
  outStream.cursorTo(0);
  return writePrompt();
};

var autoComplete = function() {
  var args, base, cmd, err, j, len, line, possibilities, ref3;
  offset = 0;
  if (command.trim().length === 0) {
    showHelp([], function() {});
    writePrompt(true);
    return;
  }
  args = command.split(' ');
  cmd = args[0];
  args = args.slice(1);
  if ((commands[cmd] != null) && args.length > 0) {
    (base = commands[cmd]).autoComplete || (base.autoComplete = function() {
      bell();
      return null;
    });
    try {
      commands[cmd].autoComplete(args, function(err, possibles) {
        var contents, e, f, file, j, len, parts, path, possibilities, stat, type;
        if (err != null) {
          outStream.write('\n');
          outStream.write("Error in autoComplete " + (err.toString()) + '\n');
          command = '';
          writePrompt(true);
          return;
        }
        if (!possibles) {
          bell();
          return;
        }
        if (possibles.constructor.name === 'Array') {
          return autoCompleteAssemble(possibles, args, null, autoCompleteStartsWith(args, possibles));
        }
        if (possibles.type !== 'path') {
          return;
        }
        path = args[args.length - 1];
        parts = path.split(sep);
        file = parts.pop();
        path = parts.join(sep) + sep;
        if (path === sep) {
          if (args[args.length - 1][0] !== '/') {
            if (args[args.length - 1] !== sep) {
              path = '';
            }
          }
        }
        try {
          stat = fs.lstatSync(path);
          if (stat.isDirectory()) {
            path = normalize(path + sep);
          }
        } catch (_error) {
          path = '.' + sep;
        }
        possibilities = [];
        contents = fs.readdirSync(path);
        for (j = 0, len = contents.length; j < len; j++) {
          f = contents[j];
          f = normalize(path + sep + f);
          try {
            stat = fs.lstatSync(f);
            if (stat.isDirectory()) {
              f += sep;
            }
            if (possibles.onlyDirectories) {
              if (stat.isDirectory()) {
                possibilities.push(f);
              }
              continue;
            }
            possibilities.push(f);
          } catch (_error) {
            e = _error;
            outStream.write('\n');
            outStream.write("Error in autoComplete " + (e.toString()) + '\n');
            writePrompt(true);
          }
        }
        if (possibilities.length === 0) {
          bell();
          return;
        }
        autoCompleteAssemble(possibilities, args, possibles, autoCompleteStartsWith(args, possibilities));
        type = possibles.type || '';
        if (type === 'path') {
          if (args[args.length - 1].length !== 0) {
            if (command.match(/\/\s$/)) {
              command = command.substr(0, command.length - 1);
              outStream.clearLine();
              outStream.cursorTo(0);
              return writePrompt();
            }
          }
        }
      });
    } catch (_error) {
      err = _error;
      outStream.write('\n');
      outStream.write("Error in autoComplete " + (err.toString()) + '\n');
      outStream.write(err.stack + '\n');
      command = '';
      writePrompt(true);
    }
    return;
  }
  possibilities = (function() {
    var results;
    results = [];
    for (cmd in commands) {
      results.push(cmd);
    }
    return results;
  })();
  autoCompleteAssemble(possibilities, [command], null, autoCompleteStartsWith([command], possibilities));
  if (command.match(/\s$/)) {
    cmd = command.substr(0, command.length - 1);
    ref3 = commands[cmd].help.split('\n');
    for (j = 0, len = ref3.length; j < len; j++) {
      line = ref3[j];
      if (line.match(/Usage\:/)) {
        outStream.clearLine();
        outStream.cursorTo(0);
        outStream.write(line + '\n');
        outStream.write('\n');
        writePrompt();
      }
    }
    return commands[cmd].autoComplete([''], function(err, res) {
      if (res.type === 'path' && (res.startIn != null)) {
        command = cmd + ' ' + res.startIn;
      }
      outStream.clearLine();
      outStream.cursorTo(0);
      return writePrompt();
    });
  }
};


var historyScroll = function(direction) {
  switch (direction) {
    case 'up':
      if (historyCursor === 0) {
        latestCommand = command;
      }
      if (!(historyCursor >= history.length)) {
        historyCursor++;
      }
      break;
    case 'down':
      if (historyCursor !== 0) {
        historyCursor--;
      }
  }
  command = history[historyCursor - 1] || latestCommand;
  outStream.clearLine();
  outStream.cursorTo(0);
  return writePrompt();
};

var historySearch = function() {
  if (searching) {
    return updateSearch(searchLine);
  }
  searching = true;
  command = '';
  setPrompt('(search)\'');
  postPrompt = '\':';
  outStream.clearLine();
  outStream.cursorTo(0);
  return writePrompt();
};

var searchLine = 0;

var updateSearch = function(start) {
  var found, i, j, line, position, ref3, ref4;
  if (start == null) {
    start = 0;
  }
  searchLine = start;
  if (command.length === 0) {
    outStream.clearLine();
    outStream.cursorTo(0);
    postPrompt = '\':';
    writePrompt(false);
    return;
  }
  found = false;
  for (i = j = ref3 = start, ref4 = history.length; ref3 <= ref4 ? j <= ref4 : j >= ref4; i = ref3 <= ref4 ? ++j : --j) {
    line = history[i] || '';
    position = line.indexOf(command);
    if (position === -1) {
      searchLine++;
      continue;
    }
    postPrompt = "': " + line;
    searchLine++;
    found = true;
    break;
  }
  if (!found) {
    command = command.substr(0, command.length - 1);
    postPrompt = '\':';
    bell();
  }
  outStream.clearLine();
  outStream.cursorTo(0);
  return writePrompt(false);
};

var endSearch = function() {
  command = history[searchLine - 1] || '';
  if (postPrompt.length < 3) {
    command = '';
  }
  postPrompt = '';
  setPrompt(huh);
  outStream.clearLine();
  outStream.cursorTo(0);
  writePrompt(false);
  return searching = false;
};

var cursorScroll = function(direction) {
  var position;
  position = command.length - offset;
  switch (direction) {
    case 'left':
      if (position !== 0) {
        offset++;
        position--;
      }
      break;
    case 'right':
      if (!(position >= command.length)) {
        offset--;
        position++;
      }
  }
  return outStream.cursorTo(position + promptWidth);
};

var backspace = function() {
  var char, chars, j, len, position;
  if (command.length === 0) {
    return;
  }
  position = command.length - offset - 1;
  if (position < 0) {
    return;
  }
  chars = [];
  for (j = 0, len = command.length; j < len; j++) {
    char = command[j];
    chars.push(char);
  }
  chars.splice(position, 1);
  command = chars.join('');
  outStream.clearLine();
  outStream.cursorTo(0);
  writePrompt();
  outStream.cursorTo(position + promptWidth);
  if (searching) {
    return updateSearch();
  }
};

module.exports.start = function($happn, opts, commands, callback) {

  var errors, help = opts.help;

  try {
    fs.ensureDirSync(dirname(historyFile));
  } catch(e) {
    $happn.log.warn('no read/write at ' + historyFile);
    $happn.log.info('continuing without history');
  }

  history = (function() {
    try {
      return fs.readFileSync(historyFile).toString().trim().split('\n');
    } catch (_error) {}
  })();

  history || (history = []);

  if (typeof $happner !== 'undefined') {
    $happner.terminal = {
      prompt: module.exports,
      commands: commands
    }
  }

  setPrompt(opts.prefix || '> ');
  huh = opts.prefix || '> '; 

  async.parallel(
    Object.keys(commands).map(
      function(name) {
        return function(done) {

          var action = commands[name];
          var opts = {
            $happn: $happn,
            prompt: module.exports,
            log: $happn.log,
            help: help,
          }

          if (typeof action == 'function') {
            action(opts, function(err, action) {
              if (err) {
                errors = errors || [];
                errors.push(err);
                $happn.log.error('create failed for command \''+ name +'\'', err);
                return done(); // keep going (ignore failed command creation)
              }
              module.exports.registerCommand(name, action);
              done()
            });
            return;
          }

          module.exports.registerCommand(name, action);
          done();
        }
      }
    ),
    function() {
      module.exports.setStreams(process.stdin, console._stdout, true, opts.help, true);
      callback(errors, module.exports);
    }
  );
}

module.exports.registerCommand = function(name, action, callback) {
  if (typeof action.run !== 'function') {
    return callback(new Error('Missing action.run(args, callback)'))
  }
  
  commands[name] = action;
  if (typeof callback == 'function') callback(null, {status: 'ok'});
}

module.exports.writePrompt = writePrompt;

module.exports.clearListener = function() {
  try {
    inStream.removeListener('keypress', keyListener);
  } catch(e) {}
}

module.exports.setStreams = function(inn, out, local, showHelp, refresh) {
  if (typeof showHelp === 'undefined') showHelp = true;
  module.exports.clearListener();
  isLocal = local;
  inStream = inn;
  outStream = out;
  keypress(inStream);
  try {inStream.setRawMode(true);} catch(e) {}
  inStream.on('keypress', keyListener = function(ch, key) {
    if (running) {
      if (handleKeyStrokes != null) {
        handleKeyStrokes(ch, key);
      }
      return;
    }
    try {
      if (key.name === 'return') {
        historyCursor = 0;
        if (searching) {
          endSearch();
        }
        if (command.length > 0) {
          return runCommand();
        }
        return writePrompt(true);
      }
    } catch (_error) {}
    if (key == null) {
      return appendToCommand(ch);
    }
    if ((ch != null) && ch.match(/^[a-zA-Z0-9_]*$/)) {
      return appendToCommand(ch);
    }
    try {
      if (key.ctrl && (key.name === 'c' || key.name === 'd')) {
        historyCursor = 0;
        if (searching) {
          endSearch();
          command = '';
          outStream.clearLine();
          outStream.cursorTo(0);
          writePrompt(false);
          return;
        }
        try {
          if (command.length > 0) {
            command = '';
            return writePrompt(true);
          }
        } catch (_error) {}
        try {
          done();
        } catch (_error) {}
        if (isLocal) {
          if (typeof callOnStop == 'function') {
            module.exports.clearListener();
            callOnStop();
          } else {
            return process.exit(1);
          }
        } else {
          outStream.write('\nprompt gone\n');
          try {
            outStream.reset();
          } catch (e) {};
          if (started)
            if (!remoteStarted)
              module.exports.setStreams(process.stdin, console._stdout, true, false);
            else
              module.exports.clearListener()
          // writePrompt(true);
        }
      }
    } catch (_error) {}
    if ((ch != null) && ch === ' ') {
      return appendToCommand(ch);
    }
    try {
      if (key.name === 'tab') {
        if (searching) {
          return endSearch();
        }
        return autoComplete();
      }
    } catch (_error) {}
    try {
      if (key.name === 'backspace') {
        return backspace();
      }
    } catch (_error) {}
    try {
      if (key.ctrl && key.name === 'r') {
        return historySearch();
      }
    } catch (_error) {}
    try {
      if (key.name === 'up' || key.name === 'down') {
        if (searching) {
          return;
        }
        return historyScroll(key.name);
      }
    } catch (_error) {}
    try {
      if (key.name === 'left' || key.name === 'right') {
        return cursorScroll(key.name);
      }
    } catch (_error) {}
  });
  if (showHelp) {
    outStream.write('\n');
    outStream.write('\n');
    outStream.write("    help . . provides\n");
    outStream.write("    tab  . . auto-completes command ((Twice)\n");
    outStream.write("    ^c . . . quits or clears line\n");
    outStream.write("    ^r . . . reverse searches command history\n");
    outStream.write("             (tab chooses, return runs)\n");
    outStream.write('\n');
    // outStream.write('\n');
  }

  if (refresh) writePrompt(showHelp);

}
