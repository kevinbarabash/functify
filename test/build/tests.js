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

var start = performance.now();

var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log("unfiltered");
for (var _iterator = numbers[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
  var num = _step.value;
  console.log("num = " + num);
}

console.log("reverse iterator");
var revNums = functify(numbers[revIter]);
for (var _iterator2 = revNums.filter(function (n) {
  return n % 2;
})[Symbol.iterator](), _step2; !(_step2 = _iterator2.next()).done;) {
  var num = _step2.value;
  console.log(num);
}

numbers = functify(numbers);

console.log("\n");
for (var _iterator3 = numbers[Symbol.iterator](), _step3; !(_step3 = _iterator3.next()).done;) {
  var num = _step3.value;
  console.log(num);
}

console.log("\n");
for (var _iterator4 = numbers[Symbol.iterator](), _step4; !(_step4 = _iterator4.next()).done;) {
  var num = _step4.value;
  console.log(num);
}

console.log("\n");
for (var _iterator5 = numbers.filter(function (n) {
  return n % 2;
}).skip(2).map(function (n) {
  return n * n;
}).take(2).loop(10)[Symbol.iterator](), _step5; !(_step5 = _iterator5.next()).done;) {
  var num = _step5.value;
  console.log(num);
}

var indices = [1, 2, 3, 5, 8];
var fibIndices = function (iterable) {
  return function* () {
    var i = 0;
    for (var _iterator6 = iterable[Symbol.iterator](), _step6; !(_step6 = _iterator6.next()).done;) {
      var value = _step6.value;
      if (indices.indexOf(i++) !== -1) {
        yield value;
      }
    }
  };
};

console.log("\nFibIndicies");
var td = numbers.custom(fibIndices);
for (var _iterator7 = td[Symbol.iterator](), _step7; !(_step7 = _iterator7.next()).done;) {
  var num = _step7.value;
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
for (var _iterator8 = evens[Symbol.iterator](), _step8; !(_step8 = _iterator8.next()).done;) {
  var num = _step8.value;
  console.log("even: " + num);
}

for (var _iterator9 = odds[Symbol.iterator](), _step9; !(_step9 = _iterator9.next()).done;) {
  var num = _step9.value;
  console.log("odd: " + num);
}

var pairs = Functified.zip(evens, odds);
for (var _iterator10 = pairs[Symbol.iterator](), _step10; !(_step10 = _iterator10.next()).done;) {
  var pair = _step10.value;
  console.log(pair);
}

console.log("pairs using .zip() method");
pairs = numbers.split(oddPred, evenPred).zip();
for (var _iterator11 = pairs[Symbol.iterator](), _step11; !(_step11 = _iterator11.next()).done;) {
  var pair = _step11.value;
  console.log("pair = " + pair);
}

var map = new Map();
map.set("even", evenPred);
map.set("odd", oddPred);
for (var _iterator12 = numbers.split(map)[Symbol.iterator](), _step12; !(_step12 = _iterator12.next()).done;) {
  var _ref = _step12.value;
  var _ref2 = _slicedToArray(_ref, 2);

  var key = _ref2[0];
  var val = _ref2[1];
  console.log("key = " + key);
  // TODO: callbacks need optional index parameters
  var str = val.reduce(function (str, n) {
    return str + ("" + n + ", ");
  }, "");
  console.log("str = " + str);
}

var total = 0;
for (var _iterator13 = numbers[Symbol.iterator](), _step13; !(_step13 = _iterator13.next()).done;) {
  var num = _step13.value;
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

for (var _iterator14 = map[Symbol.iterator](), _step14; !(_step14 = _iterator14.next()).done;) {
  var entry = _step14.value;
  console.log("entry = " + entry);
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


var iter = (function () {
  var _iter = {};

  _iter[Symbol.iterator] = genFunc;
  return _iter;
})();
for (var _iterator15 = iter[Symbol.iterator](), _step15; !(_step15 = _iterator15.next()).done;) {
  var val = _step15.value;
  console.log(val);
}




var squares = numbers.map(function (x) {
  return x * x;
});

for (var _iterator16 = squares.skip(5)[Symbol.iterator](), _step16; !(_step16 = _iterator16.next()).done;) {
  var x = _step16.value;
  console.log(x);
}

for (var _iterator17 = squares.take(5)[Symbol.iterator](), _step17; !(_step17 = _iterator17.next()).done;) {
  var x = _step17.value;
  console.log(x);
}

console.log("numbers = " + numbers);

var list_of_lists = functify([functify([1, 2]), functify([3, 4]), functify([5, 6])]);
console.log("list_of_lists = " + list_of_lists);

var flat_list = list_of_lists.flatten();
console.log("flat_list = " + flat_list);

console.log("range(10) = " + range(10));
console.log("range(0,10,4) = " + range(0, 10, 4));
console.log("range(0,-5,-1) = " + range(0, -5, -1));
