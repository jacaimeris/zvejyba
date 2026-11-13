#!/usr/bin/env python3
"""Žvejo žurnalas: vietinis serveris (tik Python 3 stdlib, be priklausomybių).

Pakeičia tai, ką anksčiau teikė claude.ai artifact'as:
  db        -> JSON failai data/store/<kolekcija>.json   (/api/db/...)
  sample    -> Anthropic Messages API (su nuotraukomis)  (/api/sample, /api/limits)
Statika: public/ (tas pats katalogas, kurį publikuoja Netlify).

Paleidimas:  python3 server.py   ->  http://127.0.0.1:8765
Raktas:      ANTHROPIC_API_KEY aplinkoje arba .env faile (žr. .env.example).
"""
import json, mimetypes, os, re, sys, threading, urllib.error, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
STATIC = [ROOT / "public"]  # tas pats katalogas, kurį publikuoja Netlify
STORE = ROOT / "data" / "store"
COLLS = {"gear", "trips", "waters", "hyp", "briefs", "forecasts", "dossiers"}
ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$")
HOST, PORT = "127.0.0.1", int(os.environ.get("PORT", "8765"))
MODEL = os.environ.get("ZVEJO_MODEL", "claude-sonnet-5-5")
LOCK = threading.Lock()


def load_env():
    f = ROOT / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def read_coll(c):
    p = STORE / f"{c}.json"
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        return {}


def write_coll(c, data):
    STORE.mkdir(parents=True, exist_ok=True)
    p = STORE / f"{c}.json"
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tmp, p)


def call_claude(prompt, images):
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        return 503, {"error": "Nėra ANTHROPIC_API_KEY. Įrašyk jį į .env (žr. .env.example) ir perkrauk serverį."}
    content = []
    for im in images or []:
        m = re.match(r"^data:(image/[a-z+.-]+);base64,(.+)$", im or "", re.S)
        if m:
            content.append({"type": "image", "source": {"type": "base64", "media_type": m.group(1), "data": m.group(2)}})
    content.append({"type": "text", "text": prompt})
    body = json.dumps({"model": MODEL, "max_tokens": 4096, "messages": [{"role": "user", "content": content}]}).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages", data=body, method="POST",
        headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            j = json.loads(r.read())
        return 200, {"text": "".join(b.get("text", "") for b in j.get("content", []) if b.get("type") == "text")}
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read()).get("error", {}).get("message", "")
        except Exception:
            msg = ""
        return 502, {"error": f"Anthropic API {e.code}: {msg}"}
    except Exception as e:  # tinklo klaida ir pan.
        return 502, {"error": f"Anthropic API nepasiekiamas: {e}"}


class H(BaseHTTPRequestHandler):
    server_version = "Zvejo/1"

    def log_message(self, fmt, *a):
        sys.stderr.write("%s %s\n" % (self.command, self.path))

    def send_json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(b)

    def body_json(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > 40_000_000:
            raise ValueError("per didelis")
        return json.loads(self.rfile.read(n) or b"{}")

    def db_target(self, parts):
        # /api/db/<coll>[/<id>]
        if len(parts) < 4 or parts[3] not in COLLS:
            return None, None
        did = parts[4] if len(parts) > 4 else None
        if did is not None and not ID_RE.match(did):
            return None, None
        return parts[3], did

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/limits":
            return self.send_json(200, {"images": True, "ai": bool(os.environ.get("ANTHROPIC_API_KEY")), "model": MODEL})
        if path.startswith("/api/db/"):
            c, _ = self.db_target(path.split("/"))
            if not c:
                return self.send_json(404, {"error": "nežinoma kolekcija"})
            with LOCK:
                d = read_coll(c)
            return self.send_json(200, list(d.values()))
        if path.startswith("/api/"):
            return self.send_json(404, {"error": "nėra"})
        self.static(path)

    def do_PUT(self):
        path = unquote(urlparse(self.path).path)
        c, did = self.db_target(path.split("/")) if path.startswith("/api/db/") else (None, None)
        if not c or not did:
            return self.send_json(404, {"error": "bloga trasa"})
        try:
            doc = self.body_json()
        except Exception as e:
            return self.send_json(400, {"error": str(e)})
        doc["id"] = did
        with LOCK:
            d = read_coll(c)
            d[did] = doc
            write_coll(c, d)
        self.send_json(200, {"ok": True})

    def do_DELETE(self):
        path = unquote(urlparse(self.path).path)
        c, did = self.db_target(path.split("/")) if path.startswith("/api/db/") else (None, None)
        if not c or not did:
            return self.send_json(404, {"error": "bloga trasa"})
        with LOCK:
            d = read_coll(c)
            d.pop(did, None)
            write_coll(c, d)
        self.send_json(200, {"ok": True})

    def do_POST(self):
        if urlparse(self.path).path != "/api/sample":
            return self.send_json(404, {"error": "nėra"})
        try:
            j = self.body_json()
        except Exception as e:
            return self.send_json(400, {"error": str(e)})
        code, obj = call_claude(str(j.get("prompt", "")), j.get("images"))
        self.send_json(code, obj)

    def static(self, path):
        rel = path.lstrip("/") or "index.html"
        for base in STATIC:
            f = (base / rel).resolve()
            if base.resolve() in f.parents and f.is_file():
                data = f.read_bytes()
                ctype = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
                self.send_response(200)
                self.send_header("Content-Type", ctype + ("; charset=utf-8" if ctype.startswith("text/") or ctype.endswith("json") or ctype.endswith("javascript") else ""))
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(data)
                return
        self.send_json(404, {"error": "nerasta"})


if __name__ == "__main__":
    load_env()
    srv = ThreadingHTTPServer((HOST, PORT), H)
    print(f"Žvejo žurnalas: http://{HOST}:{PORT}  (modelis {MODEL}, API raktas: {'yra' if os.environ.get('ANTHROPIC_API_KEY') else 'NĖRA'})")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
