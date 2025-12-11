// Erstat hele din script.js med denne fil — én komplet, selvstændig implementering.

document.addEventListener('DOMContentLoaded', () => {
  // --- Konfiguration / tilstand
  let parkingSpots = []; // array med objekter: {name,address,city,lat,lng,note,...}
  let map = null;
  let userMarker = null;

  // --- Hjælpere
  function logErr(...args){ console.error('[FriPark]', ...args); }
  function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function toRad(x){ return x * Math.PI / 180; }
  function distanceKm(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // --- Map init
  try {
    const startLat = 55.6761, startLng = 12.5683;
    map = L.map('map', { preferCanvas: true }).setView([startLat, startLng], 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap & CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
  } catch (e) {
    logErr('Fejl ved initialisering af kortet:', e);
    alert('Kortet kunne ikke initialiseres. Se konsollen for detaljer.');
    return;
  }


const parkingListEl = document.getElementById('parkingList'); const searchInput = document.getElementById('searchInput'); const searchResults = document.getElementById('searchResults');

  

  // --- Indlæs spots (spots.json)
  async function loadSpots(){
    try {
      const res = await fetch('spots.json', {cache: "no-store"});
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      // normaliser lat/lng til tal
      parkingSpots = data.map(s => {
        const lat = Number(s.lat);
        const lng = Number(s.lng);
        return Object.assign({}, s, { lat: isFinite(lat) ? lat : null, lng: isFinite(lng) ? lng : null });
      });
      renderAllMarkers();
      renderNearby(); // initial nærmeste
    } catch (err) {
      logErr('Kunne ikke hente spots.json:', err);
      // Vis besked i UI
      const li = document.createElement('li');
      li.textContent = 'Fejl: kunne ikke hente spots.json (tjek netværk/konsol).';
      parkingListEl.appendChild(li);
    }
  }

  // --- Markers
  function renderAllMarkers(){
    // fjern eksisterende markers (hvis nogen)
    parkingSpots.forEach(s => { if (s.marker && map.hasLayer(s.marker)) map.removeLayer(s.marker); s.marker = null; });

    parkingSpots.forEach(s => {
      if (typeof s.lat !== 'number' || typeof s.lng !== 'number' || isNaN(s.lat) || isNaN(s.lng)) return;
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 6,
        color: '#0bb07b',
        weight: 2,
        fillColor: '#00c07b',
        fillOpacity: 1
      }).addTo(map);

      const popupHtml = `<strong>${escapeHtml(s.name)}</strong><br>${escapeHtml(s.address || '')}
        <div style="margin-top:8px"><button class="popupInfoBtn" data-id="${escapeHtml(s.name)}">Se info</button></div>`;
      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        // tilføj event til knap i popup — brug event delegation ved id
        const btn = document.querySelector('.popupInfoBtn[data-id="'+CSSescape(s.name)+'"]') || document.querySelector('.popupInfoBtn');
        if (btn) {
          btn.onclick = () => openInfoModal(s);
        }
      });
      s.marker = marker;
    });
  }

  // CSS escape helper for attribute selector
  function CSSescape(str){
    return (str+'').replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1');
  }

  // --- Nærmeste liste
  function renderNearby(centerLat = 55.6761, centerLng = 12.5683){
    parkingListEl.innerHTML = '';
    const list = parkingSpots
      .filter(s => typeof s.lat === 'number' && typeof s.lng === 'number')
      .map(s => ({...s, dist: distanceKm(centerLat, centerLng, s.lat, s.lng)}))
      .sort((a,b) => a.dist - b.dist)
      .slice(0, 5);

    if (list.length === 0) {
      const li = document.createElement('li'); li.textContent = 'Ingen pladser tilgængelige.'; parkingListEl.appendChild(li); return;
    }

    list.forEach(spot => {
      const li = document.createElement('li');
      li.innerHTML = `<div>
        <strong>${escapeHtml(spot.name)}</strong>
        <div class="meta">${escapeHtml(spot.address || '')} • ${spot.dist.toFixed(1)} km</div>
      </div>`;
      const btn = document.createElement('button'); btn.textContent = 'Se info';
      btn.addEventListener('click', e => { e.stopPropagation(); openInfoModal(spot); });
      li.appendChild(btn);
      li.addEventListener('click', () => {
        if (spot.marker) { spot.marker.openPopup(); map.setView([spot.lat, spot.lng], 14); }
      });
      parkingListEl.appendChild(li);
    });
  }

  // --- Info modal
  function openInfoModal(spot){
    const modal = document.getElementById('infoModal');
    document.getElementById('infoTitle').textContent = spot.name || 'Uden navn';
    document.getElementById('infoAddress').textContent = 'Adresse: ' + (spot.address || 'Ukendt');
    document.getElementById('infoNote').textContent = (spot.note || spot.freeInfo || '') + ' — Husk altid at tjekke skilte.';
    modal.classList.remove('hidden');
  }
  const closeInfoBtn = document.getElementById('closeInfoBtn');
  if (closeInfoBtn) closeInfoBtn.addEventListener('click', () => document.getElementById('infoModal').classList.add('hidden'));

  // --- Geolocation (brug min lokation)
  const useMyLocationBtn = document.getElementById('useMyLocationBtn');
  if (useMyLocationBtn){
    useMyLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) { alert('Din browser understøtter ikke geolokation'); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        if (userMarker && map.hasLayer(userMarker)) map.removeLayer(userMarker);
        userMarker = L.circleMarker([lat,lng], { radius:9, weight:3, color:'#fff', fillColor:'#0a84ff', fillOpacity:1 }).addTo(map);
        userMarker.bindPopup('Din position').openPopup();
        map.setView([lat,lng], 13);
        renderNearby(lat, lng);
      }, err => {
        logErr('Geolocation fejl:', err);
        alert('Kunne ikke hente lokation: ' + (err.message || err.code));
      }, { enableHighAccuracy:true, timeout:10000 });
    });
  }

  // --- Søg (Nominatim + lokal tekstmatch)
  async function geoSearch(query){
    if (!query) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=dk&limit=8&q=${encodeURIComponent(query)}`;
    try {
      const res = await fetch(url);
      if(!res.ok) { logErr('Nominatim svarede ikke ok:', res.status); return []; }
      const json = await res.json();
      return json;
    } catch (e) {
      logErr('geoSearch fejl:', e);
      return [];
    }
  }

  function filterSpotsInBBox(bbox){
    // boundingbox = [south, north, west, east]
    const south = Number(bbox[0]), north = Number(bbox[1]), west = Number(bbox[2]), east = Number(bbox[3]);
    const minLat = south, maxLat = north, minLon = west, maxLon = east;
    return parkingSpots.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number' && s.lat >= minLat && s.lat <= maxLat && s.lng >= minLon && s.lng <= maxLon);
  }

  function renderSearchResults(geoResults, spotResults){
    searchResults.innerHTML = '';
    if ((!geoResults || geoResults.length === 0) && (!spotResults || spotResults.length === 0)) {
      searchResults.classList.add('hidden');
      return;
    }

    if (geoResults && geoResults.length){
      geoResults.forEach(g => {
        const row = document.createElement('div');
        row.className = 'result';
        const title = (g.display_name || '').split(',')[0];
        row.innerHTML = `<div><strong>${escapeHtml(title)}</strong><br><small>${escapeHtml(g.display_name)}</small></div>`;
        row.addEventListener('click', () => {
          searchInput.value = '';
          searchResults.classList.add('hidden');
          const lat = Number(g.lat), lon = Number(g.lon);
          map.setView([lat, lon], 13);

          // Vis spots i bbox i list
          const matches = filterSpotsInBBox(g.boundingbox);
          parkingListEl.innerHTML = '';
          if (!matches.length) {
            const li = document.createElement('li'); li.textContent = 'Ingen registrerede gratis parkeringspladser i dette område.'; parkingListEl.appendChild(li);
          } else {
            matches.forEach(spot => {
              const li = document.createElement('li');
              li.innerHTML = `<div><strong>${escapeHtml(spot.name)}</strong><div class="meta">${escapeHtml(spot.address || '')}</div></div>`;
              const btn = document.createElement('button'); btn.textContent = 'Se info';
              btn.addEventListener('click', e => { e.stopPropagation(); openInfoModal(spot); });
              li.appendChild(btn);
              li.addEventListener('click', () => { if (spot.marker) { spot.marker.openPopup(); map.setView([spot.lat, spot.lng], 14); } });
              parkingListEl.appendChild(li);
            });
          }
        });
        searchResults.appendChild(row);
      });
    }

    if (spotResults && spotResults.length){
      spotResults.forEach(s => {
        const row = document.createElement('div');
        row.className = 'result';
        row.innerHTML = `<div><strong>${escapeHtml(s.name)}</strong><br><small>${escapeHtml(s.address || '')}</small></div>`;
        row.addEventListener('click', () => {
          searchInput.value = '';
          searchResults.classList.add('hidden');
          if (s.marker) s.marker.openPopup();
          map.setView([s.lat, s.lng], 14);
          openInfoModal(s);
        });
        searchResults.appendChild(row);
      });
    }

    searchResults.classList.remove('hidden');
  }

  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    const q = (searchInput.value || '').trim();
    searchResults.innerHTML = '';
    if (!q) { searchResults.classList.add('hidden'); return; }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const geo = await geoSearch(q);
      const lower = q.toLowerCase();
      const localMatches = parkingSpots.filter(s =>
        (s.name||'').toLowerCase().includes(lower) ||
        (s.address||'').toLowerCase().includes(lower) ||
        (s.city||'').toLowerCase().includes(lower)
      );
      renderSearchResults(geo, localMatches);
    }, 220);
  });

  // klik udenfor -> luk
  document.addEventListener('click', e => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) searchResults.classList.add('hidden');
  });

  // --- Start
  loadSpots();

  // Gem en sikkerhedskopi i console hvis nødvendigt
  window.__FriPark = { parkingSpots, map };

});
