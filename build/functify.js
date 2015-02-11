"use strict";

var _slicedToArray = function (arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else {
    var _arr = [];

    for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      _arr.push(_step.value);

      if (i && _arr.length === i) break;
    }

    return _arr;
  }
};

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var Functified = (function () {
  function Functified(iterable) {
    this.iterable = iterable;
    this.isFunctified = true;
  }

  Functified.prototype[Symbol.iterator] = function* () {
    for (var _iterator = this.iterable[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      var value = _step.value;
      yield value;
    }
  };

  // fn(iterable) -> generator function
  Functified.prototype.custom = function (fn) {
    var generator = fn(this.iterable);
    return Functified.fromGenerator(generator);
  };

  // alias dedupe, unique
  Functified.prototype.distinct = function () {
    var iterable = this.iterable;
    var memory = new Set();
    return Functified.fromGenerator(function* () {
      for (var _iterator2 = iterable[Symbol.iterator](), _step2; !(_step2 = _iterator2.next()).done;) {
        var value = _step2.value;
        if (!memory.has(value)) {
          memory.add(value);
          yield value;
        }
      }
    });
  };

  Functified.prototype.filter = function (callback) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      for (var _iterator3 = iterable[Symbol.iterator](), _step3; !(_step3 = _iterator3.next()).done;) {
        var value = _step3.value;
        if (callback(value)) {
          yield value;
        }
      }
    });
  };

  Functified.prototype.flatten = function () {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      for (var _iterator4 = iterable[Symbol.iterator](), _step4; !(_step4 = _iterator4.next()).done;) {
        var value = _step4.value;
        if (value[Symbol.iterator]) {
          yield* functify(value).flatten();
        } else {
          yield value;
        }
      }
    });
  };

  Functified.prototype.groupBy = function () {
    var _this = this;
    var predicates = [];

    for (var _key = 0; _key < arguments.length; _key++) {
      predicates[_key] = arguments[_key];
    }

    if (predicates.length > 1) {
      return functify(predicates.map(function (fn) {
        return _this.filter(fn);
      }));
    }
  };

  Functified.prototype.groupByMap = function (map) {
    var _this2 = this;
    return functify(functify(map).map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var name = _ref2[0];
      var fn = _ref2[1];
      return [name, _this2.filter(fn)];
    }));
  };

  // be careful with this one
  // could combine this with with take
  // consider using 2 as the default number of loops
  Functified.prototype.loop = function () {
    var n = arguments[0] === undefined ? Infinity : arguments[0];
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      var i = 0;
      while (i++ < n) {
        for (var _iterator5 = iterable[Symbol.iterator](), _step5; !(_step5 = _iterator5.next()).done;) {
          var value = _step5.value;
          yield value;
        }
      }
    });
  };

  Functified.prototype.map = function (callback) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      for (var _iterator6 = iterable[Symbol.iterator](), _step6; !(_step6 = _iterator6.next()).done;) {
        var value = _step6.value;
        yield callback(value);
      }
    });
  };

  Functified.prototype.skip = function (n) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      var i = 0;
      for (var _iterator7 = iterable[Symbol.iterator](), _step7; !(_step7 = _iterator7.next()).done;) {
        var value = _step7.value;
        if (i < n) {
          i++;
        } else {
          yield value;
        }
      }
    });
  };

  Functified.prototype.skipWhile = function (predicate) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      var skip = true;
      for (var _iterator8 = iterable[Symbol.iterator](), _step8; !(_step8 = _iterator8.next()).done;) {
        var value = _step8.value;
        if (!predicate(value)) {
          skip = false;
        }
        if (!skip) {
          yield value;
        }
      }
    });
  };

  Functified.prototype.take = function (n) {
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
  };

  Functified.prototype.takeUntil = function (predicate) {
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
  };

  Functified.prototype.zip = function () {
    return Functified.zip(this.iterable);
  };

  // static methods
  Functified.fromGenerator = function (generator) {
    return functify((function () {
      var _functify = {};

      _functify[Symbol.iterator] = generator;
      return _functify;
    })());
  };

  Functified.entries = function (obj) {
    return functify(Object.keys(obj)).map(function (key) {
      return [key, obj[key]];
    });
  };

  Functified.zip = function (iterables) {
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
        for (var _iterator9 = iterators[Symbol.iterator](), _step9; !(_step9 = _iterator9.next()).done;) {
          var iterator = _step9.value;
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
  };

  // reducing functions
  Functified.prototype.every = function (callback) {
    for (var _iterator10 = this.iterable[Symbol.iterator](), _step10; !(_step10 = _iterator10.next()).done;) {
      var value = _step10.value;
      if (!callback(value)) {
        return false;
      }
    }

    return true;
  };

  Functified.prototype.reduce = function (callback, initialValue) {
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
  };

  Functified.prototype.some = function (callback) {
    for (var _iterator11 = this.iterable[Symbol.iterator](), _step11; !(_step11 = _iterator11.next()).done;) {
      var value = _step11.value;
      if (callback(value)) {
        return true;
      }
    }

    return false;
  };

  Functified.prototype.toArray = function () {
    var result = [];
    for (var _iterator12 = this.iterable[Symbol.iterator](), _step12; !(_step12 = _iterator12.next()).done;) {
      var value = _step12.value;
      result.push(value);
    }

    return result;
  };

  Functified.prototype.toPausable = function () {
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
  };

  Functified.prototype.toString = function () {
    var i = 0;
    var result = "[";
    result += this.reduce(function (str, n) {
      return str + (i++ > 0 ? ", " + n : "" + n);
    }, "");
    result += "]";
    return result;
  };

  _prototypeProperties(Functified, {}, {});

  return Functified;
})();

var functify = function (iterable) {
  return new Functified(iterable);
};

var range = function (start, stop) {
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
};

exports.functify = functify;
exports.Functified = Functified;
exports.range = range;
