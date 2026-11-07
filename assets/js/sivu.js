/* Yleiset toiminnot: kielivalinta, mobiilivalikko, tulevat tapahtumat, haku,
 * some-upotukset (lupa + välilehdet) ja kalenterivienti. */
(function () {
  'use strict';
  var TZ = 'Europe/Helsinki';
  var html = document.documentElement;
  function tallenna(avain, arvo) { try { localStorage.setItem(avain, arvo); } catch (e) { /* ei tallennusta */ } }
  function lue(avain) { try { return localStorage.getItem(avain); } catch (e) { return null; } }

  /* 1. Kielivalinta (fi / en / ar). Tekstit ovat sivulla kaikilla kielillä, CSS näyttää valitun. */
  function asetaKieli(k) {
    html.lang = k;
    html.dir = k === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-kieli]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.kieli === k ? 'true' : 'false');
    });
    document.querySelectorAll('[data-placeholder-' + k + ']').forEach(function (el) {
      el.placeholder = el.getAttribute('data-placeholder-' + k);
    });
    document.dispatchEvent(new CustomEvent('kielivaihto', { detail: k }));
  }
  document.querySelectorAll('[data-kieli]').forEach(function (b) {
    b.addEventListener('click', function () { tallenna('kieli', b.dataset.kieli); asetaKieli(b.dataset.kieli); });
  });
  asetaKieli(html.lang || 'fi');

  /* 2. Mobiilivalikko */
  var valikkonappi = document.querySelector('[data-valikkonappi]');
  if (valikkonappi) {
    var valikko = document.getElementById(valikkonappi.getAttribute('aria-controls'));
    valikkonappi.addEventListener('click', function () {
      var auki = valikkonappi.getAttribute('aria-expanded') === 'true';
      valikkonappi.setAttribute('aria-expanded', auki ? 'false' : 'true');
      valikko.classList.toggle('valikko--auki', !auki);
    });
    valikko.addEventListener('click', function (e) {
      if (e.target.closest('a')) { valikkonappi.setAttribute('aria-expanded', 'false'); valikko.classList.remove('valikko--auki'); }
    });
  }

  /* 3. Piilotetaan menneet tapahtumat (sivu on staattinen, joten tämä tehdään selaimessa). */
  var tanaan = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  function paivitaTapahtumat(kaupunki) {
    document.querySelectorAll('[data-tulevat]').forEach(function (ul) {
      var maara = parseInt(ul.dataset.maara, 10) || Infinity;
      var naytetty = 0;
      ul.querySelectorAll('[data-paiva]').forEach(function (li) {
        var nayta = li.dataset.paiva >= tanaan && naytetty < maara && (!kaupunki || li.dataset.kaupunki === kaupunki);
        li.hidden = !nayta;
        if (nayta) naytetty++;
      });
      var tyhja = ul.nextElementSibling;
      if (tyhja && tyhja.hasAttribute('data-tyhja')) tyhja.hidden = naytetty > 0;
    });
  }
  paivitaTapahtumat();
  var suodatin = document.querySelector('[data-kaupunkisuodatin]');
  if (suodatin) suodatin.addEventListener('change', function () { paivitaTapahtumat(suodatin.value); });

  /* 4. Moskeijahaku hakemiston etusivulla. */
  var haku = document.querySelector('[data-haku]');
  if (haku) {
    haku.addEventListener('input', function () {
      var q = haku.value.trim().toLowerCase();
      var osumia = 0;
      document.querySelectorAll('[data-hakusanat]').forEach(function (li) {
        var nayta = !q || li.dataset.hakusanat.indexOf(q) !== -1;
        li.hidden = !nayta;
        if (nayta) osumia++;
      });
      var ei = document.querySelector('[data-ei-osumia]');
      if (ei) ei.hidden = osumia > 0;
      document.dispatchEvent(new CustomEvent('moskeijahaku', { detail: q }));
    });
  }

  /* 5. Some-upotukset: ladataan vasta luvalla, välilehti kerrallaan. */
  var LUPA = 'some-upotukset-sallittu';
  function lataaPaneeli(paneeli) {
    if (!paneeli || paneeli.dataset.ladattu) return;
    var tpl = paneeli.querySelector('template');
    if (!tpl) return;
    var sisalto = tpl.content.cloneNode(true);
    // innerHTML:llä/templatella lisätyt <script>-tagit eivät suoritu, joten ne luodaan uudelleen.
    sisalto.querySelectorAll('script').forEach(function (vanha) {
      var uusi = document.createElement('script');
      Array.prototype.forEach.call(vanha.attributes, function (a) { uusi.setAttribute(a.name, a.value); });
      uusi.textContent = vanha.textContent;
      vanha.replaceWith(uusi);
    });
    paneeli.appendChild(sisalto);
    paneeli.dataset.ladattu = '1';
  }

  document.querySelectorAll('[data-some-upotus]').forEach(function (kontti) {
    var napit = kontti.querySelectorAll('[data-valilehti]');
    var lupaEl = kontti.querySelector('[data-some-lupa]');
    var sallittu = lue(LUPA) === '1';
    var aktiivinen = napit.length ? napit[0].dataset.valilehti : null;

    function nayta() {
      napit.forEach(function (b) { b.setAttribute('aria-selected', b.dataset.valilehti === aktiivinen ? 'true' : 'false'); });
      kontti.querySelectorAll('[data-paneeli]').forEach(function (p) {
        var tama = p.dataset.paneeli === aktiivinen;
        p.hidden = !(tama && sallittu);
        if (tama && sallittu) lataaPaneeli(p);
      });
      if (lupaEl) lupaEl.hidden = sallittu;
    }
    napit.forEach(function (b) {
      b.addEventListener('click', function () { aktiivinen = b.dataset.valilehti; nayta(); });
    });
    var naytaNappi = kontti.querySelector('[data-some-nayta]');
    if (naytaNappi) naytaNappi.addEventListener('click', function () {
      var muista = kontti.querySelector('[data-some-muista]');
      if (muista && muista.checked) tallenna(LUPA, '1');
      sallittu = true;
      nayta();
    });
    nayta();
  });

  /* 6. "Lisää kalenteriin" -> ladattava .ics-tiedosto. */
  function ics(s) { return String(s || '').replace(/[\\;,]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); }
  function pvm(p) { return p.replace(/-/g, ''); }
  function aika(a) { var o = String(a).replace('.', ':').split(':'); return ('0' + o[0]).slice(-2) + ('0' + (o[1] || '0')).slice(-2) + '00'; }
  function seuraavaPaiva(p) { var d = new Date(p + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }

  document.querySelectorAll('[data-kalenteri]').forEach(function (nappi) {
    nappi.addEventListener('click', function () {
      var d = nappi.dataset;
      var loppuPv = d.paivaLoppuu || d.paiva;
      var alku, loppu;
      if (d.alkaa) {
        alku = 'DTSTART;TZID=' + TZ + ':' + pvm(d.paiva) + 'T' + aika(d.alkaa);
        loppu = 'DTEND;TZID=' + TZ + ':' + pvm(loppuPv) + 'T' + aika(d.loppuu || d.alkaa);
      } else {
        alku = 'DTSTART;VALUE=DATE:' + pvm(d.paiva);
        loppu = 'DTEND;VALUE=DATE:' + pvm(seuraavaPaiva(loppuPv));
      }
      var rivit = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Suomen moskeijat//FI',
        'BEGIN:VEVENT',
        'UID:' + pvm(d.paiva) + '-' + Math.random().toString(36).slice(2) + '@moskeijat',
        'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
        alku, loppu,
        'SUMMARY:' + ics(d.otsikko),
        'LOCATION:' + ics(d.paikka),
        'URL:' + location.href,
        'END:VEVENT', 'END:VCALENDAR'
      ];
      var blob = new Blob([rivit.join('\r\n')], { type: 'text/calendar' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tapahtuma.ics';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    });
  });

  /* 7. Lomakkeet: lähetys lomakepalveluun (data-osoite, esim. Formspree) tai sen puuttuessa
   *    valmiiksi kirjoitettuna WhatsApp- tai sähköpostiviestinä. Sivusto ei tallenna tietoja. */
  function nayttoViesti(lomake, nimi) {
    lomake.querySelectorAll('[data-viesti]').forEach(function (p) { p.hidden = p.dataset.viesti !== nimi; });
  }
  function kentanNimi(el) {
    var label = el.closest('.kentta') || el.closest('label');
    var fi = label && label.querySelector('.kentta__nimi [data-l="fi"]');
    return ((fi && fi.textContent) || el.name).replace('*', '').trim();
  }
  document.querySelectorAll('[data-lomake]').forEach(function (lomake) {
    lomake.addEventListener('submit', function (e) {
      e.preventDefault();
      lomake.classList.add('lomake--tarkistettu');
      if (!lomake.checkValidity()) {
        nayttoViesti(lomake, 'virhe');
        var eka = lomake.querySelector(':invalid');
        if (eka) eka.focus();
        return;
      }
      var rivit = [lomake.dataset.aihe, ''], nahty = {};
      Array.prototype.forEach.call(lomake.elements, function (el) {
        if (!el.name || el.name === 'hyvaksyn' || nahty[el.name]) return;
        if (el.type === 'radio') { nahty[el.name] = 1; var v = lomake.querySelector('[name="' + el.name + '"]:checked'); if (v) rivit.push(kentanNimi(el) + ': ' + v.value); return; }
        if (el.value.trim()) rivit.push(kentanNimi(el) + ': ' + el.value.trim());
      });
      var teksti = rivit.join('\n');
      var osoite = lomake.dataset.osoite;
      if (osoite) {
        nayttoViesti(lomake, 'lahetetaan');
        var data = new FormData(lomake);
        data.append('_subject', lomake.dataset.aihe);
        fetch(osoite, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (v) { if (!v.ok) throw new Error(v.status); nayttoViesti(lomake, 'kiitos'); lomake.reset(); lomake.classList.remove('lomake--tarkistettu'); })
          .catch(function () { nayttoViesti(lomake, 'lahetysvirhe'); });
      } else if (lomake.dataset.wa) {
        window.open('https://wa.me/' + lomake.dataset.wa + '?text=' + encodeURIComponent(teksti), '_blank', 'noopener');
        nayttoViesti(lomake, 'whatsapp');
      } else if (lomake.dataset.sahkoposti) {
        location.href = 'mailto:' + lomake.dataset.sahkoposti + '?subject=' + encodeURIComponent(lomake.dataset.aihe) + '&body=' + encodeURIComponent(teksti);
        nayttoViesti(lomake, 'sahkoposti');
      } else {
        nayttoViesti(lomake, 'lahetysvirhe');
      }
    });
  });

  /* 8. Kopioi-painike (esim. tilinumero) */
  document.querySelectorAll('[data-kopioi]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(b.dataset.kopioi).then(function () { b.classList.add('nappi--kopioitu'); setTimeout(function () { b.classList.remove('nappi--kopioitu'); }, 2000); });
    });
  });

  /* 9. Muokkaimella lisätyt kuvat/tiedostot (/tiedostot/...) toimimaan myös alihakemistossa. */
  var base = (window.SIVU && window.SIVU.baseurl) || '';
  if (base) {
    document.querySelectorAll('.sisalto [src^="/tiedostot/"], .sisalto [href^="/tiedostot/"]').forEach(function (el) {
      var attr = el.hasAttribute('src') ? 'src' : 'href';
      el.setAttribute(attr, base + el.getAttribute(attr));
    });
  }
})();
