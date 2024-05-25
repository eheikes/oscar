#!/bin/sh

cp package.json ../../package-lock.json dist/
cp -R ../../node_modules dist/
cd dist || exit 1
zip -r oscar-api.zip ./*
