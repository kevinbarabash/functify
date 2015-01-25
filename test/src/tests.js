"use strict";

var start = performance.now();

var numbers = [1,2,3,4,5,6,7,8,9,10];

console.log("unfiltered");
for (let num of numbers) {
    console.log(`num = ${num}`);
}

console.log("reverse iterator");
var revNums = functify(numbers[revIter]);
for (let num of revNums.filter(n => n % 2)) {
    console.log(num);
}

numbers = functify(numbers);

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

var pairs = Functified.zip(evens, odds);
for (let pair of pairs) {
    console.log(pair);
}

console.log("pairs using .zip() method");
pairs = numbers.split(oddPred, evenPred).zip();
for (let pair of pairs) {
    console.log(`pair = ${pair}`);
}

var map = new Map();
map.set("even", evenPred);
map.set("odd", oddPred);
for (let [key,val] of numbers.split(map)) {
    console.log(`key = ${key}`);
    // TODO: callbacks need optional index parameters
    var str = val.reduce((str, n) => str + `${n}, `, "");
    console.log(`str = ${str}`);
}

var total = 0;
for (let num of numbers) {
    total += num;
}

console.log(`total = ${total}`);

total = reduce(numbers, (accum, value) => accum + value, 0);
console.log(`total (reduce version) = ${total}`);

total = numbers.reduce((accum, value) => accum + value, 0);
console.log(`total (Functified reduce version) = ${total}`);

var elapsed = performance.now() - start;
console.log(`elapsed time = ${elapsed}`);

map = new Map();
map.set("x", 5);
map.set("y", 10);

for (let entry of map) {
    console.log(`entry = ${entry}`);
}

console.log(map.length);

var iterator = numbers[Symbol.iterator]();
var i, result;
for (i = 0; i < 3; i++) {
    result = iterator.next();
    console.log(result.value);
}
console.log("pause");
for (i = 0; i < 3; i++) {
    result = iterator.next();
    console.log(result.value);
}

var nextGenFunc = function* () {
    yield 3;
    yield 4;
};

var genFunc = function* () {
    yield 1;
    yield 2;
    yield* nextGenFunc();
};

//var gen = genFunc();
//result = gen.next();
//while (!result.done) {
//    console.log(result.value);
//    result = gen.next();
//} 


var iter = {
    [Symbol.iterator]: genFunc
};
for (let val of iter) {
    console.log(val);
}


var squares = numbers.map(x => x * x);

for (let x of squares.skip(5)) {
    console.log(x);
}

for (let x of squares.take(5)) {
    console.log(x);
}

console.log(`numbers = ${numbers}`);

var list_of_lists = functify([functify([1,2]), functify([3,4]), functify([5,6])]);
console.log(`list_of_lists = ${list_of_lists}`);

var flat_list = list_of_lists.flatten();
console.log(`flat_list = ${flat_list}`);
