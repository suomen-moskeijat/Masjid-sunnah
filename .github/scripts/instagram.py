#!/usr/bin/env python3
"""Hakee moskeijoiden Instagram-tilien uusimmat julkaisut sivustoa varten.

Lukee Instagram-osoitteet tiedostoista _moskeijat/*.md (kenttä some.instagram),
hakee kunkin tilin julkisen profiiliupotuksen (instagram.com/<tunnus>/embed/)
ja tallentaa uusimpien julkaisujen tunnukset tiedostoon
_data/instagram/<tunnus>.json. Sivusto näyttää ne isoina kortteina.

Jos haku epäonnistuu, vanhaa tiedostoa ei muuteta – sivu käyttää silloin
viimeksi haettuja julkaisuja tai Instagramin omaa profiiliupotusta.
Ei ulkoisia riippuvuuksia (pelkkä Python 3:n vakiokirjasto).
"""
import datetime
import glob
import json
import os
import re
import sys
import urllib.request

JUURI = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENINTAAN = 9
# Lyhyellä selaintunnisteella Instagram palauttaa upotuksen, jossa julkaisutiedot ovat
# valmiina HTML:ssä (täydellä Chrome-tunnisteella ne ladataan vasta JavaScriptillä).
SELAIMET = ["Mozilla/5.0", "Mozilla/5.0 (compatible; MoskeijaSivusto/1.0)"]


def tunnukset():
    """Instagram-käyttäjätunnukset moskeijoiden tiedoista (pienillä kirjaimilla)."""
    loydetyt = []
    for polku in sorted(glob.glob(os.path.join(JUURI, "_moskeijat", "*.md"))):
        with open(polku, encoding="utf-8") as f:
            for rivi in f:
                m = re.match(r'\s+instagram:\s*["\']?https?://(?:www\.)?instagram\.com/([A-Za-z0-9._]+)', rivi)
                if m:
                    t = m.group(1).lower()
                    if t not in loydetyt:
                        loydetyt.append(t)
    return loydetyt


def hae(tunnus):
    for selain in SELAIMET:
        julkaisut = hae_kerran(tunnus, selain)
        if julkaisut:
            return julkaisut
    return []


def hae_kerran(tunnus, selain):
    pyynto = urllib.request.Request(
        f"https://www.instagram.com/{tunnus}/embed/",
        headers={"User-Agent": selain, "Accept-Language": "fi,en;q=0.8"})
    with urllib.request.urlopen(pyynto, timeout=30) as vastaus:
        html = vastaus.read().decode("utf-8", "replace")
    # Profiiliupotuksen sisällä on JSON-data (kenoviivoin suojattuna).
    data = html.replace('\\"', '"').replace("\\/", "/")
    julkaisut, nahty = [], set()
    for m in re.finditer(r'"shortcode_media":\{"__typename":"Graph(Image|Video|Sidecar)".{0,400}?"shortcode":"([A-Za-z0-9_-]+)"', data):
        tyyppi, koodi = m.group(1), m.group(2)
        if koodi in nahty:
            continue
        nahty.add(koodi)
        julkaisut.append({"koodi": koodi, "tyyppi": {"Image": "kuva", "Video": "video", "Sidecar": "albumi"}[tyyppi]})
    if not julkaisut:  # varalla: pelkät tunnukset
        for koodi in re.findall(r'"shortcode":"([A-Za-z0-9_-]+)"', data):
            if koodi not in nahty:
                nahty.add(koodi)
                julkaisut.append({"koodi": koodi, "tyyppi": "kuva"})
    return julkaisut[:ENINTAAN]


def main():
    kansio = os.path.join(JUURI, "_data", "instagram")
    os.makedirs(kansio, exist_ok=True)
    virheita = 0
    for tunnus in tunnukset():
        try:
            julkaisut = hae(tunnus)
        except Exception as e:  # verkko- tai muotovirhe: säilytetään vanha tieto
            print(f"{tunnus}: haku epäonnistui ({e})", file=sys.stderr)
            virheita += 1
            continue
        if not julkaisut:
            print(f"{tunnus}: julkaisuja ei löytynyt, vanha tieto säilytetään", file=sys.stderr)
            virheita += 1
            continue
        tiedosto = os.path.join(kansio, tunnus.replace(".", "_") + ".json")
        with open(tiedosto, "w", encoding="utf-8") as f:
            json.dump({
                "kayttaja": tunnus,
                "paivitetty": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="minutes"),
                "julkaisut": julkaisut,
            }, f, ensure_ascii=False, indent=1)
            f.write("\n")
        print(f"{tunnus}: {len(julkaisut)} julkaisua -> {os.path.relpath(tiedosto, JUURI)}")
    return 0  # epäonnistunut haku ei estä sivuston julkaisua


if __name__ == "__main__":
    sys.exit(main())
