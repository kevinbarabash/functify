"use strict";


// TODO: think about a reverse iterator for array-like and map-like objects
// a getter that returns an iterable

// create a separate project for this mixin
// then users can choose what to mix it in with
var revIter = Symbol("revIter");
Object.defineProperty(Array.prototype, revIter, {
    get: function () {
        var _this = this;
        return {
            [Symbol.iterator]: function* () {
                var i = _this.length - 1;
                while (i > -1) {
                    yield _this[i--];
                }
            }
        }
    }
});


function reduce(iterable, callback, initialValue) {
    var result = initialValue;
    for (let value of iterable) {
        result = callback(result, value)
    }
    return result;
}

function every(iterable, callback) {
    for (let value of iterable) {
        if (!callback(value)) {
            return false;
        }
    }
    return true;
}

function some(iterable, callback) {
    for (let value of iterable) {
        if (callback(value)) {
            return true;
        }
    }
    return false;
}


// TODO: have static version of each method so they can be passed to things like "map" and then applied to an iterable
// this is really only useful when you start having iterables of iterables
class Functified {
    
    constructor(iterable) {
        this.iterable = iterable;
        this.isFunctified = true;
    }
    
    static fromGenerator(generator) {
        return functify({
            [Symbol.iterator]: generator
        });
    }

    *[Symbol.iterator]() {
        for (let value of this.iterable) {
            yield value;
        }
    }
    
    filter(callback) {
        var iterable = this.iterable;
        return Functified.fromGenerator(function* () {
            for (let value of iterable) {
                if (callback(value)) {
                    yield value;
                }
            }
        });
    }

    map(callback) {
        var iterable = this.iterable;
        return Functified.fromGenerator(function* () {
            for (let value of iterable) {
                yield callback(value);
            }
        });
    }

    // TODO: create a pausable iterator or something that will produce one
    // could be used to do work that needs to be repeatedly paused to keep the UI
    // from freezing up, e.g. raytracer
    take(n) {
        var iterable = this.iterable;
        return Functified.fromGenerator(function* () {
            let i = 0;
            for (let value of iterable) {
                if (i++ < n) {
                    yield value;
                } else {
                    break;
                }
            }
        });
    }

    skip(n) {
        var iterable = this.iterable;
        return Functified.fromGenerator(function* () {
            var i = 0;
            for (let value of iterable) {
                if (i < n) {
                    i++;
                } else {
                    yield value;
                }
            }
        });
    }

    // TODO: how can you tell if an iterator will complete or not
    // is it be call synchronously?
    // does it loop?
    // will the loop ever terminate?
    // halting problem?

    // be careful with this one
    loop(n = Infinity) {
        var iterable = this.iterable;
        return Functified.fromGenerator(function* () {
            var i = 0;
            while (i++ < n) {
                for (let value of iterable) {
                    yield value;
                }
            }
        });
    }
    
    // TODO: dedupe, could take lots of storage
    // TODO: every nth item... how useful it this?
    // for stuff like take 2 drop 2 repeat... create a custom function
    
    
    // each predicate will produce its own Functified
    // where the predicate is a filter
    // return a Functified so we can chain from split
    split(...predicates) {
        if (predicates.length > 1) {
            return functify(predicates.map(fn => this.filter(fn)));
        }
        if (predicates[0] instanceof Map) {
            return functify(functify(predicates[0]).map(([key,fn]) => {
                return [key,this.filter(fn)];
            }));
        }
    }

    // TODO: keys(), values(), entries()
    // throw if the underlying iterable doesn't support these

    // fn(iterable) -> generator function
    custom(fn) {
        var generator = fn(this.iterable);
        return Functified.fromGenerator(generator);
    }
    
    zip() {
        // assuming that this iterable will yield iterables
        var iterables = this.iterable;
        return Functified.fromGenerator(function *() {
            // TODO: sanity check?
            // throw if each item isn't an iterable
            var iterators = iterables.map(iterable => iterable[Symbol.iterator]());
            while (true) {
                let vector = [];
                for (let iterator of iterators) {
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
    
    flatten() {
        // assuming that this iterable will yield iterables
        var iterables = this.iterable;
        return Functified.fromGenerator(function* () {
            // TODO: make this more robust
            // it should handle stuff like [1, [2, 3], [4, [5, 6, 7], [], 8, [], 9]
            var iterators = iterables.map(iterable => iterable[Symbol.iterator]());
            while (true) {
                for (let iterator of iterators) {
                    var result = iterator.next();
                    if (result.done) {
                        return; // finished
                    } else {
                        yield result.value;
                    }
                }
            }
        });
    }
    
    static zip(...iterables) {
        return Functified.fromGenerator(function* () {
            var iterators = iterables.map(iterable => iterable[Symbol.iterator]());
            while (true) {
                let vector = [];
                for (let iterator of iterators) {
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
    
    // reducing functions
    reduce(callback, initialValue) {
        // TODO: if initialValue undefined, use the first value as the initialValue
        return reduce(this.iterable, callback, initialValue);
    }

    every(callback) {
        return every(this.iterable, callback);
    }
    
    some(callback) {
        return some(this.iterable, callback);
    }

    toString() {
        var i = 0;
        var result = "[";
        result += this.reduce((str, n) => str + (i++ > 0 ? `, ${n}` : `${n}`), "");
        result += "]";
        return result;
    }
}

var functify = function(iterable) {
    return new Functified(iterable);
};

var range = function(start, stop, step = 1) {
    if (arguments.length === 1) {
        stop = start;
        start = 0;
    }
    return Functified.fromGenerator(function* () {
        let i = start;
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
            throw "step should not equal 0"
        }
    });
};

export {
    functify,
    Functified,
    range
}
