#!/usr/bin/env python3
"""Atnaujina public/forecast.json iš LHMT (api.meteo.lt, CC BY-SA 4.0).

- items: dienos prognozė Trakų vietovei (Viesų ežero brifui), 7 dienos.
  Vėjas, debesuotumas ir slėgis: vidurkiai nuo 1 val. prieš saulėtekį iki 1 val. po saulėlydžio.
- water: išmatuota vandens temperatūra artimiausiose LHMT upių stotyse aplink Vilnių.
  Ežeruose LHMT nematuoja, todėl programa tai rodo tik kaip įvertį.

Tik Python 3 standartinė biblioteka. Paleidimas: python3 scripts/update_forecast.py
"""
import json, math, os, sys, urllib.request
from datetime import datetime, timedelta, timezone

API = "https://api.meteo.lt/v1"
PLACE = "trakai"
WATER_ID = "viesai"
STATIONS = ["vilniaus-neris-vms", "vilniaus-vilnia-vms", "semeliskiu-vms",
            "drabuzninku-vms", "jasiunu-vms", "pabrades-vms"]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "forecast.json")
LT = timezone(timedelta(hours=2))  # lapkritis–kovas; vasarą LHMT laikas UTC, todėl skaičiuojame per UTC + poslinkį
DIRS = ["Š", "ŠR", "R", "PR", "P", "PV", "V", "ŠV"]
SKY = {"clear": "Giedra", "partly-cloudy": "Dalinai debesuota", "cloudy-with-sunny-intervals": "Dalinai debesuota",
       "cloudy": "Debesuota"}


def get(path):
    req = urllib.request.Request(API + path, headers={"User-Agent": "zvejo-zurnalas/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def lt_offset(d):
    # Lietuva: UTC+3 nuo paskutinio kovo sekmadienio iki paskutinio spalio sekmadienio, kitaip UTC+2
    def last_sun(y, m):
        x = datetime(y, m + 1, 1) - timedelta(days=1) if m < 12 else datetime(y, 12, 31)
        return x - timedelta(days=(x.weekday() + 1) % 7)
    a, b = last_sun(d.year, 3), last_sun(d.year, 10)
    return 3 if a <= d.replace(tzinfo=None) < b else 2


def sun_times(day, lat, lon):
    """NOAA apytikslis saulėtekis/saulėlydis, minutės vietos laiku."""
    n = day.timetuple().tm_yday
    g = 2 * math.pi / 365 * (n - 1)
    eq = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g) - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    de = 0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g) - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g)
    la = math.radians(lat)
    ha = math.degrees(math.acos(math.cos(math.radians(90.833)) / (math.cos(la) * math.cos(de)) - math.tan(la) * math.tan(de)))
    off = lt_offset(datetime(day.year, day.month, day.day)) * 60
    noon = 720 - 4 * lon - eq + off
    return noon - 4 * ha, noon + 4 * ha


def hm(m):
    m = round(m)
    return f"{m // 60:02d}:{m % 60:02d}"


def c(x):
    return f"{x:.1f}".replace(".", ",")


