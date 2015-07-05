(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.functify = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}]},{},[1])(1)
});