#!/bin/sh
wget -q -O - "http://127.0.0.1:${PORT:-8787}/health" >/dev/null 2>&1 || exit 1
