[![Build Status](https://travis-ci.org/kevinb7/functify.svg)](https://travis-ci.org/kevinb7/functify)

# functify

Add functional methods like map, reduce, filter, etc. iterables (ES6 Iterators).

## Why

Only Array has handy functions like map, reduce, filter, etc.  Other iterable
objects such as Map, Set, String, NodeList, and your own iterables don't.  It
would be nice if all iterables had access these functions.

Unfortunately, the Array versions of map and filter return a new array.  This
results in wasted memory allocation when chaining map and filter.  Iterators fix
this.  Avalue is only computed when the final iterator in chain is asked for the
next value.  The intermediate values are passed through the chain but aren't 
permenantly stored anywhere.

This sounds an awful like transducers.  It is, the main difference is that 
methods can be called in-line as opposed composing function _a priori_.

## Requires

This approach uses ES6 and specifically generators which aren't supported by 
many browsers yet.  For full browser support please use [babel](http://babeljs.io/)
to transpile your project from ES6 to ES5 when using this library.

## Usage

    let f = require('functify');

    let numbers = f([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    
    console.log("odds:");
    for ( let odd in numbers.filter(n => n % 2) ) {
        console.log(n);
    }
    
    console.log("evens:");
    for ( let even in numbers.filter(n => !(n % 2)) ) {
        console.log(n);
    }
    
    console.log("pairs:");
    for ( let [odd, even] in numbers.split(n => n % 2, n => !(n % 2)).zip() ) {
        console.log(`odd = ${odd}, even = ${even}`);
    }
    
    console.log("first 3 squares:");
    for ( let square in numbers.take(3).map(n => n * n) ) {
        console.log(square);
    }

## Details

functify wraps iterables in an object with methods to performan map, reduce, 
filter, etc.  This object is also iterable.  Here's how:

    class Functified {
        constructor(iterable) {
            this.iterable = iterable;
        }

        *[Symbol.iterator]() {
            for (let value of this.iterable) {
                yield value;
            }
        }

        // various instance and static methods

In order to make it easier to write methods on Functified there's also a static
method `fromGenerator(generator)` which takes a generator and returns an iterator.

    static fromGenerator(generator) {
        return funcitify({
            [Symbol.iterator]: generator
        });
    }
    
This allows methods to be easily implemented.  Here's the implementation for `map`:

    map(callback) {
        var iterable = this.iterable;
        return Functified.fromGenerator(function* () {
            for (let value of iterable) {
                yield callback(value);
            }
        });
    }

## Pausable

Sometimes you may want to take some of the values from the iterator, do something
with those values, and then resume taking values where you left of at some point
in the future.  Normally you would have to resort to creating an iterator and 
calling `next()` manually, e.g.

    var numbers = [1,2,3,4,5];
    var iterator = numbers[Symbol.iterator]();
    
    for (let i = 0; i < 2; i++) {
        console.log(iterator.next().value);
    }
    
    // do something else
    
    while (true) {
        let result = iterator.next();
        if (result.done) {
            break;
        }
        let value = iterator.next().value;
        let square = value * value;
        console.log(value * value);
    }
    
The `toPausable()` creates an iterator Below is an example of how this works.

    var numbers = [1,2,3,4,5];
    var pausableNumbers = numbers.toPausable();
    
    for (let n of pausableNumbers.take(2)) {
        console.log(n);     // 1 2
    }
    
    // do something else
    
    for (let n of pausableNumbers.map(x => x * x).takeUntil(x => x > 16)) {
        console.log(n);     // 9 16
    }
