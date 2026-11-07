/* Etusivun kartta: Leaflet + OpenStreetMap (ilmainen, ei API-avainta). */
(function () {
  'use strict';
  var el = document.getElementById('kartta');
  if (!el || typeof L === 'undefined') return;
  var moskeijat = window.MOSKEIJAT || [];

  L.Icon.Default.imagePath = (window.SIVU.baseurl || '') + '/assets/vendor/leaflet/images/';
  var kartta = L.map(el, { scrollWheelZoom: false }).setView([63.5, 25.5], 5);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(kartta);

  var merkit = moskeijat.map(function (m) {
    var a = document.createElement(m.url ? 'a' : 'strong');
    if (m.url) a.href = m.url;
    a.textContent = m.nimi;
    var div = document.createElement('div');
    div.appendChild(a);
    div.appendChild(document.createElement('br'));
    div.appendChild(document.createTextNode(m.osoite || m.kaupunki || ''));
    var merkki = L.marker([m.lat, m.lon]).bindPopup(div).addTo(kartta);
    merkki.hakusanat = (m.nimi + ' ' + m.kaupunki + ' ' + m.osoite).toLowerCase();
    return merkki;
  });
  if (merkit.length > 1) kartta.fitBounds(L.featureGroup(merkit).getBounds(), { padding: [30, 30], maxZoom: 11 });
  else if (merkit.length === 1) kartta.setView(merkit[0].getLatLng(), 15);

  // Haku rajaa myös karttamerkit (sivu.js lähettää tapahtuman).
  document.addEventListener('moskeijahaku', function (e) {
    var osumat = [];
    merkit.forEach(function (m) {
      var nayta = !e.detail || m.hakusanat.indexOf(e.detail) !== -1;
      if (nayta) { m.addTo(kartta); osumat.push(m); } else { m.remove(); }
    });
    if (e.detail && osumat.length) kartta.fitBounds(L.featureGroup(osumat).getBounds(), { padding: [30, 30], maxZoom: 12 });
  });
})();
