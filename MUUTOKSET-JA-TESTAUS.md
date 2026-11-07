# Uusi sivusto: muutokset Lovable-versioon verrattuna ja testausohje

Testattava versio: **https://suomen-moskeijat.github.io/Masjid-sunnah/uusi-v1/**
(Vertailuksi Lovable-versio: https://masjidsunna.lovable.app/)

Testaa mieluiten puhelimella. Kokeile jokaista kohtaa vähintään suomeksi ja arabiaksi.
Merkitse ylös, mikä ei toimi tai näyttää oudolta (sivu, kieli, puhelinmalli, kuvakaappaus).

---

## 1. Mitä on uutta tai muuttunut Lovableen verrattuna

**Selvimmät erot Lovableen** (tarkistettu molemmista sivuista):
- **Rukousajat suoraan moskeijan Masjidboxista.** Viralliset adhan- ja iqamah-ajat (perjantaina Jumuah) päivittyvät automaattisesti kerran tunnissa. Kun moskeija muuttaa aikoja Masjidboxissa, sivu seuraa perässä.
- **Instagram-julkaisut näkyvät oikeasti.** Lovablessa lukee "Uusimpien julkaisujen automaattinen näyttö otetaan käyttöön…"; uudessa sivussa uusimmat julkaisut haetaan automaattisesti ja kuvan saa auki isona.
- **Lomakkeet:** lasten opetukseen ilmoittautuminen ja Kysy moskeijalta.
- **Ylläpito:** ilmainen (GitHub Pages), sisältöä voi muokata selaimessa Pages CMS:llä ilman koodia, ja sama pohja sopii kaikille moskeijoille.

**Uuden sivun ominaisuudet:**

| Ominaisuus | Uudessa sivussa |
|---|---|
| Seuraava rukous (etusivu ja rukousajat) | Rukous ja kellonaika isolla, laskuri, iqamah, edistymispalkki; illalla "huomenna"-merkki, perjantaina Jumu'a |
| Rukousaikasivu | Päivän adhan + iqamah, auringonnousu, hijri-päivämäärä, kuukausitaulukko selattavissa kuukausi kerrallaan |
| Instagram | Uusimmat julkaisut automaattisesti, iso näkymä nuolilla, video- ja albumimerkit |
| Lasten opetus | Ilmoittautumislomake (huoltaja, lapsi, opetuksen tyyppi, lisätiedot, suostumus) |
| Yhteystiedot | Osoite, puhelin, reittiohjeet, WhatsApp, kartta ja Kysy moskeijalta -lomake |
| WhatsApp-nappi | Katoaa alas vieritettäessä, palaa ylös vieritettäessä, ei peitä rukousaikoja eikä lomakkeita |
| Kielet | FI / EN / AR / SO, arabia oikealta vasemmalle, valinta muistetaan |
| Puhelimen valikko | Kaikki sivut + Lahjoita, WhatsApp ja Soita |
| Tapahtumat | Menneet piiloutuvat automaattisesti; tyhjänä ohjaus Instagramiin |
| Ulkoasu | Lovablen värit ja tausta; kuvakkeet Phosphor Icons -sarjasta |

---

## 2. Testauslista

### Etusivu – /uusi-v1/
- [ ] Ylhäällä: Malmi, Helsinki -merkki, otsikko, esittelyteksti.
- [ ] **Seuraava rukous** -kortti: oikea rukous ja kellonaika, laskuri vähenee sekunneittain, iqamah näkyy (esim. Isha → Iqamah 20:00).
- [ ] Illalla Ishan jälkeen kortissa lukee **Fajr + "huomenna"**.
- [ ] Perjantaina keskipäivällä rukouksen nimi on **Jumu'a**.
- [ ] Ajat täsmäävät moskeijan Masjidbox-näytön kanssa: https://masjidbox.com/prayer-times/masjid-sunnah-helsinki
- [ ] **Koko aikataulu** vie rukousaikasivulle.
- [ ] **Ilmoita lapsesi opetukseen** ja **Tutustu toimintaamme** -napit toimivat.
- [ ] Toimintamme-kortit vievät oikeille sivuille.
- [ ] Instagram-kuvat näkyvät; kuvan napautus avaa sen isona, nuolilla selaus, sulkeminen ruksista.
- [ ] Lahjoita-osio ja Tervetuloa käymään -osio (osoite, Reittiohjeet, WhatsApp, kartta).

### WhatsApp-nappi
- [ ] Näkyy heti etusivulle tultaessa oikeassa alakulmassa.
- [ ] Katoaa, kun vierität alas; palaa, kun vierität ylös.
- [ ] Ei näy rukousaikataulun, lomakkeiden, yhteystietojen eikä alapalkin kohdalla.
- [ ] Napautus avaa WhatsAppin numeroon **+358 45 278 4866**.

### Kielet
- [ ] Yläpalkin kielivalikosta FI / EN / AR / SO: kaikki tekstit vaihtuvat.
- [ ] Arabiaksi sivu kääntyy oikealta vasemmalle (valikko, nuolet, kortit).
- [ ] Valittu kieli säilyy, kun siirryt sivulta toiselle ja kun avaat sivun uudelleen.

### Valikko (puhelin)
- [ ] ☰-nappi avaa valikon, ✕ sulkee sen.
- [ ] Kaikki linkit toimivat; Lahjoita, WhatsApp ja Soita -napit toimivat.

### Rukousajat – /uusi-v1/rukousajat/
- [ ] Seuraava rukous -kortti kuten etusivulla.
- [ ] Päivän taulukko: adhan, iqamah, auringonnousu, hijri-päivämäärä; seuraava rukous korostettuna.
- [ ] Kuukausitaulukko: tämä päivä korostettuna, nuolista edellinen/seuraava kuukausi.

### Opetus ja palvelut – /uusi-v1/palvelut/ ja lasten opetus – /uusi-v1/palvelut/lasten-opetus/
- [ ] Palvelut näkyvät kuvakkeineen.
- [ ] **Ilmoittautumislomake**: pakolliset kentät huomauttavat, jos ne jäävät tyhjiksi; opetuksen tyypin valinta; suostumus.
- [ ] Lähetä ilmoittautuminen → **avaa WhatsAppin valmiiksi täytetyllä viestillä** (sähköpostilähetys otetaan käyttöön, kun moskeija antaa lomakeosoitteen).

### Yhteystiedot – /uusi-v1/yhteystiedot/
- [ ] Osoite, puhelin, Reittiohjeet (avaa kartan), WhatsApp, kartta näkyy.
- [ ] **Kysy moskeijalta** -lomake: sama toiminta kuin ilmoittautumisessa.

### Muut sivut
- [ ] Meistä – /uusi-v1/meista/
- [ ] Tapahtumat – /uusi-v1/tapahtumat/ (nyt tyhjä → ohjaus Instagramiin)
- [ ] Lahjoita – /uusi-v1/lahjoita/
- [ ] Tietosuoja – /uusi-v1/tietosuoja/ (linkki alapalkissa)

### Yleistä
- [ ] Mikään sivu ei vieritä sivuttain puhelimella.
- [ ] Tietokoneella ylävalikko näkyy vaakarivinä, sivut asettuvat leveämmin.

---

## 3. Vielä puuttuu (moskeijalta tarvittavat tiedot)

- **Lahjoitustiedot** (tilinumero / MobilePay) – lahjoitussivulla lukee nyt "lisätään pian".
- **Sähköpostiosoite ja lomakeosoite** (esim. Formspree), jotta lomakkeet lähtevät sähköpostiin eivätkä vain WhatsAppiin.
- **Reaaliaikainen rukousaikayhteys**: nyt ajat päivittyvät kerran tunnissa; reaaliaikainen yhteys suunnitellaan myöhemmin.
- **Julkaisu**: testiversio ei näy hakukoneissa (noindex). Kun versio hyväksytään, siitä tehdään pääsivu.
