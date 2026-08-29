#!/usr/bin/env python3
"""
Local dev server that mimics the site's .htaccess clean-URL rewriting
(serves foo.html when /foo is requested), so localhost testing behaves
the same as the real live site. Run with: python serve-local.py
"""
import http.server
import os
import socketserver

PORT = 8000


class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        fs_path = path.lstrip("/")

        if fs_path == "" or fs_path.endswith("/"):
            candidate = fs_path + "index.html"
        else:
            candidate = fs_path + ".html"

        # "collections" collides with the collections/ subfolder on disk;
        # mirror the .htaccess special-case for it.
        if fs_path.rstrip("/") == "collections" and os.path.isfile("collections.html"):
            self.path = "/collections.html"
        elif not os.path.exists(fs_path) and os.path.isfile(candidate):
            self.path = "/" + candidate

        return super().do_GET()


with socketserver.TCPServer(("", PORT), CleanURLHandler) as httpd:
    print(f"Serving with clean-URL support at http://localhost:{PORT}/")
    httpd.serve_forever()
