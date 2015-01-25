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

// TODO: think about a reverse iterator for array-like and map-like objects
// a getter that returns an iterable

// create a separate project for this mixin
// then users can choose what to mix it in with
var revIter = Symbol("revIter");
Object.defineProperty(Array.prototype, revIter, {
  get: function () {
    var _this = this;
    return (function () {
      var _ref = {};

      _ref[Symbol.iterator] = function* () {
        var i = _this.length - 1;
        while (i > -1) {
          yield _this[i--];
        }
      };

      return _ref;
    })();
  }
});


function reduce(iterable, callback, initialValue) {
  var result = initialValue;
  for (var _iterator = iterable[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
    var value = _step.value;
    result = callback(result, value);
  }

  return result;
}

function every(iterable, callback) {
  for (var _iterator2 = iterable[Symbol.iterator](), _step2; !(_step2 = _iterator2.next()).done;) {
    var value = _step2.value;
    if (!callback(value)) {
      return false;
    }
  }

  return true;
}

function some(iterable, callback) {
  for (var _iterator3 = iterable[Symbol.iterator](), _step3; !(_step3 = _iterator3.next()).done;) {
    var value = _step3.value;
    if (callback(value)) {
      return true;
    }
  }

  return false;
}


// TODO: have static version of each method so they can be passed to things like "map" and then applied to an iterable
// this is really only useful when you start having iterables of iterables
var Functified = (function () {
  function Functified(iterable) {
    this.iterable = iterable;
    this.isFunctified = true;
  }

  Functified.fromGenerator = function (generator) {
    return functify((function () {
      var _functify = {};

      _functify[Symbol.iterator] = generator;
      return _functify;
    })());
  };

  Functified.prototype[Symbol.iterator] = function* () {
    for (var _iterator4 = this.iterable[Symbol.iterator](), _step4; !(_step4 = _iterator4.next()).done;) {
      var value = _step4.value;
      yield value;
    }
  };

  Functified.prototype.filter = function (callback) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      for (var _iterator5 = iterable[Symbol.iterator](), _step5; !(_step5 = _iterator5.next()).done;) {
        var value = _step5.value;
        if (callback(value)) {
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

  // TODO: create a pausable iterator or something that will produce one
  // could be used to do work that needs to be repeatedly paused to keep the UI
  // from freezing up, e.g. raytracer
  Functified.prototype.take = function (n) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      var i = 0;
      for (var _iterator7 = iterable[Symbol.iterator](), _step7; !(_step7 = _iterator7.next()).done;) {
        var value = _step7.value;
        if (i++ < n) {
          yield value;
        } else {
          break;
        }
      }
    });
  };

  Functified.prototype.skip = function (n) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      var i = 0;
      for (var _iterator8 = iterable[Symbol.iterator](), _step8; !(_step8 = _iterator8.next()).done;) {
        var value = _step8.value;
        if (i < n) {
          i++;
        } else {
          yield value;
        }
      }
    });
  };

  // TODO: how can you tell if an iterator will complete or not
  // is it be call synchronously?
  // does it loop?
  // will the loop ever terminate?
  // halting problem?

  // be careful with this one
  Functified.prototype.loop = function () {
    var n = arguments[0] === undefined ? Infinity : arguments[0];
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      var i = 0;
      while (i++ < n) {
        for (var _iterator9 = iterable[Symbol.iterator](), _step9; !(_step9 = _iterator9.next()).done;) {
          var value = _step9.value;
          yield value;
        }
      }
    });
  };

  // TODO: dedupe, could take lots of storage
  // TODO: split into separate tranducers (streams)
  // TODO: every nth item... how useful it this?
  // for stuff like take 2 drop 2 repeat... create a custom function


  // each predicate will produce its own Functified
  // where the predicate is a filter
  // return a Functified so we can chain from split
  Functified.prototype.split = function () {
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
    if (predicates[0] instanceof Map) {
      return functify(functify(predicates[0]).map(function (_ref2) {
        var _ref2 = _slicedToArray(_ref2, 2);

        var key = _ref2[0];
        var fn = _ref2[1];
        return [key, _this.filter(fn)];
      }));
    }
  };

  // TODO: keys(), values(), entries()
  // throw if the underlying iterable doesn't support these

  // fn(iterable) -> generator function
  Functified.prototype.custom = function (fn) {
    var generator = fn(this.iterable);
    return Functified.fromGenerator(generator);
  };

  Functified.prototype.zip = function () {
    // assuming that this iterable will yield iterables
    var iterables = this.iterable;
    return Functified.fromGenerator(function* () {
      // TODO: sanity check?
      // throw if each item isn't an iterable
      var iterators = iterables.map(function (iterable) {
        return iterable[Symbol.iterator]();
      });
      while (true) {
        var vector = [];
        for (var _iterator10 = iterators[Symbol.iterator](), _step10; !(_step10 = _iterator10.next()).done;) {
          var iterator = _step10.value;
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

  Functified.prototype.flatten = function () {
    // assuming that this iterable will yield iterables
    var iterables = this.iterable;
    return Functified.fromGenerator(function* () {
      var iterators = iterables.map(function (iterable) {
        return iterable[Symbol.iterator]();
      });
      while (true) {
        for (var _iterator11 = iterators[Symbol.iterator](), _step11; !(_step11 = _iterator11.next()).done;) {
          var iterator = _step11.value;
          var result = iterator.next();
          if (result.done) {
            return; // finished
          } else {
            yield result.value;
          }
        }
      }
    });
  };

  Functified.zip = function () {
    var iterables = [];

    for (var _key2 = 0; _key2 < arguments.length; _key2++) {
      iterables[_key2] = arguments[_key2];
    }

    return Functified.fromGenerator(function* () {
      var iterators = iterables.map(function (iterable) {
        return iterable[Symbol.iterator]();
      });
      while (true) {
        var vector = [];
        for (var _iterator12 = iterators[Symbol.iterator](), _step12; !(_step12 = _iterator12.next()).done;) {
          var iterator = _step12.value;
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
  Functified.prototype.reduce = function (callback, initialValue) {
    return reduce(this.iterable, callback, initialValue);
  };

  Functified.prototype.every = function (callback) {
    return every(this.iterable, callback);
  };

  Functified.prototype.some = function (callback) {
    return some(this.iterable, callback);
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