def main():
    fc = get(f"/places/{PLACE}/forecasts/long-term")
    lat, lon = fc["place"]["coordinates"]["latitude"], fc["place"]["coordinates"]["longitude"]
    now = datetime.now(timezone.utc)
    stamp = (now + timedelta(hours=lt_offset(now))).strftime("%Y-%m-%dT%H:%M") + f"+0{lt_offset(now)}:00"
    rows = []
    for t in fc["forecastTimestamps"]:
        u = datetime.strptime(t["forecastTimeUtc"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        loc = u + timedelta(hours=lt_offset(u))
        rows.append((loc, t))

    # vanduo
    st = []
    for code in STATIONS:
        try:
            o = get(f"/hydro-stations/{code}/observations/measured/latest")
        except Exception as e:  # stotis gali neveikti; tęsiame be jos
            print("praleidžiu", code, e, file=sys.stderr)
            continue
        obs = [x for x in o.get("observations", []) if x.get("waterTemperature") is not None]
        if obs:
            last = obs[-1]
            st.append({"name": o["station"]["waterBody"], "station": o["station"]["name"], "t": last["waterTemperature"],
                       "at": last["observationTimeUtc"]})
    measured = max((s["at"] for s in st), default=None)
    water = None
    if st:
        mu = datetime.strptime(measured, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        mloc = mu + timedelta(hours=lt_offset(mu))
        water = {"measured": mloc.strftime("%Y-%m-%dT%H:%M") + f"+0{lt_offset(mu)}:00",
                 "source": "LHMT upių hidrometrijos stotys (CC BY-SA 4.0)",
                 "note": "Artimiausios LHMT stotys aplink Vilnių (iki ~50 km). Ežeruose LHMT vandens temperatūros nematuoja.",
                 "stations": [{"name": s["name"], "t": s["t"]} for s in st]}
    wt = [s["t"] for s in st]
    wnote = ("Vandens temperatūra: LHMT upių stotys " + ", ".join(f"{s['name']} {c(s['t'])} °C" for s in st) +
             "; ežere nematuojama, todėl brifas jos neįrašo.") if st else "Vandens temperatūros duomenų nėra."

    items = []
    days = sorted({r[0].date() for r in rows})
    for day in days[:7]:
        dr = [t for (loc, t) in rows if loc.date() == day]
        if not dr:
            continue
        rise, sset = sun_times(day, lat, lon)
        win = [t for (loc, t) in rows if loc.date() == day and rise - 60 <= loc.hour * 60 + loc.minute <= sset + 60] or dr
        temps = [t["airTemperature"] for t in dr]
        R = math.pi / 180
        wx = sum(t["windSpeed"] * math.sin(t["windDirection"] * R) for t in win) / len(win)
        wy = sum(t["windSpeed"] * math.cos(t["windDirection"] * R) for t in win) / len(win)
        wdir = DIRS[round(((math.atan2(wx, wy) / R) % 360) / 45) % 8]
        ws = sum(t["windSpeed"] for t in win) / len(win)
        gust = max(t.get("windGust") or 0 for t in win)
        cl = sum(t["cloudCover"] for t in win) / len(win)
        p0, p1 = win[0]["seaLevelPressure"], win[-1]["seaLevelPressure"]
        pav = sum(t["seaLevelPressure"] for t in win) / len(win)
        trend = "kyla" if p1 - p0 > 1.5 else "krenta" if p1 - p0 < -1.5 else "stabilus"
        rain = sum(t.get("totalPrecipitation") or 0 for t in dr)
        sky = "Giedra" if cl < 25 else "Dalinai debesuota" if cl < 75 else "Debesuota"
        if rain >= 1:
            sky_plan = "Lietus"
        else:
            sky_plan = sky
        items.append({
            "date": day.isoformat(), "waterId": WATER_ID,
            "source": f"LHMT (Trakai, CC BY-SA 4.0), gauta {stamp[:10]} {stamp[11:16]}",
            "tMin": c(min(temps)), "tMax": c(max(temps)), "cloud": f"{sky} ({round(cl)} %)",
            "windDir": wdir, "windMs": c(ws), "gustMs": c(gust),
            "pressure": f"{round(pav)} hPa, {trend}", "precip": f"{c(rain)} mm", "visibility": "",
            "sunrise": hm(rise), "sunset": hm(sset),
            "waterTempEst": (f"upėse {c(min(wt))}–{c(max(wt))} °C" if wt else ""),
            "notes": "Vėjas, debesuotumas ir slėgis: vidurkiai nuo 1 val. prieš saulėtekį iki 1 val. po saulėlydžio. " + wnote,
            "plan": {"temp": str(round(sum(temps) / len(temps))), "wind": f"{ws:.1f}", "dir": wdir, "sky": sky_plan,
                     "pressure": str(round(pav)), "trend": trend.capitalize()},
            "fetchedAt": stamp})
    out = {"fetched": stamp,
           "attribution": "Duomenys: Lietuvos hidrometeorologijos tarnyba (LHMT, CC BY-SA 4.0).",
           "items": items}
    if water:
        out["water"] = water
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(items)} dienos, {len(st)} vandens stotys -> {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
