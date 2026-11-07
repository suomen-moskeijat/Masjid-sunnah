# Rukousajat ja kuvat moskeijan sivulle

Sivusto toimii jokaiselle moskeijalle ilman ylimääräistä työtä. Jos moskeijalla on oma
rukousaikapalvelu tai kuvia, ne saa käyttöön yhdellä asetuksella. Kaikki asetukset ovat
moskeijan tiedostossa `_moskeijat/<moskeija>.md`, ja niitä voi muokata selaimessa
Pages CMS:ssä (Moskeijat → moskeija → Rukousajat).

## 1. Rukousajat: valitse lähde

```yaml
rukousajat:
  lahde: masjidbox        # masjidbox | mawaqit | rukousajat | taulukko | laskenta
  tunnus: masjid-sunnah-helsinki
  iqamah_oletus: { fajr: 10, dhuhr: 10, asr: 10, maghrib: 5, isha: 10 }
```

| Moskeijalla on… | `lahde` | `tunnus` | Mitä tapahtuu |
|---|---|---|---|
| **Masjidbox** | `masjidbox` | osoitteen `masjidbox.com/prayer-times/TUNNUS` loppuosa | Adhan, iqamah ja Jumuah haetaan **automaattisesti kerran tunnissa** (seuraavat 7 päivää). |
| **Mawaqit** | `mawaqit` | osoitteen `mawaqit.net/fi/TUNNUS` loppuosa | Adhan, iqamah ja Jumuah haetaan **automaattisesti kerran tunnissa** (kuluva + 2 seuraavaa kuukautta). Myös moskeijan **kuvat** Mawaqitista lisätään galleriaan. |
| **Ei omaa, pääkaupunkiseutu** | `rukousajat` (oletus, jos kaupunki on Helsinki, Espoo tai Vantaa) | – | Ajat haetaan **rukousajat.fi:n Helsingin aikataulusta** kerran tunnissa (kuluva + 2 kuukautta). Iqamah = rukousaika + `iqamah_oletus` minuuttia. |
| **Oma aikataulu** (Excel, PDF tms.) | `taulukko` | – | Kuukauden ajat lisätään CSV-tiedostona: `_data/aikataulut/<moskeija>/VVVV-KK.csv` (malli alla). |
| **Ei omaa, muu kaupunki** | `laskenta` (tai jätä tyhjäksi) | – | Ajat lasketaan **samalla tavalla kuin [rukousajat.fi](https://www.rukousajat.fi/) muissa kaupungeissa** moskeijan koordinaateista (`sijainti: lat, lon`). Iqamah = rukousaika + `iqamah_oletus` minuuttia. |

**Miten rukousajat.fi toimii:** Helsingissä, Espoossa ja Vantaalla se näyttää valmiin
vuosiaikataulun (sama kuin esim. Masjid Sunnahin Masjidbox-näytöllä); muualla se laskee ajat.
Sivusto tekee samoin. Taulukko luetaan rukousajat.fi:n sovelluksesta joka ajossa, joten jos
se päivittyy, sivu seuraa. Jos haku joskus epäonnistuu, käytetään viimeisimpiä haettuja aikoja
ja niiden jälkeen laskentaa.

Ilman lähdettä tarvitaan siis vain moskeijan sijainti. Laskennan oletusasetukset ovat samat kuin
rukousajat.fi:ssä: `laskentatapa: MuslimWorldLeague`, `madhab: Shafi` ja
`korkeat_leveysasteet: TwilightAngle` (kesän valoisat yöt). Niitä voi muuttaa, jos moskeija
haluaa toisin. Sama laskenta täyttää myös päivät, joille virallista aikaa ei vielä ole.

**Perjantai:** Masjidbox ja Mawaqit antavat Jumuah-ajan. Muuten kenttä `juma: "13.30"`.

**Mistä tunnus löytyy?** Avaa moskeijan sivu palvelussa selaimella ja kopioi osoitteen
viimeinen osa. Esim. `https://masjidbox.com/prayer-times/masjid-sunnah-helsinki` →
`masjid-sunnah-helsinki`.

### CSV-malli (lahde: taulukko)

```
pv,fajr,auringonnousu,dhuhr,asr,maghrib,isha,iqamah_fajr,iqamah_dhuhr,iqamah_asr,iqamah_maghrib,iqamah_isha
1,05:19,07:39,12:06,13:54,16:27,18:39,06:00,12:16,14:04,16:32,20:00
2,05:21,07:42,12:06,13:52,16:25,18:37,06:00,12:16,14:02,16:30,20:00
```

Iqamah-sarakkeet saa jättää tyhjiksi; silloin käytetään `iqamah_oletus`-minuutteja.
Puuttuville päiville sivu laskee ajat koordinaateista.

## 2. Kuvat

- **Omat kuvat:** Pages CMS → Moskeijat → *Kuvagalleria* → lisää kuvat. Ne näkyvät
  etusivulla ja Meistä-sivulla (enintään 9).
- **Mawaqitista automaattisesti:** jos `lahde: mawaqit`, moskeijan Mawaqitiin lisäämät
  sisä- ja ulkokuvat ladataan sivustolle ja lisätään galleriaan.
- **Instagramista automaattisesti:** jos kentässä `some.instagram` on tilin osoite,
  uusimmat julkaisut näkyvät sivulla omana osionaan.
- **Ei kuvia:** galleriaa ei näytetä; sivu näyttää silti valmiilta (kuvio, värit, logo).

Kuvissa ei mielellään näy ihmisten kasvoja ilman lupaa.

## 3. Miten päivitys toimii

GitHubin julkaisuajo (`.github/workflows/julkaisu.yml`) käy **kerran tunnissa** ja aina, kun
sivustoon tehdään muutos: se hakee Instagram-julkaisut ja rukousajat
(`.github/scripts/rukousajat.py`) ja julkaisee sivun. Jos palvelu on hetken alhaalla,
sivu käyttää viimeisimpiä tunnettuja aikoja. Ajon voi käynnistää myös käsin:
GitHub → Actions → *Julkaise sivusto* → *Run workflow*.
