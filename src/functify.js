"use strict";

class Functified {
    
    constructor(iterable) {
        this.iterable = iterable;
        this.isFunctified = true;
    }

    *[Symbol.iterator]() {
        for (let value of this.iterable) {
            yield value;
        }
    }

    // fn(iterable) -> generator function
    custom(fn) {
        var generator = fn(this.iterable);
        return Functified.fromGenerator(generator);
    }

    // TODO: make this more like rxjs' distinct
    // https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/distinct.md
    dedupe() {
        var iterable = this.iterable;
        var memory = new Set();
        return Functified.fromGenerator(function* () {
            for (let value of iterable) {
                if (!memory.has(value)) {
                    memory.add(value);
                    yield value;
                }
            }
        });
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
    
    flatten() {
        var iterable = this.iterable;
        return Functified.fromGenerator(function* () {
            for (let value of iterable) {
                if (value[Symbol.iterator]) {
                    yield* functify(value).flatten();
                } else {
                    yield value;
                }
            }
        });
    }

    groupBy(...predicates) {
        if (predicates.length > 1) {
            return functify(predicates.map(fn => this.filter(fn)));
        }
    }

    groupByMap(map) {
        return functify(
            functify(map).map(([name, fn]) => [name, this.filter(fn)])
        );
    }

    // be careful with this one
    // could combine this with with take
    // consider using 2 as the default number of loops
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

    map(callback) {
        var iterable = this.iterable;
        return Functified.fromGenerator(function* () {
            for (let value of iterable) {
                yield callback(value);
            }
        });
    }
    
    // TODO: skipWhile
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
    
    // TODO: takeUntil
    take(n) {
        // using an explicit iterator supports pausable iteratables
        var iterator = this.iterable[Symbol.iterator]();
        var self = this;
        return Functified.fromGenerator(function* () {
            // TODO: investigate calling .take then .takeUntil (and vice versa)
            if (self.hasOwnProperty("startValue") && self.isPausable) {
                yield self.startValue;
            }
            let i = 0;
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
    
    takeUntil(predicate) {
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
    
    zip() {
        return Functified.zip(this.iterable);
    }
    
    // static methods
    static fromGenerator(generator) {
        return functify({
            [Symbol.iterator]: generator
        });
    }

    static entries(obj) {
        return functify(Object.keys(obj)).map(key => [key, obj[key]]);
    }

    static zip(iterables) {
        return Functified.fromGenerator(function* () {
            var iterators = iterables.map(iterable => {
                if (iterable[Symbol.iterator]) {
                    return iterable[Symbol.iterator]();
                } else {
                    throw "can't zip a non-iterable";
                }
            });
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
    every(callback) {
        for (let value of this.iterable) {
            if (!callback(value)) {
                return false;
            }
        }
        return true;
    }

    reduce(callback, initialValue) {
        let accum = initialValue;
        let iterator = this.iterable[Symbol.iterator]();
        
        if (accum === undefined) {
            let result = iterator.next();
            if (result.done) {
                throw "not enough values to reduce";
            } else {
                accum = result.value;
            }
        }
        
        while (true) {
            let result = iterator.next();
            if (result.done) {
                break;
            } else {
                accum = callback(accum, result.value);
            }
        }
        
        return accum;
    }

    some(callback) {
        for (let value of this.iterable) {
            if (callback(value)) {
                return true;
            }
        }
        return false;
    }
    
    toArray() {
        var result = [];
        for (let value of this.iterable) {
            result.push(value);
        }
        return result;
    }

    toPausable() {
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
