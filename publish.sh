#!/bin/sh

if [ -z "$GH_TOKEN" ]; then
    echo "You must set the GH_TOKEN environment variable."
    echo "See README.md for more details."
    exit 1
fi

# clean cookies to make sure no cookie data file is accidentally part of the build
rm -rf cookies/
mkdir cookies
touch cookies/.keep

# This will build, package and upload the app to GitHub.
node_modules/.bin/build -mwl --x64 --ia32 -p always
