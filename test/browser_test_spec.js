(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":5}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":3,"inherits":2}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function _defineProperty(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Functified = (function () {
    function Functified(iterable) {
        _classCallCheck(this, Functified);

        // avoid re-wrapping iterables that have already been Functified
        if (iterable.isFunctified) {
            return iterable;
        }
        this.iterable = iterable;
        this.isFunctified = true;
    }

    _createClass(Functified, [{
        key: Symbol.iterator,
        value: function* () {
            for (var value of this.iterable) {
                yield value;
            }
        }
    }, {
        key: "custom",

        // fn(iterable) -> generator function
        value: function custom(fn) {
            return Functified.fromGenerator(fn(this.iterable));
        }
    }, {
        key: "distinct",

        // alias dedupe, unique
        value: function distinct() {
            var iterable = this.iterable;
            var memory = new Set();
            return Functified.fromGenerator(function* () {
                for (var value of iterable) {
                    if (!memory.has(value)) {
                        memory.add(value);
                        yield value;
                    }
                }
            });
        }
    }, {
        key: "filter",
        value: function filter(callback) {
            var iterable = this.iterable;
            return Functified.fromGenerator(function* () {
                for (var value of iterable) {
                    if (callback(value)) {
                        yield value;
                    }
                }
            });
        }
    }, {
        key: "flatten",
        value: function flatten() {
            var iterable = this.iterable;
            return Functified.fromGenerator(function* () {
                for (var value of iterable) {
                    if (value[Symbol.iterator]) {
                        yield* functify(value).flatten();
                    } else {
                        yield value;
                    }
                }
            });
        }
    }, {
        key: "groupBy",
        value: function groupBy() {
            var _this = this;

            for (var _len = arguments.length, predicates = Array(_len), _key = 0; _key < _len; _key++) {
                predicates[_key] = arguments[_key];
            }

            return functify(predicates.map(function (fn) {
                return _this.filter(fn);
            }));
        }
    }, {
        key: "groupByMap",
        value: function groupByMap(map) {
            var _this2 = this;

            return functify(map).map(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2);

                var name = _ref2[0];
                var fn = _ref2[1];
                return [name, _this2.filter(fn)];
            });
        }
    }, {
        key: "repeat",
        value: function repeat() {
            var n = arguments[0] === undefined ? 1 : arguments[0];

            var iterable = this.iterable;
            return Functified.fromGenerator(function* () {
                var i = 0;
                while (i++ < n) {
                    for (var value of iterable) {
                        yield value;
                    }
                }
            });
        }
    }, {
        key: "loop",

        // alias for repeat
        value: function loop() {
            var n = arguments[0] === undefined ? 1 : arguments[0];

            console.warn("deprecating loop(n), use repeat(n) instead");
            return this.repeat(n);
        }
    }, {
        key: "map",
        value: function map(callback) {
            var iterable = this.iterable;
            return Functified.fromGenerator(function* () {
                for (var value of iterable) {
                    yield callback(value);
                }
            });
        }
    }, {
        key: "skip",
        value: function skip(n) {
            var iterable = this.iterable;
            return Functified.fromGenerator(function* () {
                var i = 0;
                for (var value of iterable) {
                    if (i < n) {
                        i++;
                    } else {
                        yield value;
                    }
                }
            });
        }
    }, {
        key: "skipWhile",
        value: function skipWhile(predicate) {
            var iterable = this.iterable;
            return Functified.fromGenerator(function* () {
                var skip = true;
                for (var value of iterable) {
                    if (!predicate(value)) {
                        skip = false;
                    }
                    if (!skip) {
                        yield value;
                    }
                }
            });
        }
    }, {
        key: "take",
        value: function take(n) {
            // using an explicit iterator supports pausable iteratables
            var iterator = this.iterable[Symbol.iterator]();
            var self = this;
            return Functified.fromGenerator(function* () {
                var i = 0;
                if (self.hasOwnProperty("startValue") && self.isPausable) {
                    yield self.startValue;
                    i++;
                }
                while (i < n) {
                    var result = iterator.next();
                    if (result.done) {
                        break;
                    } else {
                        yield result.value;
                        i++;
                    }
                }
            });
        }
    }, {
        key: "takeUntil",
        value: function takeUntil(predicate) {
            var iterator = this.iterable[Symbol.iterator]();
            var self = this;
            return Functified.fromGenerator(function* () {
                if (self.hasOwnProperty("startValue") && self.isPausable) {
                    yield self.startValue;
                }
                while (true) {
                    var result = iterator.next();
                    if (result.done) {
                        break;
                    } else {
                        if (predicate(result.value)) {
                            // save the value so we can yield if takeUntil is called again
                            self.startValue = result.value;
                            break;
                        } else {
                            yield result.value;
                        }
                    }
                }
            });
        }
    }, {
        key: "enumerate",
        value: function enumerate() {
            var start = arguments[0] === undefined ? 0 : arguments[0];

            var iterable = this.iterable;
            return Functified.fromGenerator(function* () {
                var i = start;
                for (var value of iterable) {
                    yield [i++, value];
                }
            });
        }
    }, {
        key: "zip",
        value: function zip() {
            return Functified.zip(this.iterable);
        }
    }, {
        key: "every",

        // reducing functions
        value: function every(callback) {
            for (var value of this.iterable) {
                if (!callback(value)) {
                    return false;
                }
            }
            return true;
        }
    }, {
        key: "reduce",
        value: function reduce(callback, initialValue) {
            var accum = initialValue;
            var iterator = this.iterable[Symbol.iterator]();

            if (accum === undefined) {
                var result = iterator.next();
                if (result.done) {
                    throw "not enough values to reduce";
                } else {
                    accum = result.value;
                }
            }

            while (true) {
                var result = iterator.next();
                if (result.done) {
                    break;
                } else {
                    accum = callback(accum, result.value);
                }
            }

            return accum;
        }
    }, {
        key: "some",
        value: function some(callback) {
            for (var value of this.iterable) {
                if (callback(value)) {
                    return true;
                }
            }
            return false;
        }
    }, {
        key: "entries",
        value: function entries() {
            if (this.iterable.entries) {
                return new Functified(this.iterable.entries());
            } else {
                throw "doesn't have entries";
            }
        }
    }, {
        key: "keys",
        value: function keys() {
            if (this.iterable.keys) {
                return new Functified(this.iterable.keys());
            } else {
                throw "doesn't have keys";
            }
        }
    }, {
        key: "values",
        value: function values() {
            if (this.iterable.values) {
                return new Functified(this.iterable.values());
            } else {
                throw "doesn't have values";
            }
        }
    }, {
        key: "toArray",
        value: function toArray() {
            var result = [];
            for (var value of this.iterable) {
                result.push(value);
            }
            return result;
        }
    }, {
        key: "toPausable",
        value: function toPausable() {
            var iterator = this.iterable[Symbol.iterator]();
            var functified = Functified.fromGenerator(function* () {
                while (true) {
                    var result = iterator.next();
                    if (result.done) {
                        break;
                    } else {
                        yield result.value;
                    }
                }
            });
            functified.isPausable = true;
            return functified;
        }
    }, {
        key: "toString",
        value: function toString() {
            var i = 0;
            var result = "[";
            result += this.reduce(function (str, n) {
                return str + (i++ > 0 ? ", " + n : "" + n);
            }, "");
            result += "]";
            return result;
        }
    }], [{
        key: "fromGenerator",

        // static methods
        value: function fromGenerator(generator) {
            return functify(_defineProperty({}, Symbol.iterator, generator));
        }
    }, {
        key: "fromObject",
        value: function fromObject(obj) {
            var _functify2;

            return functify((_functify2 = {}, _defineProperty(_functify2, Symbol.iterator, function* () {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        yield [key, obj[key]];
                    }
                }
            }), _defineProperty(_functify2, "entries", function entries() {
                return Functified.fromGenerator(function* () {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            yield [key, obj[key]];
                        }
                    }
                });
            }), _defineProperty(_functify2, "keys", function keys() {
                return Functified.fromGenerator(function* () {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            yield key;
                        }
                    }
                });
            }), _defineProperty(_functify2, "values", function values() {
                return Functified.fromGenerator(function* () {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            yield obj[key];
                        }
                    }
                });
            }), _functify2));
        }
    }, {
        key: "range",
        value: function range(start, stop) {
            var step = arguments[2] === undefined ? 1 : arguments[2];

            if (arguments.length === 1) {
                stop = start;
                start = 0;
            }
            return Functified.fromGenerator(function* () {
                var i = start;
                if (step > 0) {
                    while (i < stop) {
                        yield i;
                        i += step;
                    }
                } else if (step < 0) {
                    while (i > stop) {
                        yield i;
                        i += step;
                    }
                } else {
                    throw "step should not equal 0";
                }
            });
        }
    }, {
        key: "zip",
        value: function zip(iterables) {
            return Functified.fromGenerator(function* () {
                var iterators = iterables.map(function (iterable) {
                    if (iterable[Symbol.iterator]) {
                        return iterable[Symbol.iterator]();
                    } else {
                        throw "can't zip a non-iterable";
                    }
                });
                while (true) {
                    var vector = [];
                    for (var iterator of iterators) {
                        var result = iterator.next();
                        if (result.done) {
                            return; // finished
                        } else {
                            vector.push(result.value);
                        }
                    }
                    yield vector;
                }
            });
        }
    }, {
        key: "keys",
        value: function keys(obj) {
            console.warn("functify.keys is deprecated and will be removed in 0.3.0");
            console.warn("use functify(obj).keys() instead");
            if (!(obj instanceof Object)) {
                throw "can't get keys for a non-object";
            }
            return Functified.fromGenerator(function* () {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        yield key;
                    }
                }
            });
        }
    }, {
        key: "values",
        value: function values(obj) {
            console.log("functify.values is deprecated and will be removed in 0.3.0");
            console.warn("use functify(obj).values() instead");
            return Functified.keys(obj).map(function (key) {
                return obj[key];
            });
        }
    }, {
        key: "entries",
        value: function entries(obj) {
            console.log("functify.entries is deprecated and will be removed in 0.3.0");
            console.warn("use functify(obj).entries() instead");
            if (!(obj instanceof Object)) {
                throw "can't get keys for a non-object";
            }
            return Functified.fromGenerator(function* () {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        yield [key, obj[key]];
                    }
                }
            });
        }
    }]);

    return Functified;
})();

