#!/usr/bin/env python3
"""Tiny local web server for the game.

Browsers refuse to load a game like this straight off the disk (opening
index.html by itself gives a blank page), so it has to be served. This picks
the first free port from 4173 upward and serves this folder.

    python3 server.py           # serve, print the address
    python3 server.py --open    # serve and open the browser too
"""
import functools
import http.server
import os
import socketserver
import sys
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))


def main():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True

    httpd = None
    for port in range(4173, 4193):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
            break
        except OSError:
            continue           # that port is busy, try the next one

    if httpd is None:
        print("Could not find a free port between 4173 and 4192.")
        return 1

    url = "http://localhost:%d" % httpd.server_address[1]
    print("")
    print("  Bramble and the Quilted Commons is running at:")
    print("    %s" % url)
    print("")
    print("  Leave this window open while you play.")
    print("  Press Control-C (or just close this window) to stop.")
    print("")

    if "--open" in sys.argv:
        webbrowser.open(url)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped. Thanks for playing!\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
