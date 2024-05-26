#!/bin/sh

cd dist || exit 1
zip -r oscar-api.zip ./* || exit 1
aws lambda update-function-code --function-name "$ARN" --zip-file fileb://oscar-api.zip
