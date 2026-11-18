#!/bin/sh
set -eu

if [ -z "${CI_COMMIT_TAG:-}" ]; then
  echo "ERROR: CI_COMMIT_TAG is required"
  exit 1
fi

awk -v tag="$CI_COMMIT_TAG" '
  BEGIN {
    found = 0
  }

  $0 ~ "^## .*" tag "([[:space:]]|$)" {
    found = 1
  }

  found && /^## / && $0 !~ "^## .*" tag "([[:space:]]|$)" {
    exit
  }

  found {
    print
  }
' CHANGELOG.md > release-description.md

if [ ! -s release-description.md ]; then
  echo "ERROR: Could not find changelog entry for $CI_COMMIT_TAG"
  exit 1
fi

sed -i ':a;N;$!ba;s/[[:space:]]*---[[:space:]]*$//' release-description.md
