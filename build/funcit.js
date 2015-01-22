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

var _defineProperty = function (obj, key, value) {
  return Object.defineProperty(obj, key, {
    value: value,
    enumerable: true,
    configurable: true,
    writable: true
  });
};

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

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

      _ref[Symbol.iterator] = regeneratorRuntime.mark(function callee$2$0() {
        var i;
        return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              i = _this.length - 1;
            case 1:
              if (!(i > -1)) {
                context$3$0.next = 6;
                break;
              }
              context$3$0.next = 4;
              return _this[i--];
            case 4:
              context$3$0.next = 1;
              break;
            case 6:
            case "end":
              return context$3$0.stop();
          }
        }, callee$2$0, this);
      });
      return _ref;
    })();
  }
});


// proposed syntax
// funcit(iterable).filter(pred).take(5)
// funcit.zip(evens, odds)

var Transducer = (function () {
  function Transducer(iterable) {
    this.iterable = iterable;
  }

  _prototypeProperties(Transducer, {
    fromGenerator: {
      value: function (generator) {
        return new Transducer((function () {
          var _ref2 = {};

          _ref2[Symbol.iterator] = generator;
          return _ref2;
        })());
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    zip: {
      value: function () {
        var iterables = [];

        for (var _key = 0; _key < arguments.length; _key++) {
          iterables[_key] = arguments[_key];
        }

        return Transducer.fromGenerator(regeneratorRuntime.mark(function callee$2$0() {
          var iterators, vector, _iterator2, _step2, iterator, result;
          return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
            while (1) switch (context$3$0.prev = context$3$0.next) {
              case 0:
                iterators = iterables.map(function (iterable) {
                  return iterable[Symbol.iterator]();
                });
              case 1:
                if (!true) {
                  context$3$0.next = 18;
                  break;
                }
                vector = [];
                _iterator2 = iterators[Symbol.iterator]();
              case 4:
                if ((_step2 = _iterator2.next()).done) {
                  context$3$0.next = 14;
                  break;
                }
                iterator = _step2.value;
                result = iterator.next();
                if (!result.done) {
                  context$3$0.next = 11;
                  break;
                }
                return context$3$0.abrupt("return");
              case 11:
                vector.push(result.value);
              case 12:
                context$3$0.next = 4;
                break;
              case 14:
                context$3$0.next = 16;
                return vector;
              case 16:
                context$3$0.next = 1;
                break;
              case 18:
              case "end":
                return context$3$0.stop();
            }
          }, callee$2$0, this);
        }));
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  }, (function () {
    var _prototypeProperties2 = {};

    _prototypeProperties2[Symbol.iterator] = {
      value: regeneratorRuntime.mark(function callee$2$0() {
        var _iterator3, _step3, value;
        return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              _iterator3 = this.iterable[Symbol.iterator]();
            case 1:
              if ((_step3 = _iterator3.next()).done) {
                context$3$0.next = 7;
                break;
              }
              value = _step3.value;
              context$3$0.next = 5;
              return value;
            case 5:
              context$3$0.next = 1;
              break;
            case 7:
            case "end":
              return context$3$0.stop();
          }
        }, callee$2$0, this);
      }),
      writable: true,
      enumerable: true,
      configurable: true
    };
    _defineProperty(_prototypeProperties2, "filter", {
      value: function (callback) {
        var iterable = this.iterable;
        return Transducer.fromGenerator(regeneratorRuntime.mark(function callee$3$0() {
          var _iterator4, _step4, value;
          return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                _iterator4 = iterable[Symbol.iterator]();
              case 1:
                if ((_step4 = _iterator4.next()).done) {
                  context$4$0.next = 8;
                  break;
                }
                value = _step4.value;
                if (!callback(value)) {
                  context$4$0.next = 6;
                  break;
                }
                context$4$0.next = 6;
                return value;
              case 6:
                context$4$0.next = 1;
                break;
              case 8:
              case "end":
                return context$4$0.stop();
            }
          }, callee$3$0, this);
        }));
      },
      writable: true,
      enumerable: true,
      configurable: true
    });

    _defineProperty(_prototypeProperties2, "map", {
      value: function (callback) {
        var iterable = this.iterable;
        return Transducer.fromGenerator(regeneratorRuntime.mark(function callee$3$0() {
          var _iterator5, _step5, value;
          return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                _iterator5 = iterable[Symbol.iterator]();
              case 1:
                if ((_step5 = _iterator5.next()).done) {
                  context$4$0.next = 7;
                  break;
                }
                value = _step5.value;
                context$4$0.next = 5;
                return callback(value);
              case 5:
                context$4$0.next = 1;
                break;
              case 7:
              case "end":
                return context$4$0.stop();
            }
          }, callee$3$0, this);
        }));
      },
      writable: true,
      enumerable: true,
      configurable: true
    });

    _defineProperty(_prototypeProperties2, "take", {
      value: function (n) {
        var iterable = this.iterable;
        return Transducer.fromGenerator(regeneratorRuntime.mark(function callee$3$0() {
          var i, _iterator6, _step6, value;
          return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                i = 0;
                _iterator6 = iterable[Symbol.iterator]();
              case 2:
                if ((_step6 = _iterator6.next()).done) {
                  context$4$0.next = 12;
                  break;
                }
                value = _step6.value;
                if (!(i++ < n)) {
                  context$4$0.next = 9;
                  break;
                }
                context$4$0.next = 7;
                return value;
              case 7:
                context$4$0.next = 10;
                break;
              case 9:
                return context$4$0.abrupt("break", 12);
              case 10:
                context$4$0.next = 2;
                break;
              case 12:
              case "end":
                return context$4$0.stop();
            }
          }, callee$3$0, this);
        }));
      },
      writable: true,
      enumerable: true,
      configurable: true
    });

    _defineProperty(_prototypeProperties2, "skip", {
      value: function (n) {
        var iterable = this.iterable;
        return Transducer.fromGenerator(regeneratorRuntime.mark(function callee$3$0() {
          var i, _iterator7, _step7, value;
          return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                i = 0;
                _iterator7 = iterable[Symbol.iterator]();
              case 2:
                if ((_step7 = _iterator7.next()).done) {
                  context$4$0.next = 12;
                  break;
                }
                value = _step7.value;
                if (!(i < n)) {
                  context$4$0.next = 8;
                  break;
                }
                i++;
                context$4$0.next = 10;
                break;
              case 8:
                context$4$0.next = 10;
                return value;
              case 10:
                context$4$0.next = 2;
                break;
              case 12:
              case "end":
                return context$4$0.stop();
            }
          }, callee$3$0, this);
        }));
      },
      writable: true,
      enumerable: true,
      configurable: true
    });

    _defineProperty(_prototypeProperties2, "loop", {


      // be careful with this one
      value: function () {
        var n = arguments[0] === undefined ? Infinity : arguments[0];
        var iterable = this.iterable;
        return Transducer.fromGenerator(regeneratorRuntime.mark(function callee$3$0() {
          var i, _iterator8, _step8, value;
          return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
            while (1) switch (context$4$0.prev = context$4$0.next) {
              case 0:
                i = 0;
              case 1:
                if (!(i++ < n)) {
                  context$4$0.next = 11;
                  break;
                }
                _iterator8 = iterable[Symbol.iterator]();
              case 3:
                if ((_step8 = _iterator8.next()).done) {
                  context$4$0.next = 9;
                  break;
                }
                value = _step8.value;
                context$4$0.next = 7;
                return value;
              case 7:
                context$4$0.next = 3;
                break;
              case 9:
                context$4$0.next = 1;
                break;
              case 11:
              case "end":
                return context$4$0.stop();
            }
          }, callee$3$0, this);
        }));
      },
      writable: true,
      enumerable: true,
      configurable: true
    });

    _defineProperty(_prototypeProperties2, "split", {

      // TODO: dedupe, could take lots of storage
      // TODO: split into separate tranducers (streams)

      // each predicate will produce its own transducer
      // where the predicate is a filter
      value: function () {
        var _this = this;
        var predicates = [];

        for (var _key2 = 0; _key2 < arguments.length; _key2++) {
          predicates[_key2] = arguments[_key2];
        }

        return predicates.map(function (fn) {
          return _this.filter(fn);
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    });

    _defineProperty(_prototypeProperties2, "custom", {

      // fn(iterable) -> generator function
      value: function (fn) {
        var generator = fn(this.iterable);
        return Transducer.fromGenerator(generator);
      },
      writable: true,
      enumerable: true,
      configurable: true
    });

    return _prototypeProperties2;
  })());

  return Transducer;
})();




