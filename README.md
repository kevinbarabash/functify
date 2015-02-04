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

## Caveats

This approach uses ES6 and specifically generators which aren't supported by 
many browsers yet.  The code is compiled down to ES5 using 6to5, but requires a
polyfill (25 KB) which includes the regenerator runtime.

The regenerator runtime can be removed if the code was written with plain old
Iterators, but then the source wouldn't be as concise.  I plan to fix this 
situation by creating a transform which converts the existing source to a 
generator free version.

## Usage

    let numbers = functify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    
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
