#!/usr/bin/env python3
"""Hakee moskeijoiden viralliset rukousajat Masjidboxista sivustoa varten.

Lukee Masjidbox-tunnuksen tiedostoista _moskeijat/*.md (kenttä masjidbox:,
esim. "masjid-sunnah-helsinki" osoitteesta masjidbox.com/prayer-times/<tunnus>),
hakee moskeijan julkisen Masjidbox-sivun ja päivittää sivulla olevat päivät
(yleensä seuraavat 7) aikataulutiedostoihin
_data/aikataulut/<moskeijan slug>/VVVV-KK.csv: adhan- ja iqamah-ajat.
Perjantaisin keskipäivän rukoukseksi tallennetaan Jumuah-aika, jos Masjidbox
ilmoittaa sen. Muut päivät jäävät ennalleen.

Näin sivuston ajat pysyvät samoina kuin moskeijan Masjidbox-näytöllä: kun
moskeija muuttaa aikoja Masjidboxissa, sivusto päivittyy seuraavassa
julkaisuajossa. Jos haku epäonnistuu, tiedostoja ei muuteta.
Ei ulkoisia riippuvuuksia.
"""
import csv
import glob
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

JUURI = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SARAKKEET = ["pv", "fajr", "auringonnousu", "dhuhr", "asr", "maghrib", "isha",
             "iqamah_fajr", "iqamah_dhuhr", "iqamah_asr", "iqamah_maghrib", "iqamah_isha"]


def moskeijat():
    """(moskeijan slug, Masjidbox-tunnus) jokaisesta moskeijasta, jolla kenttä masjidbox on."""
    tulos = []
    for polku in sorted(glob.glob(os.path.join(JUURI, "_moskeijat", "*.md"))):
        slug, tunnus = os.path.splitext(os.path.basename(polku))[0], None
        with open(polku, encoding="utf-8") as f:
            for rivi in f:
                m = re.match(r'slug:\s*["\']?([a-z0-9-]+)', rivi)
                if m:
                    slug = m.group(1)
                m = re.match(r'masjidbox:\s*["\']?([A-Za-z0-9-]+)', rivi)
                if m:
                    tunnus = m.group(1)
        if tunnus:
            tulos.append((slug, tunnus))
    return tulos


def hae_aikataulu(tunnus):
    """Lukee julkisen Masjidbox-sivun valmiiksi upotetun tilan (window.REDUX_STATE)."""
    osoite = "https://masjidbox.com/prayer-times/" + urllib.parse.quote(tunnus)
    pyynto = urllib.request.Request(osoite, headers={"User-Agent": "Mozilla/5.0 (compatible; MoskeijaSivusto/1.0)"})
    with urllib.request.urlopen(pyynto, timeout=30) as vastaus:
        sivu = vastaus.read().decode("utf-8", "replace")
    m = re.search(r'window\.REDUX_STATE\s*=\s*(["\'])(.*?)\1', sivu, re.S)
    if not m:
        raise ValueError("sivulta ei löytynyt aikataulua (REDUX_STATE)")
    raaka = re.sub(r"%u([0-9A-Fa-f]{4})", lambda x: chr(int(x.group(1), 16)), m.group(2))
    tila = json.loads(urllib.parse.unquote(raaka))
    athany = tila.get("masjidbox", {}).get("masjidboxAthany") or {}
    paivat = athany.get("timetable") or []
    if not paivat:
        raise ValueError("aikataulu on tyhjä")
    if athany.get("isStale"):
        print(f"  Huom: Masjidbox merkitsee aikataulun vanhentuneeksi ({tunnus})")
    return paivat


def kello(aikaleima):
    """'2026-11-07T18:27:00+02:00' -> '18:27' (moskeijan paikallinen aika kuten Masjidbox näyttää)."""
    m = re.match(r"\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})", aikaleima or "")
    return m.group(1) if m else ""


def paivita(slug, paivat):
    kansio = os.path.join(JUURI, "_data", "aikataulut", slug)
    os.makedirs(kansio, exist_ok=True)
    kuukausittain = {}
    for p in paivat:
        pvm = (p.get("date") or "")[:10]
        if not re.match(r"\d{4}-\d{2}-\d{2}$", pvm):
            continue
        iq = p.get("iqamah") or {}
        rivi = {
            "pv": str(int(pvm[8:10])),
            "fajr": kello(p.get("fajr")), "auringonnousu": kello(p.get("sunrise")),
            "dhuhr": kello(p.get("dhuhr")), "asr": kello(p.get("asr")),
            "maghrib": kello(p.get("maghrib")), "isha": kello(p.get("isha")),
            "iqamah_fajr": kello(iq.get("fajr")), "iqamah_dhuhr": kello(iq.get("dhuhr")),
            "iqamah_asr": kello(iq.get("asr")), "iqamah_maghrib": kello(iq.get("maghrib")),
            "iqamah_isha": kello(iq.get("isha")),
        }
        # Perjantai: Jumuah keskipäivän rukouksen paikalle, jos Masjidbox ilmoittaa sen
        jumuah, iq_jumuah = p.get("jumuah") or [], iq.get("jumuah") or []
        if jumuah and kello(jumuah[0]):
            rivi["dhuhr"] = kello(jumuah[0])
            if iq_jumuah and kello(iq_jumuah[0]):
                rivi["iqamah_dhuhr"] = kello(iq_jumuah[0])
        if not all(rivi[k] for k in ("fajr", "dhuhr", "asr", "maghrib", "isha")):
            continue
        kuukausittain.setdefault(pvm[:7], []).append(rivi)

    muutettu = 0
    for kk, rivit in kuukausittain.items():
        polku = os.path.join(kansio, kk + ".csv")
        vanhat = {}
        if os.path.exists(polku):
            with open(polku, encoding="utf-8", newline="") as f:
                for r in csv.DictReader(f):
                    vanhat[str(int(r["pv"]))] = {k: r.get(k, "") or "" for k in SARAKKEET}
        for r in rivit:
            if vanhat.get(r["pv"]) != r:
                muutettu += 1
            vanhat[r["pv"]] = r
        ulos = io.StringIO()
        kirjoittaja = csv.DictWriter(ulos, fieldnames=SARAKKEET, lineterminator="\n")
        kirjoittaja.writeheader()
        for pv in sorted(vanhat, key=int):
            kirjoittaja.writerow(vanhat[pv])
        with open(polku, "w", encoding="utf-8", newline="") as f:
            f.write(ulos.getvalue())
    return muutettu, sum(len(r) for r in kuukausittain.values())


def main():
    lista = moskeijat()
    if not lista:
        print("Yhdelläkään moskeijalla ei ole masjidbox-kenttää.")
        return 0
    for slug, tunnus in lista:
        try:
            paivat = hae_aikataulu(tunnus)
            muutettu, yhteensa = paivita(slug, paivat)
            print(f"{slug}: {yhteensa} päivää Masjidboxista ({tunnus}), {muutettu} muuttui")
        except Exception as e:  # haku epäonnistui: vanhat ajat jäävät voimaan
            print(f"{slug}: Masjidbox-haku epäonnistui ({tunnus}): {e}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
