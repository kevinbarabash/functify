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

var start = performance.now();

var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log("unfiltered");
for (var _iterator = numbers[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
  var num = _step.value;
  console.log("num = " + num);
}

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
  for (var _iterator2 = iterable[Symbol.iterator](), _step2; !(_step2 = _iterator2.next()).done;) {
    var value = _step2.value;
    result = callback(result, value);
  }

  return result;
}

function every(iterable, callback) {
  for (var _iterator3 = iterable[Symbol.iterator](), _step3; !(_step3 = _iterator3.next()).done;) {
    var value = _step3.value;
    if (!callback(value)) {
      return false;
    }
  }

  return true;
}

function some(iterable, callback) {
  for (var _iterator4 = iterable[Symbol.iterator](), _step4; !(_step4 = _iterator4.next()).done;) {
    var value = _step4.value;
    if (callback(value)) {
      return true;
    }
  }

  return false;
}

// proposed syntax
// funcit(iterable).filter(pred).take(5)
// funcit.zip(evens, odds)

var Functified = (function () {
  function Functified(iterable) {
    this.iterable = iterable;
  }

  Functified.fromGenerator = function (generator) {
    return funcitify((function () {
      var _funcitify = {};

      _funcitify[Symbol.iterator] = generator;
      return _funcitify;
    })());
  };

  Functified.prototype[Symbol.iterator] = function* () {
    for (var _iterator5 = this.iterable[Symbol.iterator](), _step5; !(_step5 = _iterator5.next()).done;) {
      var value = _step5.value;
      yield value;
    }
  };

  Functified.prototype.filter = function (callback) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      for (var _iterator6 = iterable[Symbol.iterator](), _step6; !(_step6 = _iterator6.next()).done;) {
        var value = _step6.value;
        if (callback(value)) {
          yield value;
        }
      }
    });
  };

  Functified.prototype.map = function (callback) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      for (var _iterator7 = iterable[Symbol.iterator](), _step7; !(_step7 = _iterator7.next()).done;) {
        var value = _step7.value;
        yield callback(value);
      }
    });
  };

  Functified.prototype.take = function (n) {
    var iterable = this.iterable;
    return Functified.fromGenerator(function* () {
      var i = 0;
      for (var _iterator8 = iterable[Symbol.iterator](), _step8; !(_step8 = _iterator8.next()).done;) {
        var value = _step8.value;
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
      for (var _iterator9 = iterable[Symbol.iterator](), _step9; !(_step9 = _iterator9.next()).done;) {
        var value = _step9.value;
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
        for (var _iterator10 = iterable[Symbol.iterator](), _step10; !(_step10 = _iterator10.next()).done;) {
          var value = _step10.value;
          yield value;
        }
      }
    });
  };

  // TODO: dedupe, could take lots of storage
  // TODO: split into separate tranducers (streams)
  // TODO: every nth item... how useful it this?
  // for stuff like take 2 drop 2 repeat... create a custom function

  // TODO: toString()

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
      return funcitify(predicates.map(function (fn) {
        return _this.filter(fn);
      }));
    }
    if (predicates[0] instanceof Map) {
      return funcitify(funcitify(predicates[0]).map(function (_ref2) {
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
        for (var _iterator11 = iterators[Symbol.iterator](), _step11; !(_step11 = _iterator11.next()).done;) {
          var iterator = _step11.value;
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

  // assuming that this iterable will yield iterables
  Functified.prototype.flatten = function () {};

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

  _prototypeProperties(Functified, {}, {});

  return Functified;
})();

var funcitify = function (iterable) {
  return new Functified(iterable);
};


console.log("reverse iterator");
var revNums = funcitify(numbers[revIter]);
for (var _iterator13 = revNums.filter(function (n) {
  return n % 2;
})[Symbol.iterator](), _step13; !(_step13 = _iterator13.next()).done;) {
  var num = _step13.value;
  console.log(num);
}





numbers = funcitify(numbers);

console.log("\n");
for (var _iterator14 = numbers[Symbol.iterator](), _step14; !(_step14 = _iterator14.next()).done;) {
  var num = _step14.value;
  console.log(num);
}

console.log("\n");
for (var _iterator15 = numbers[Symbol.iterator](), _step15; !(_step15 = _iterator15.next()).done;) {
  var num = _step15.value;
  console.log(num);
}

console.log("\n");
for (var _iterator16 = numbers.filter(function (n) {
  return n % 2;
}).skip(2).map(function (n) {
  return n * n;
}).take(2).loop(10)[Symbol.iterator](), _step16; !(_step16 = _iterator16.next()).done;) {
  var num = _step16.value;
  console.log(num);
}

var indices = [1, 2, 3, 5, 8];
var fibIndices = function (iterable) {
  return function* () {
    var i = 0;
    for (var _iterator17 = iterable[Symbol.iterator](), _step17; !(_step17 = _iterator17.next()).done;) {
      var value = _step17.value;
      if (indices.indexOf(i++) !== -1) {
        yield value;
      }
    }
  };
};

console.log("\nFibIndicies");
var td = numbers.custom(fibIndices);
for (var _iterator18 = td[Symbol.iterator](), _step18; !(_step18 = _iterator18.next()).done;) {
  var num = _step18.value;
  console.log(num);
}

var evenPred = function (x) {
  return x % 2 === 0;
};
var oddPred = function (x) {
  return x % 2;
};

var _numbers$split = numbers.split(evenPred, oddPred);

var _numbers$split2 = _slicedToArray(_numbers$split, 2);

var evens = _numbers$split2[0];
var odds = _numbers$split2[1];


console.log("evens");
for (var _iterator19 = evens[Symbol.iterator](), _step19; !(_step19 = _iterator19.next()).done;) {
  var num = _step19.value;
  console.log("even: " + num);
}

for (var _iterator20 = odds[Symbol.iterator](), _step20; !(_step20 = _iterator20.next()).done;) {
  var num = _step20.value;
  console.log("odd: " + num);
}

var pairs = Functified.zip(evens, odds);
for (var _iterator21 = pairs[Symbol.iterator](), _step21; !(_step21 = _iterator21.next()).done;) {
  var pair = _step21.value;
  console.log(pair);
}

console.log("pairs using .zip() method");
pairs = numbers.split(oddPred, evenPred).zip();
for (var _iterator22 = pairs[Symbol.iterator](), _step22; !(_step22 = _iterator22.next()).done;) {
  var pair = _step22.value;
  console.log("pair = " + pair);
}

var map = new Map();
map.set("even", evenPred);
map.set("odd", oddPred);
for (var _iterator23 = numbers.split(map)[Symbol.iterator](), _step23; !(_step23 = _iterator23.next()).done;) {
  var _ref3 = _step23.value;
  var _ref3 = _slicedToArray(_ref3, 2);

  var key = _ref3[0];
  var val = _ref3[1];
  console.log("key = " + key);
  // TODO: callbacks need optional index parameters
  var str = val.reduce(function (str, n) {
    return str + ("" + n + ", ");
  }, "");
  console.log("str = " + str);
}

var total = 0;
for (var _iterator24 = numbers[Symbol.iterator](), _step24; !(_step24 = _iterator24.next()).done;) {
  var num = _step24.value;
  total += num;
}

console.log("total = " + total);

total = reduce(numbers, function (accum, value) {
  return accum + value;
}, 0);
console.log("total (reduce version) = " + total);

total = numbers.reduce(function (accum, value) {
  return accum + value;
}, 0);
console.log("total (Functified reduce version) = " + total);

var elapsed = performance.now() - start;
console.log("elapsed time = " + elapsed);

map = new Map();
map.set("x", 5);
map.set("y", 10);

for (var _iterator25 = map[Symbol.iterator](), _step25; !(_step25 = _iterator25.next()).done;) {
  var entry = _step25.value;
  console.log("entry = " + entry);
}

console.log(map.length);
