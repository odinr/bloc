#!/bin/bash -eux
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ $BRANCH == "master" ]; then
    lerna publish
else
    lerna publish --no-git-reset --canary --dist-tag $BRANCH
fi