console.log("reverse iterator");
var revNums = new Transducer(numbers[revIter]);
for (var _iterator9 = revNums.filter(function (n) {
  return n % 2;
})[Symbol.iterator](), _step9; !(_step9 = _iterator9.next()).done;) {
  var num = _step9.value;
  console.log(num);
}





numbers = new Transducer(numbers);

console.log("\n");
for (var _iterator10 = numbers[Symbol.iterator](), _step10; !(_step10 = _iterator10.next()).done;) {
  var num = _step10.value;
  console.log(num);
}

console.log("\n");
for (var _iterator11 = numbers[Symbol.iterator](), _step11; !(_step11 = _iterator11.next()).done;) {
  var num = _step11.value;
  console.log(num);
}

console.log("\n");
for (var _iterator12 = numbers.filter(function (n) {
  return n % 2;
}).skip(2).map(function (n) {
  return n * n;
}).take(2).loop(10)[Symbol.iterator](), _step12; !(_step12 = _iterator12.next()).done;) {
  var num = _step12.value;
  console.log(num);
}

var indices = [1, 2, 3, 5, 8];
var fibIndices = function (iterable) {
  return regeneratorRuntime.mark(function callee$1$0() {
    var i, _iterator13, _step13, value;
    return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          i = 0;
          _iterator13 = iterable[Symbol.iterator]();
        case 2:
          if ((_step13 = _iterator13.next()).done) {
            context$2$0.next = 9;
            break;
          }
          value = _step13.value;
          if (!(indices.indexOf(i++) !== -1)) {
            context$2$0.next = 7;
            break;
          }
          context$2$0.next = 7;
          return value;
        case 7:
          context$2$0.next = 2;
          break;
        case 9:
        case "end":
          return context$2$0.stop();
      }
    }, callee$1$0, this);
  });
};

console.log("\nFibIndicies");
var td = numbers.custom(fibIndices);
for (var _iterator14 = td[Symbol.iterator](), _step14; !(_step14 = _iterator14.next()).done;) {
  var num = _step14.value;
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
for (var _iterator15 = evens[Symbol.iterator](), _step15; !(_step15 = _iterator15.next()).done;) {
  var num = _step15.value;
  console.log("even: " + num);
}

for (var _iterator16 = odds[Symbol.iterator](), _step16; !(_step16 = _iterator16.next()).done;) {
  var num = _step16.value;
  console.log("odd: " + num);
}

var pairs = Transducer.zip(evens, odds);
for (var _iterator17 = pairs[Symbol.iterator](), _step17; !(_step17 = _iterator17.next()).done;) {
  var pair = _step17.value;
  console.log(pair);
}

// finished