function functify(iterable) {
    if (!iterable[Symbol.iterator]) {
        return Functified.fromObject(iterable);
    } else {
        return new Functified(iterable);
    }
}

functify.fromGenerator = Functified.fromGenerator;
functify.range = Functified.range;
functify.zip = Functified.zip;
functify.keys = Functified.keys;
functify.values = Functified.values;
functify.entries = Functified.entries;

exports["default"] = functify;
module.exports = exports["default"];

},{}],7:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

if (require) {
    var assert = require("assert");
    var functify = require("../src/functify");
}

describe("functify", function () {
    var numbers, result;

    beforeEach(function () {
        numbers = functify([1, 2, 3, 4, 5]);
        result = [];
    });

    describe("Basic operations", function () {
        it("should return an iterable", function () {
            for (var num of numbers) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2, 3, 4, 5]);
        });

        it("should filter iterables", function () {
            for (var num of numbers.filter(function (n) {
                return n % 2;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 3, 5]);
        });

        it("should map iterables", function () {
            for (var num of numbers.map(function (n) {
                return n * n;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 4, 9, 16, 25]);
        });

        it("should chain methods", function () {
            for (var num of numbers.filter(function (n) {
                return n % 2;
            }).map(function (n) {
                return n * n;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 9, 25]);
        });

        it("should group iterables using predicates", function () {
            var _numbers$groupBy = numbers.groupBy(function (x) {
                return x % 2;
            }, function (x) {
                return x % 2 === 0;
            });

            var _numbers$groupBy2 = _slicedToArray(_numbers$groupBy, 2);

            var odds = _numbers$groupBy2[0];
            var evens = _numbers$groupBy2[1];

            var evenResult = [];
            var oddResult = [];
            for (var num of evens) {
                evenResult.push(num);
            }
            for (var num of odds) {
                oddResult.push(num);
            }
            assert.deepEqual(evenResult, [2, 4]);
            assert.deepEqual(oddResult, [1, 3, 5]);
        });

        it("should groupByMap using a Map of predicates", function () {
            var map = new Map();
            map.set("odd", function (x) {
                return x % 2;
            });
            map.set("even", function (x) {
                return x % 2 === 0;
            });
            result = {};
            for (var _ref3 of numbers.groupByMap(map)) {
                var _ref2 = _slicedToArray(_ref3, 2);

                var _ref2$0 = _ref2[0];
                var key = _ref2$0 === undefined ? "" : _ref2$0;
                var _ref2$1 = _ref2[1];
                var val = _ref2$1 === undefined ? 0 : _ref2$1;

                result[key] = [];
                for (var item of val) {
                    result[key].push(item);
                }
            }
            assert.deepEqual(result, {
                "odd": [1, 3, 5],
                "even": [2, 4]
            });
        });

        it("should zip iterables", function () {
            var pairs = numbers.groupBy(function (x) {
                return x % 2;
            }, function (x) {
                return x % 2 === 0;
            }).zip();
            for (var pair of pairs) {
                result.push(pair);
            }
            assert.deepEqual(result, [[1, 2], [3, 4]]);
        });

        it("should produce a string representation", function () {
            assert.equal(numbers.toString(), "[1, 2, 3, 4, 5]");
        });

        it("should reduce to produce a sum", function () {
            var sum = numbers.reduce(function (accum, value) {
                return accum + value;
            }, 0);
            assert.equal(sum, 15);
        });

        it("should reduce to produce a sum without an initialValue", function () {
            var sum = numbers.reduce(function (accum, value) {
                return accum + value;
            });
            assert.equal(sum, 15);
        });

        it("should implement some()", function () {
            result = numbers.some(function (num) {
                return num > 3;
            });
            assert.equal(result, true);
            result = numbers.some(function (num) {
                return num < 0;
            });
            assert.equal(result, false);
        });

        it("should implement every()", function () {
            result = numbers.every(function (num) {
                return num > 0;
            });
            assert.equal(result, true);
            result = numbers.every(function (num) {
                return num > 1;
            });
            assert.equal(result, false);
        });

        it("should take the first 2", function () {
            for (var num of numbers.take(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2]);
        });

        it("should take all if n > length", function () {
            for (var num of numbers.take(10)) {
                result.push(num);
            }
            assert.equal(result.length, 5);
            assert.deepEqual(result, [1, 2, 3, 4, 5]);
        });

        it("should skip the first 2", function () {
            for (var num of numbers.skip(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [3, 4, 5]);
        });

        it("should skip all if n >= length", function () {
            for (var num of numbers.skip(10)) {
                result.push(num);
            }
            assert.deepEqual(result, []);
        });

        it("should skipWhile predicate is true", function () {
            for (var num of numbers.skipWhile(function (x) {
                return x < 3;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [3, 4, 5]);
        });

        it("should skip all if skipWhile predice is always true", function () {
            for (var num of numbers.skipWhile(function (x) {
                return true;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, []);
        });

        it("should flatten nested arrays", function () {
            var nested = functify([1, [2, 3], [], [[4], 5], [[]]]);
            for (var num of nested.flatten()) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2, 3, 4, 5]);
        });

        it("should remove duplicates", function () {
            numbers = functify([1, 1, 2, 3, 5]);
            for (var num of numbers.distinct()) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2, 3, 5]);
        });

        it("should loop", function () {
            for (var num of numbers.loop(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
        });

        it("should stop an infinite loop with take", function () {
            for (var num of numbers.loop(Infinity).take(8)) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2, 3, 4, 5, 1, 2, 3]);
        });

        it("should iterate object keys", function () {
            var keys = functify.keys({ x: 5, y: 10 });
            for (var key of keys) {
                result.push(key);
            }
            assert.deepEqual(result, ["x", "y"]);
        });

        it("should iterate object values", function () {
            var values = functify.values({ x: 5, y: 10 });
            for (var value of values) {
                result.push(value);
            }
            assert.deepEqual(result, [5, 10]);
        });

        it("should iterate object properties as entries", function () {
            var entries = functify.entries({ x: 5, y: 10 });
            for (var _ref43 of entries) {
                var _ref42 = _slicedToArray(_ref43, 2);

                var _ref42$0 = _ref42[0];
                var key = _ref42$0 === undefined ? 0 : _ref42$0;
                var _ref42$1 = _ref42[1];
                var value = _ref42$1 === undefined ? 0 : _ref42$1;

                result.push([key, value]);
            }
            assert.deepEqual(result, [["x", 5], ["y", 10]]);
        });

        it("should return an array", function () {
            result = numbers.toArray();
            assert.deepEqual(result, [1, 2, 3, 4, 5]);
        });

        it("should always take the first n if not pausable", function () {
            for (var num of numbers.take(3)) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2, 3]);
            result = [];

            for (var num of numbers.take(3)) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2, 3]);
        });

        it("should take until a predicate is true", function () {
            for (var num of numbers.takeUntil(function (x) {
                return x > 2;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2]);
        });
    });

    describe("enumerate", function () {
        it("should iterate over [index, value] entries", function () {
            var results = {};
            var fruit = ["apple", "banana", "grapes"];
            for (var _ref53 of functify(fruit).enumerate()) {
                var _ref52 = _slicedToArray(_ref53, 2);

                var k = _ref52[0];
                var v = _ref52[1];

                results[k] = v;
            }
            assert.equal(results[0], "apple");
            assert.equal(results[1], "banana");
            assert.equal(results[2], "grapes");
        });

        it("should start at the given index", function () {
            var results = {};
            var fruit = ["apple", "banana", "grapes"];
            for (var _ref63 of functify(fruit).enumerate(1)) {
                var _ref62 = _slicedToArray(_ref63, 2);

                var k = _ref62[0];
                var v = _ref62[1];

                results[k] = v;
            }
            assert.equal(results[1], "apple");
            assert.equal(results[2], "banana");
            assert.equal(results[3], "grapes");
        });
    });

    describe("range", function () {
        it("should generate a range of numbers", function () {
            for (var num of functify.range(0, 5)) {
                result.push(num);
            }
            assert.deepEqual(result, [0, 1, 2, 3, 4]);
        });

        it("should generate a range of numbers with a negative step", function () {
            for (var num of functify.range(5, 0, -1)) {
                result.push(num);
            }
            assert.deepEqual(result, [5, 4, 3, 2, 1]);
        });

        it("should generate numbers to Infinity", function () {
            for (var num of functify.range(0, Infinity).take(20)) {
                result.push(num);
            }
            assert.equal(result[19], 19);
        });

        it("should generate numbers to -Infinity", function () {
            for (var num of functify.range(0, -Infinity, -1).take(20)) {
                result.push(num);
            }
            assert.equal(result[19], -19);
        });
    });

    describe("Pausables", function () {
        it("should create a pausable iteratble that works with take", function () {
            var pausableNumbers = numbers.toPausable();

            for (var num of pausableNumbers.take(1)) {
                result.push(num);
            }
            assert.deepEqual(result, [1]);
            result = [];

            for (var num of pausableNumbers.take(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [2, 3]);
        });

        it("should create a pausable iteratble when chaining", function () {
            var pausableSquares = numbers.map(function (x) {
                return x * x;
            }).toPausable();

            for (var num of pausableSquares.take(1)) {
                result.push(num);
            }
            assert.deepEqual(result, [1]);
            result = [];

            for (var num of pausableSquares.take(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [4, 9]);
        });

        it("should allow chaining after the first take", function () {
            var pausableNumbers = numbers.toPausable();

            for (var num of pausableNumbers.take(1)) {
                result.push(num);
            }
            assert.deepEqual(result, [1]);
            result = [];

            for (var num of pausableNumbers.map(function (x) {
                return x * x;
            }).take(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [4, 9]);
        });

        it("should always take until from the start if not pausable", function () {
            for (var num of numbers.takeUntil(function (x) {
                return x > 2;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2]);

            result = [];
            for (var num of numbers.takeUntil(function (x) {
                return x > 4;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2, 3, 4]);
        });

        it("should take until from the last position if pausable", function () {
            var pausableNumbers = numbers.toPausable();

            for (var num of pausableNumbers.takeUntil(function (x) {
                return x > 2;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2]);

            result = [];
            for (var num of pausableNumbers.takeUntil(function (x) {
                return x > 4;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [3, 4]);
        });

        it("should filter a pausable iterable", function () {
            var pausableOdds = numbers.toPausable().filter(function (x) {
                return x % 2;
            });

            for (var num of pausableOdds.take(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 3]);

            result = [];
            for (var num of pausableOdds.take(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [5]);
        });

        it("should allow take and takeUntil on the same pausable", function () {
            var pausableNumbers = numbers.toPausable();

            for (var num of pausableNumbers.takeUntil(function (x) {
                return x > 2;
            })) {
                result.push(num);
            }
            assert.deepEqual(result, [1, 2]);

            result = [];
            for (var num of pausableNumbers.take(2)) {
                result.push(num);
            }
            assert.deepEqual(result, [3, 4]);
        });
    });

    describe("Sets", function () {
        it("should work with sets", function () {
            var colors = new Set();

            colors.add("red");
            colors.add("green");
            colors.add("blue");

            for (var color of functify(colors)) {
                result.push(color);
            }

            assert(result.indexOf("red") !== -1);
            assert(result.indexOf("green") !== -1);
            assert(result.indexOf("blue") !== -1);

            assert.equal(result.length, 3);
        });
    });

    describe("Objects", function () {
        it("should return an iterable of entries for Objects", function () {
            var obj = { x: 5, y: 10 };
            var result = {};
            for (var _ref73 of functify(obj)) {
                var _ref72 = _slicedToArray(_ref73, 2);

                var k = _ref72[0];
                var v = _ref72[1];

                result[k] = v;
            }
            assert.equal(result.x, 5);
            assert.equal(result.y, 10);
        });

        it("should have .keys()", function () {
            var obj = { x: 5, y: 10 };
            var result = [];
            for (var key of functify(obj).keys()) {
                result.push(key);
            }
            assert.deepEqual(result, ["x", "y"]);
        });

        it("should have .values()", function () {
            var obj = { x: 5, y: 10 };
            var result = [];
            for (var value of functify(obj).values()) {
                result.push(value);
            }
            assert.deepEqual(result, [5, 10]);
        });

        it("should have .entries()", function () {
            var obj = { x: 5, y: 10 };
            var result = {};
            for (var _ref83 of functify(obj).entries()) {
                var _ref82 = _slicedToArray(_ref83, 2);

                var k = _ref82[0];
                var v = _ref82[1];

                result[k] = v;
            }
            assert.equal(result.x, 5);
            assert.equal(result.y, 10);
        });
    });

    describe("Maps", function () {
        it("should return an iterable of entries for Maps", function () {
            var map = new Map();
            map.set("x", 5);
            map.set("y", 10);
            var result = {};
            for (var _ref93 of functify(map)) {
                var _ref92 = _slicedToArray(_ref93, 2);

                var k = _ref92[0];
                var v = _ref92[1];

                result[k] = v;
            }
            assert.equal(result.x, 5);
            assert.equal(result.y, 10);
        });

        it("should have .keys()", function () {
            var map = new Map();
            map.set("x", 5);
            map.set("y", 10);
            var result = [];
            for (var key of functify(map).keys()) {
                result.push(key);
            }
            assert.deepEqual(result, ["x", "y"]);
        });

        it("should have .values()", function () {
            var map = new Map();
            map.set("x", 5);
            map.set("y", 10);
            var result = [];
            for (var value of map.values()) {
                result.push(value);
            }
            assert.deepEqual(result, [5, 10]);
        });

        it("should have .entries()", function () {
            var map = new Map();
            map.set("x", 5);
            map.set("y", 10);
            var result = {};
            for (var _ref103 of functify(map).entries()) {
                var _ref102 = _slicedToArray(_ref103, 2);

                var k = _ref102[0];
                var v = _ref102[1];

                result[k] = v;
            }
            assert.equal(result.x, 5);
            assert.equal(result.y, 10);
        });

        it("should return chainable iterators", function () {
            var map = new Map();
            map.set("x", 5);
            map.set("y", 10);
            var result = [];
            for (var v of functify(map).entries().map(function (pair) {
                return pair[1] * pair[1];
            })) {
                result.push(v);
            }
            assert.deepEqual(result, [25, 100]);
        });
    });
});

},{"../src/functify":6,"assert":1}]},{},[7]);
