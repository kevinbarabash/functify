var numbers = [1,2,3,4,5,6,7,8,9,10];

console.log("unfiltered");
for (let num of numbers) {
    console.log(`num = ${num}`);
}

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


// proposed syntax
// funcit(iterable).filter(pred).take(5)
// funcit.zip(evens, odds)

class Transducer {
    
    constructor(iterable) {
        this.iterable = iterable;
    }
    
    static fromGenerator(generator) {
        return new Transducer({
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
        return Transducer.fromGenerator(function* () {
            for (let value of iterable) {
                if (callback(value)) {
                    yield value;
                }
            }
        });
    }

    map(callback) {
        var iterable = this.iterable;
        return Transducer.fromGenerator(function* () {
            for (let value of iterable) {
                yield callback(value);
            }
        });
    }

    take(n) {
        var iterable = this.iterable;
        return Transducer.fromGenerator(function* () {
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
        return Transducer.fromGenerator(function* () {
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
        return Transducer.fromGenerator(function* () {
            var i = 0;
            while (i++ < n) {
                for (let value of iterable) {
                    yield value;
                }
            }
        });
    }
    
    // TODO: dedupe, could take lots of storage
    // TODO: split into separate tranducers (streams)
    // TODO: every nth item... how useful it this?
    // for stuff like take 2 drop 2 repeat... create a custom function
    
    // each predicate will produce its own transducer
    // where the predicate is a filter
    split(...predicates) {
        return predicates.map(fn => this.filter(fn));
    }

    // fn(iterable) -> generator function
    custom(fn) {
        var generator = fn(this.iterable);
        return Transducer.fromGenerator(generator);
    }
    
    static zip(...iterables) {
        return Transducer.fromGenerator(function* () {
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
}


console.log("reverse iterator");
var revNums = new Transducer(numbers[revIter]);
for (let num of revNums.filter(n => n % 2)) {
    console.log(num);
}



numbers = new Transducer(numbers);

console.log("\n");
for (let num of numbers) {
    console.log(num);
}

console.log("\n");
for (let num of numbers) {
    console.log(num);
}

console.log("\n");
for (let num of numbers.filter(n => n % 2).skip(2).map(n => n * n).take(2).loop(10)) {
    console.log(num);
}

var indices = [1, 2, 3, 5, 8];
var fibIndices = function(iterable) {
    return function* () {
        var i = 0;
        for (let value of iterable) {
            if (indices.indexOf(i++) !== -1) {
                yield value;
            }
        }
    };  
};

console.log("\nFibIndicies");
var td = numbers.custom(fibIndices);
for (let num of td) {
    console.log(num);
}

var evenPred = x => x % 2 === 0;
var oddPred = x => x % 2;

var [evens, odds] = numbers.split(evenPred, oddPred);

console.log("evens");
for (let num of evens) {
    console.log(`even: ${num}`);
}
for (let num of odds) {
    console.log(`odd: ${num}`);
}

var pairs = Transducer.zip(evens, odds);
for (let pair of pairs) {
    console.log(pair);
}
