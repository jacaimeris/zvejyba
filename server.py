#!/usr/bin/env python3
"""Žvejo žurnalas: vietinis serveris (tik Python 3 stdlib, be priklausomybių).

Pakeičia tai, ką anksčiau teikė claude.ai artifact'as:
  db        -> JSON failai data/store/<kolekcija>.json   (/api/db/...)
  sample    -> Anthropic Messages API (su nuotraukomis)  (/api/sample, /api/limits)
Statika: public/ (tas pats katalogas, kurį publikuoja Netlify).

Paleidimas:  python3 server.py           ->  http://127.0.0.1:8765
             python3 server.py --sync    ->  kas 30 s paima naujausią main iš GitHub (tik fast-forward,
                                             tik jei nėra neišsaugotų vietinių pakeitimų) ir pats
                                             perkrauna naršyklės langą, kai pasikeičia commit'as.
Raktas:      ANTHROPIC_API_KEY aplinkoje arba .env faile (žr. .env.example).
"""
import json, mimetypes, os, re, subprocess, sys, threading, time, urllib.error, urllib.request
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
SYNC = {"on": False, "status": "sinchronizacija išjungta", "checked": 0}
SYNC_EVERY = 30
RELOAD_JS = (
    "<script>(()=>{let c=null;const p=document.createElement('div');"
    "p.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99999;font:11px/1.2 ui-monospace,monospace;"
    "background:#000a;color:#fff;padding:3px 7px;border-radius:6px;pointer-events:none';document.body.appendChild(p);"
    "const t=async()=>{try{const v=await (await fetch('/api/version',{cache:'no-store'})).json();"
    "if(c&&v.commit!==c){location.reload();return}c=v.commit;p.textContent='main@'+v.commit+' · '+v.status}catch(e){}};"
    "t();setInterval(t,8000)})()</script>"
)


def git(*args, cwd=None, timeout=30):
    r = subprocess.run(["git", *args], cwd=cwd or ROOT, capture_output=True, text=True, timeout=timeout)
    return r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip()


def head_info(cwd=None):
    _, h, _ = git("rev-parse", "--short", "HEAD", cwd=cwd)
    _, s, _ = git("log", "-1", "--format=%s", cwd=cwd)
    return h, s


def sync_once(cwd=None):
    """Paima origin/main, jei įmanoma be konfliktų. Grąžina trumpą būsenos tekstą."""
    try:
        rc, _, err = git("fetch", "-q", "origin", "main", cwd=cwd, timeout=60)
        if rc:
            return "GitHub nepasiekiamas"
        _, behind, _ = git("rev-list", "--count", "HEAD..origin/main", cwd=cwd)
        _, ahead, _ = git("rev-list", "--count", "origin/main..HEAD", cwd=cwd)
        if behind == "0":
            return "naujausia" if ahead == "0" else f"vietinė, +{ahead} neįkelta"
        _, dirty, _ = git("status", "--porcelain", cwd=cwd)
        if dirty:
            return f"yra {behind} nauji, bet vietiniai pakeitimai neleidžia atnaujinti"
        if ahead != "0":
            return f"išsiskyrė nuo GitHub (+{ahead}/-{behind}), atnaujink ranka"
        rc, _, err = git("merge", "--ff-only", "-q", "origin/main", cwd=cwd)
        return "atnaujinta iš GitHub" if rc == 0 else "nepavyko atnaujinti: " + err[:80]
    except Exception as e:  # tinklas, timeout ir pan.
        return "sinchronizacijos klaida: " + str(e)[:60]


def sync_loop():
    while True:
        SYNC["status"] = sync_once()
        SYNC["checked"] = int(time.time())
        time.sleep(SYNC_EVERY)


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
        if path == "/api/version":
            h, s = head_info()
            return self.send_json(200, {"commit": h, "subject": s, "status": SYNC["status"], "sync": SYNC["on"], "checked": SYNC["checked"]})
        if path == "/api/limits":
            return self.send_json(200, {"images": True, "ai": bool(os.environ.get("ANTHROPIC_API_KEY")), "model": MODEL, "ready": True, "pin": False})
        if path == "/api/db":  # visos kolekcijos viena užklausa (kaip Netlify funkcija)
            with LOCK:
                return self.send_json(200, {c: list(read_coll(c).values()) for c in sorted(COLLS)})
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
                if SYNC["on"] and f.name == "index.html" and f.parent == STATIC[0].resolve():
                    data = data.replace(b"</body>", RELOAD_JS.encode() + b"</body>", 1)
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
    if "--sync" in sys.argv:
        SYNC["on"] = True
        SYNC["status"] = "tikrinama…"
        threading.Thread(target=sync_loop, daemon=True).start()
    srv = ThreadingHTTPServer((HOST, PORT), H)
    print(f"Žvejo žurnalas: http://{HOST}:{PORT}  (modelis {MODEL}, API raktas: {'yra' if os.environ.get('ANTHROPIC_API_KEY') else 'NĖRA'}, GitHub sinchronizacija: {'ĮJUNGTA' if SYNC['on'] else 'išjungta'})")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
