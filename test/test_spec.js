import assert from "assert"
import { functify } from "../src/functify"

describe("functify", () => {
    var numbers, result;
    
    beforeEach(() => {
        numbers = functify([1,2,3,4,5]);
        result = [];
    });
    
    it("should return an iterable", () => {
        for (let num of numbers) {
            result.push(num);
        }
        assert.deepEqual(result, [1,2,3,4,5]);
    });
    
    it("should filter iterables", () => {
        for (let num of numbers.filter(n => n % 2)) {
            result.push(num);
        }
        assert.deepEqual(result, [1,3,5]);
    });

    it("should map iterables", () => {
        for (let num of numbers.map(n => n * n)) {
            result.push(num);
        }
        assert.deepEqual(result, [1,4,9,16,25]);
    });
    
    it("should chain methods", () => {
        for (let num of numbers.filter(n => n % 2).map(n => n * n)) {
            result.push(num);
        }
        assert.deepEqual(result, [1,9,25]);
    });
    
    it("should split iterables", () => {
        var [odds, evens] = numbers.split(x => x % 2, x => x % 2 === 0);
        var evenResult = [];
        var oddResult = [];
        for (let num of evens) {
            evenResult.push(num);
        }
        for (let num of odds) {
            oddResult.push(num);
        }
        assert.deepEqual(evenResult, [2,4]);
        assert.deepEqual(oddResult, [1,3,5]);
    });
    
    it("should split using a Map of iterables", () => {
        var map = new Map();
        map.set("odd", x => x % 2);
        map.set("even", x => x % 2 === 0);
        result = {};
        for (let [key,val] of numbers.split(map)) {
            result[key] = [];
            for (let item of val) {
                result[key].push(item);
            }
        }
        assert.deepEqual(result, {
            "odd": [1,3,5],
            "even": [2,4]
        });
    });
    
    it("should zip iterables", () => {
        var pairs = numbers.split(x => x % 2, x => x % 2 === 0).zip();
        for (let pair of pairs) {
            result.push(pair);
        }
        assert.deepEqual(result, [[1,2],[3,4]]);
    });
    
    it("should produce a string representation", () => {
        assert.equal(numbers.toString(), "[1, 2, 3, 4, 5]"); 
    });
    
    it("should reduce to produce a sum", () => {
        var sum = numbers.reduce((accum, value) => accum + value, 0);
        assert.equal(sum, 15);
    });
    
    it("should implement some()", () => {
        result = numbers.some(num => num > 3);
        assert.equal(result, true);
        result = numbers.some(num => num < 0);
        assert.equal(result, false);
    });

    it("should implement every()", () => {
        result = numbers.every(num => num > 0);
        assert.equal(result, true);
        result = numbers.every(num => num > 1);
        assert.equal(result, false);
    });
    
    it("should take the first 2", () => {
        for (let num of numbers.take(2)) {
            result.push(num);
        }
        assert.deepEqual(result, [1,2]);
    });
    
    it("should take all if n > length", () => {
        for (let num of numbers.take(10)) {
            result.push(num);
        }
        assert.equal(result.length, 5);
        assert.deepEqual(result, [1,2,3,4,5]);
    });
    
    it("should skip the first 2", () => {
        for (let num of numbers.skip(2)) {
            result.push(num);
        }
        assert.deepEqual(result, [3,4,5]);
    });
    
    it("should skip all if n >= length", () => {
        for (let num of numbers.skip(10)) {
            result.push(num);
        }
        assert.deepEqual(result, []);
    });
});
