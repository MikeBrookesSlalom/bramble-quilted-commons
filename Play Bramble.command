#!/bin/bash
# Double-click this file to play.
cd "$(dirname "$0")" || exit 1
exec /usr/bin/python3 server.py --open
