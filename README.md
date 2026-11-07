# Masjid Sunnah Helsinki – verkkosivusto

**Sivusto:** https://suomen-moskeijat.github.io/Masjid-sunnah/

Masjid Sunnah Helsingin (Ylä-Malmin tori 6B) verkkosivut: rukousajat iqamah-aikoineen,
Meistä, Opetus ja palvelut, lasten opetukseen ilmoittautuminen, tapahtumat, artikkelit,
yhteystiedot, lahjoitukset ja tietosuoja – suomeksi, englanniksi, arabiaksi ja somaliksi.

Ilmainen: GitHub Pages (hosting) + Pages CMS (muokkausnäkymä). Sivupohja:
[Suomen moskeijat](https://github.com/Waisatifi/Moskeija).

## Julkaisu
*Settings → Pages → Deploy from a branch → `main` / `(root)`*. Sivu aukeaa osoitteessa
https://suomen-moskeijat.github.io/Masjid-sunnah/ parin minuutin kuluttua.

## Sisällön muokkaus
- **Selaimessa:** https://app.pagescms.org → kirjaudu GitHubilla → valitse tämä repo.
  Moskeijan väen voi kutsua sähköpostilla (*Settings → Collaborators*), GitHub-tiliä ei tarvita.
- **Moskeijan tiedot ja tekstit:** `_moskeijat/masjid-sunnah-helsinki.md`
- **Tapahtumat:** `_tapahtumat/`, **artikkelit:** `_posts/`, **tiedostot ja kuvat:** `tiedostot/`
- **Käyttöliittymän käännökset:** `_data/kaannokset.yml`

## Rukousajat
Virallinen aikataulu (Masjidbox) kuukausittain tiedostoissa
`_data/aikataulut/masjid-sunnah-helsinki/VVVV-KK.csv`:

```
pv,fajr,auringonnousu,dhuhr,asr,maghrib,isha,iqamah_fajr,iqamah_dhuhr,iqamah_asr,iqamah_maghrib,iqamah_isha
1,06:16,08:52,12:12,13:13,15:28,17:55,06:30,12:22,13:23,15:33,17:55
```

Tyhjät iqamah-sarakkeet täytetään `iqamah_oletus`-minuuteilla. Jos kuukauden tiedosto
puuttuu, ajat lasketaan automaattisesti.

## Puuttuvat tiedot (täytä tiedostoon `_moskeijat/masjid-sunnah-helsinki.md`)
- `juma` – perjantairukouksen aika
- `sahkoposti`
- `lahjoitus` – tilinumero / MobilePay / verkkolahjoitus
- `kuva`, `galleria` – valokuvat moskeijasta
- `sijainti` – tarkista koordinaatit kartalta
- `lomake_osoite` – (valinnainen) Formspree-osoite, jos lomakkeet halutaan sähköpostiin
  WhatsAppin sijaan

## Some
Instagramin uusimmat julkaisut näkyvät automaattisesti (`some.instagram`).
Jos moskeija avaa Facebook-, TikTok- tai YouTube-tilin, lisää osoite kenttiin
`some.facebook`, `some.tiktok` ja `some.youtube_kanava_id` – julkaisut näkyvät heti.

## Esikatselu omalla koneella
```sh
gem install jekyll && jekyll serve   # http://localhost:4000/Masjid-sunnah/
```
