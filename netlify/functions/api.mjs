// Žvejo žurnalas backend (Netlify Functions v2). Atkartoja server.py API:
//   GET  /api/limits                 viešas: {images, ai, ready, pin}
//   GET  /api/db                     visos kolekcijos viena užklausa {gear:[...], trips:[...]}
//   GET  /api/db/<kolekcija>         viena kolekcija
//   PUT/DELETE /api/db/<kolekcija>/<id>
//   POST /api/sample                 {prompt, images:[dataURL]} -> Anthropic Messages API
// Viskas, išskyrus /api/limits, reikalauja antraštės x-zvejo-pin == ZVEJO_PIN.
// Jei ZVEJO_PIN nenustatytas, API uždarytas (fail closed): niekas negali išnaudoti Anthropic kreditų.
// Aplinkos kintamieji (Netlify -> Project configuration -> Environment variables):
//   ZVEJO_PIN, ANTHROPIC_API_KEY, pasirinktinai ZVEJO_MODEL.
import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

const COLLS = ["gear", "trips", "waters", "hyp", "briefs", "forecasts", "dossiers"];
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/;
const MAX_DOC = 4_000_000;
const MAX_PROMPT = 200_000;
const MAX_IMAGES = 6;
const MAX_IMAGE_B64 = 4_000_000;

const env = (k) => (globalThis.Netlify && Netlify.env.get(k)) || "";
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const sha = (s) => createHash("sha256").update(String(s)).digest();
function pinOk(req) {
  const pin = env("ZVEJO_PIN");
  if (!pin) return false;
  return timingSafeEqual(sha(req.headers.get("x-zvejo-pin") || ""), sha(pin));
}

const store = (c) => getStore({ name: "zvejo-" + c, consistency: "strong" });

async function readColl(c) {
  const s = store(c);
  const { blobs } = await s.list();
  const docs = await Promise.all(blobs.map((b) => s.get(b.key, { type: "json" })));
  return docs.filter(Boolean);
}

async function sample(req) {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "Serveryje nėra ANTHROPIC_API_KEY." }, 503);
  let j;
  try { j = await req.json(); } catch { return json({ error: "Blogas JSON" }, 400); }
  const prompt = String(j.prompt || "");
  if (prompt.length > MAX_PROMPT) return json({ error: "Per ilgas promptas" }, 413);
  const content = [];
  for (const im of (j.images || []).slice(0, MAX_IMAGES)) {
    const m = /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/s.exec(im || "");
    if (m && m[2].length <= MAX_IMAGE_B64)
      content.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } });
  }
  content.push({ type: "text", text: prompt });
  let r;
  try {
    // Netlify AI Gateway įdeda ANTHROPIC_API_KEY kartu su ANTHROPIC_BASE_URL: raktas galioja tik per tą adresą.
    const base = (env("ANTHROPIC_BASE_URL") || "https://api.anthropic.com").replace(/\/+$/, "");
    r = await fetch(base + "/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: env("ZVEJO_MODEL") || "claude-sonnet-5-5",
        max_tokens: 4096,
        messages: [{ role: "user", content }],
      }),
    });
  } catch (e) {
    return json({ error: "Anthropic API nepasiekiamas: " + e.message }, 502);
  }
  const body = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: `Anthropic API ${r.status}: ${(body.error && body.error.message) || ""}` }, 502);
  return json({ text: (body.content || []).filter((b) => b.type === "text").map((b) => b.text).join("") });
}

export default async (req) => {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean); // ["api", ...]
  const [, a, c, id] = parts;

  if (a === "limits" && req.method === "GET")
    return json({ images: true, ai: !!env("ANTHROPIC_API_KEY"), ready: !!env("ZVEJO_PIN"), pin: true });

  if (!pinOk(req)) return json({ error: "Reikalingas teisingas PIN" }, 401);

  try {
    if (a === "sample" && req.method === "POST") return await sample(req);

    if (a === "db") {
      if (!c && req.method === "GET") {
        const all = await Promise.all(COLLS.map(readColl));
        return json(Object.fromEntries(COLLS.map((k, i) => [k, all[i]])));
      }
      if (!COLLS.includes(c)) return json({ error: "nežinoma kolekcija" }, 404);
      if (!id && req.method === "GET") return json(await readColl(c));
      if (!id || !ID_RE.test(id)) return json({ error: "bloga trasa" }, 404);
      if (req.method === "PUT") {
        const text = await req.text();
        if (text.length > MAX_DOC) return json({ error: "Per didelis įrašas" }, 413);
        let doc;
        try { doc = JSON.parse(text); } catch { return json({ error: "Blogas JSON" }, 400); }
        await store(c).setJSON(id, { ...doc, id });
        return json({ ok: true });
      }
      if (req.method === "DELETE") {
        await store(c).delete(id);
        return json({ ok: true });
      }
    }
  } catch (e) {
    return json({ error: "Serverio klaida: " + (e.message || e) }, 500);
  }
  return json({ error: "nėra" }, 404);
};

export const config = { path: "/api/*" };
