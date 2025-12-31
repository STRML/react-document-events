#!/bin/bash -ex
rm -rf ./build

# Build with esbuild
./node_modules/.bin/esbuild src/*.jsx src/*.js \
  --outdir=build \
  --format=cjs \
  --target=node20 \
  --platform=node
