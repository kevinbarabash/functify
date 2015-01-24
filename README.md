# functify

Add functional methods like map, reduce, filter, etc. iterables (ES6 Iterators).

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

