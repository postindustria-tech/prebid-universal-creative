#!/bin/bash

set -e

### Option one (local)
echo "BUILD: Prescribe..."
cd prescribe
npm install
cd ..
echo "BUILD: Postscribe..."
cd postscribe
npm install
cd ..
echo "BUILD: Global..."
npm install

### Option two (npm link)
#echo "BUILD: Prescribe..."
#cd prescribe
#npm install
#npm link
#cd ..
#echo "BUILD: Postscribe..."
#cd postscribe
#npm link prescribe
#npm install
#npm link
#cd ..
#echo "BUILD: Global..."
#npm link postscribe
#npm install