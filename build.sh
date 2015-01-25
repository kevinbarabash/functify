#!/bin/bash
6to5 src/functify.js -o build/functify.js -b generators --loose classes
6to5 test/src/tests.js -o test/build/tests.js -b generators --loose classes
