#!/bin/bash -ex
rm -rf ./build

# Simple babel run
./node_modules/.bin/babel --out-dir ./build ./src
