/* Rukousajat.
 * 1) Moskeijan virallinen aikataulu (CSV -> JSON sivulla), iqamah-ajat mukaan lukien.
 * 2) Jos päivälle ei ole virallista aikaa, aika lasketaan adhan-kirjastolla
 *    (https://github.com/batoulapps/adhan-js) moskeijan koordinaateista.
 * Laskuri seuraavaan rukoukseen päivittyy sekunnin välein, ja tekstit vaihtuvat kielen mukana. */
(function () {
  'use strict';
  var TZ = 'Europe/Helsinki';
  var RUKOUKSET = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var VARSINAISET = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  var CSV = { fajr: 'fajr', sunrise: 'auringonnousu', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
  var TEKSTIT = {
    fi: { fajr: 'Fajr', sunrise: 'Auringonnousu', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha', jumua: "Jumu'a", iqamah: 'Iqamah', huomenna: 'huomenna', paiva: 'Päivä', nousu: 'Nousu', klo: 'klo', locale: 'fi-FI' },
    en: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha', jumua: "Jumu'ah", iqamah: 'Iqamah', huomenna: 'tomorrow', paiva: 'Day', nousu: 'Sunrise', klo: 'at', locale: 'en-GB' },
    ar: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء', jumua: 'الجمعة', iqamah: 'الإقامة', huomenna: 'غداً', paiva: 'اليوم', nousu: 'الشروق', klo: 'الساعة', locale: 'ar-u-nu-latn' },
    so: { fajr: 'Subax', sunrise: 'Qorrax ka soo bax', dhuhr: 'Duhur', asr: 'Casar', maghrib: 'Maqrib', isha: 'Cishaa', jumua: 'Jimce', iqamah: 'Iqaamo', huomenna: 'berri', paiva: 'Taariikh', nousu: 'Qorrax', klo: 'saacadda', locale: 'so-SO' }
  };

  function kieli() { var k = document.documentElement.lang; return TEKSTIT[k] ? k : 'fi'; }
  function T() { return TEKSTIT[kieli()]; }

  var kello = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function aika(d) { return d instanceof Date && !isNaN(d) ? kello.format(d) : '–'; }
  function pvm(d, opts) {
    try { return new Intl.DateTimeFormat(T().locale, Object.assign({ timeZone: TZ }, opts)).format(d); }
    catch (e) { return new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: TZ }, opts)).format(d); }
  }
  function hijri(d) {
    var loc = T().locale.split('-u-')[0];
    try {
      return new Intl.DateTimeFormat(loc + '-u-ca-islamic-umalqura' + (kieli() === 'ar' ? '-nu-latn' : ''),
        { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    } catch (e) { return ''; }
  }

  /* --- Aikavyöhykeapurit --- */
  function osat(d) {
    var o = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(d).forEach(function (p) { o[p.type] = Number(p.value); });
    return o;
  }
  // Helsingin kalenteripäivä (paikallinen Date klo 12) – riippumatta kävijän laitteen aikavyöhykkeestä.
  function helsinginPaiva(d, lisaa) { var o = osat(d); return new Date(o.year, o.month - 1, o.day + (lisaa || 0), 12); }
  function poikkeama(d) { var o = osat(d); return (Date.UTC(o.year, o.month - 1, o.day, o.hour, o.minute) - Math.floor(d.getTime() / 60000) * 60000) / 60000; }
  // Helsingin seinäkelloaika -> Date
  function hki(paiva, hhmm) {
    var m = String(hhmm || '').match(/(\d{1,2})[.:](\d{2})/);
    if (!m) return null;
    var utc = Date.UTC(paiva.getFullYear(), paiva.getMonth(), paiva.getDate(), Number(m[1]), Number(m[2]));
    var t = utc - poikkeama(new Date(utc)) * 60000;
    var t2 = utc - poikkeama(new Date(t)) * 60000;
    return new Date(t2);
  }
  function onPerjantai(paiva) { return paiva.getDay() === 5; }
  function kk(paiva) { return paiva.getFullYear() + '-' + ('0' + (paiva.getMonth() + 1)).slice(-2); }

  function parametrit(el) {
    if (typeof adhan === 'undefined') return null;
    var tapa = adhan.CalculationMethod[el.dataset.laskentatapa] || adhan.CalculationMethod.MuslimWorldLeague;
    var p = tapa();
    p.madhab = el.dataset.madhab === 'Hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
    p.highLatitudeRule = adhan.HighLatitudeRule[el.dataset.leveysaste] || adhan.HighLatitudeRule.SeventhOfTheNight;
    try {
      var saadot = JSON.parse(el.dataset.saadot || '{}');
      Object.keys(saadot).forEach(function (k) { p.adjustments[k] = Number(saadot[k]) || 0; });
    } catch (e) { /* virheelliset säädöt ohitetaan */ }
    return p;
  }

  function Moskeija(el) {
    this.el = el;
    var data = el.querySelector('[data-aikataulu]');
    try { this.aikataulu = data ? JSON.parse(data.textContent) : {}; } catch (e) { this.aikataulu = {}; }
    try { this.iqamahOletus = JSON.parse(el.dataset.iqamahOletus || 'null'); } catch (e) { this.iqamahOletus = null; }
    var lat = parseFloat(el.dataset.lat), lon = parseFloat(el.dataset.lon);
    this.p = parametrit(el);
    this.koord = (!isNaN(lat) && !isNaN(lon) && typeof adhan !== 'undefined') ? new adhan.Coordinates(lat, lon) : null;
    this.juma = el.dataset.juma;
  }

  // Yhden päivän ajat: { fajr: Date, ..., iqamah: { fajr: Date }, virallinen: bool }
  Moskeija.prototype.ajat = function (paiva) {
    var tulos = { iqamah: {}, virallinen: false }, self = this;
    var kuukausi = this.aikataulu[kk(paiva)];
    var rivi = kuukausi && kuukausi.filter(function (r) { return Number(r.pv) === paiva.getDate(); })[0];
    if (rivi) {
      tulos.virallinen = true;
      RUKOUKSET.forEach(function (n) { tulos[n] = hki(paiva, rivi[CSV[n]]); });
      VARSINAISET.forEach(function (n) { if (rivi['iqamah_' + n]) tulos.iqamah[n] = hki(paiva, rivi['iqamah_' + n]); });
    } else if (this.koord && this.p) {
      var pt = new adhan.PrayerTimes(this.koord, paiva, this.p);
      RUKOUKSET.forEach(function (n) { tulos[n] = pt[n]; });
    } else {
      return null;
    }
    // Oletusiqamah: rukousaika + minuutit (jos virallista iqamah-aikaa ei ole)
    if (this.iqamahOletus) {
      VARSINAISET.forEach(function (n) {
        var lisa = self.iqamahOletus[n];
        if (!tulos.iqamah[n] && lisa != null && tulos[n] instanceof Date && !isNaN(tulos[n])) tulos.iqamah[n] = new Date(tulos[n].getTime() + lisa * 60000);
      });
    }
    // Perjantaina dhuhrin tilalla jumu'a, jos aika on annettu
    if (onPerjantai(paiva) && this.juma) { var j = hki(paiva, this.juma); if (j) { tulos.dhuhr = j; tulos.jumua = true; } }
    return tulos;
  };

  Moskeija.prototype.tila = function (nyt) {
    var paiva = helsinginPaiva(nyt), tanaan = this.ajat(paiva);
    if (!tanaan) return null;
    var seuraava = null, nykyinen = null;
    for (var i = 0; i < VARSINAISET.length; i++) {
      var t = tanaan[VARSINAISET[i]];
      if (t instanceof Date && !isNaN(t)) {
        if (t > nyt) { seuraava = { nimi: VARSINAISET[i], aika: t }; break; }
        nykyinen = VARSINAISET[i];
      }
    }
    if (!seuraava) {
      var huomenna = this.ajat(helsinginPaiva(nyt, 1));
      seuraava = { nimi: 'fajr', aika: huomenna && huomenna.fajr, huomenna: true };
    }
    return { tanaan: tanaan, seuraava: seuraava, nykyinen: nykyinen, jumua: tanaan.jumua };
  };

  function taulukko(self, paivat, tanaanPv) {
    var t = T();
    var h = '<table><thead><tr><th>' + t.paiva + '</th>' + RUKOUKSET.map(function (r) {
      return '<th>' + (r === 'sunrise' ? t.nousu : t[r]) + '</th>';
    }).join('') + '</tr></thead><tbody>';
    paivat.forEach(function (pv) {
      var a = self.ajat(pv);
      if (!a) return;
      var onTanaan = pv.getTime() === tanaanPv.getTime();
      h += '<tr' + (onTanaan ? ' class="tanaan"' : '') + '><th>' + pvm(pv, { weekday: 'short', day: 'numeric', month: 'numeric' }) + '</th>' +
        RUKOUKSET.map(function (r) { return '<td>' + aika(a[r]) + '</td>'; }).join('') + '</tr>';
    });
    return h + '</tbody></table>';
  }

  Moskeija.prototype.piirra = function () {
    var el = this.el, t = T(), nyt = new Date();
    var tila = this.tila(nyt);
    this.nykytila = tila;
    var lista = el.querySelector('[data-rukouslista]');
    if (!tila) { lista.innerHTML = '<li>–</li>'; return; }

    var pvmEl = el.querySelector('[data-pvm]');
    if (pvmEl) pvmEl.textContent = pvm(nyt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var hijriEl = el.querySelector('[data-hijri]');
    if (hijriEl) hijriEl.textContent = hijri(nyt);
    var laskettu = el.querySelector('[data-laskettu-huom]'), virallinen = el.querySelector('[data-virallinen-huom]');
    if (laskettu) laskettu.hidden = tila.tanaan.virallinen;
    if (virallinen) virallinen.hidden = !tila.tanaan.virallinen;

    lista.innerHTML = '';
    RUKOUKSET.forEach(function (r) {
      var li = document.createElement('li');
      var seuraava = !tila.seuraava.huomenna && r === tila.seuraava.nimi;
      li.className = 'rukous' + (r === 'sunrise' ? ' rukous--muu' : '') + (seuraava ? ' rukous--seuraava' : '');
      var nimi = document.createElement('span');
      nimi.className = 'rukous__nimi';
      nimi.textContent = (r === 'dhuhr' && tila.jumua) ? t.jumua : t[r];
      var a = document.createElement('strong');
      a.className = 'rukous__aika';
      a.textContent = aika(tila.tanaan[r]);
      li.appendChild(nimi); li.appendChild(a);
      var iq = tila.tanaan.iqamah[r];
      if (iq) {
        var i = document.createElement('span');
        i.className = 'rukous__iqamah';
        i.textContent = t.iqamah + ' ' + aika(iq);
        li.appendChild(i);
      }
      lista.appendChild(li);
    });

    var tanaanPv = helsinginPaiva(nyt);
    var viikko = el.querySelector('[data-viikko]');
    if (viikko) {
      var paivat = [];
      for (var i = 0; i < 7; i++) paivat.push(helsinginPaiva(nyt, i));
      viikko.innerHTML = taulukko(this, paivat, tanaanPv);
    }
    var kuukausi = el.querySelector('[data-kuukausi]');
    if (kuukausi) {
      var kp = [], ensimmainen = new Date(tanaanPv.getFullYear(), tanaanPv.getMonth(), 1, 12);
      for (var d = new Date(ensimmainen); d.getMonth() === ensimmainen.getMonth(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12)) kp.push(d);
      kuukausi.innerHTML = taulukko(this, kp, tanaanPv);
      var kn = el.querySelector('[data-kuukausi-nimi]');
      if (kn) kn.textContent = '· ' + pvm(nyt, { month: 'long', year: 'numeric' });
    }
  };

  function kesto(ms) {
    var sek = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(sek / 3600), m = Math.floor(sek % 3600 / 60), s = sek % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Laskuri: päivittää rukouskortin ja sivun alkuosan laskurit.
  Moskeija.prototype.paivitaLaskuri = function () {
    var nyt = new Date(), tila = this.nykytila, t = T();
    if (!tila || !(tila.seuraava.aika instanceof Date) || isNaN(tila.seuraava.aika)) return;
    if (tila.seuraava.aika <= nyt) { this.piirra(); tila = this.nykytila; if (!tila) return; }
    var s = tila.seuraava;
    var nimi = (s.nimi === 'dhuhr' && tila.jumua) ? t.jumua : t[s.nimi] + (s.huomenna ? ' (' + t.huomenna + ')' : '');
    document.querySelectorAll('[data-laskuri], [data-seuraava]').forEach(function (k) {
      k.hidden = false;
      var n = k.querySelector('[data-laskuri-nimi]'); if (n) n.textContent = nimi;
      var a = k.querySelector('[data-laskuri-aika]'); if (a) a.textContent = t.klo + ' ' + aika(s.aika);
      var j = k.querySelector('[data-laskuri-jaljella]'); if (j) j.textContent = kesto(s.aika - nyt);
      var rivi = k.querySelector('[data-nykyinen-rivi]');
      if (rivi) { rivi.hidden = !tila.nykyinen; var ny = k.querySelector('[data-nykyinen]'); if (ny && tila.nykyinen) ny.textContent = (tila.nykyinen === 'dhuhr' && tila.jumua) ? t.jumua : t[tila.nykyinen]; }
    });
  };

  function kaynnista() {
    var moskeijat = [];
    document.querySelectorAll('.rukousajat').forEach(function (el) {
      var m = new Moskeija(el);
      m.piirra();
      m.paivitaLaskuri();
      moskeijat.push(m);
    });
    if (!moskeijat.length) return;
    setInterval(function () { moskeijat[0].paivitaLaskuri(); }, 1000);
    setInterval(function () { moskeijat.forEach(function (m) { m.piirra(); }); }, 10 * 60000);
    document.addEventListener('kielivaihto', function () {
      moskeijat.forEach(function (m) { m.piirra(); m.paivitaLaskuri(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kaynnista);
  else kaynnista();
})();
