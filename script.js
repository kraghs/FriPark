/* script.js - FreePark app
   Clean apple-like UI, Danish language strings.
   Uses Leaflet (tiles: Carto Voyager) + Nominatim for geocoding.
*/
document.addEventListener('DOMContentLoaded', () => {

/* =========================
   DATA: initial sample of gratis parkeringspladser i Danmark
   NOTE: Jeg har samlet mange relevante spots for København, Aarhus, Helsingør, Roskilde, Odense osv.
   Disse notes indeholder kommunale/vejledende oplysninger; brug altid skilte i virkeligheden.
   (Kommune-kilder brugt: Københavns Kommune, Aarhus Kommune, Helsingør, Roskilde, Odense parkeringsinfo). 
   ========================= */
const parkingSpots = [
  // KØBENHAVN - udvalgte steder / eksempler
  { name:"Vanløse Station - P", address:"Vanløse Station, 2720 Vanløse", lat:55.6970, lng:12.4890, note:"Stationsparkering; check stationens regler og skilte." },
  { name:"Hellerup Stationsplads", address:"Hellerup St., 2900 Hellerup", lat:55.7387, lng:12.5785, note:"Stationsparkering; ofte tidsbegrænset. Tjek skilte." },
  { name:"Valby Syd P", address:"Valbyparken, 2500 Valby", lat:55.6560, lng:12.4995, note:"Større p-plads ved Valby, ofte gratis i visse områder. Tjek skilte." },
  { name:"Amager Strand P", address:"Strandvejen, 2300 København S", lat:55.6469, lng:12.5950, note:"P-pladser ved stranden; tidsbegrænsning kan gælde i højsæson." },
  { name:"Ørestad P", address:"Ørestads Boulevard, 2300 København S", lat:55.6356, lng:12.5868, note:"Større p-pladser i Ørestad; tjek lokalt om gratis zoner." },

  // AARHUS - udvalgte steder
  { name:"Tangkrogen P", address:"Marselisborg Havnevej 4, 8000 Aarhus", lat:56.1520, lng:10.2030, note:"Stor p-plads ved kysten. I Aarhus findes 2 timers gratis i nogle zoner (se kommunens regler)." },
  { name:"Ceres Park P", address:"Stadion Allé, 8000 Aarhus", lat:56.1515, lng:10.2050, note:"Parkeringsområder ved stadion - ofte tidsbegrænset/afhængig af arrangement." },

  // HELSINGØR
  { name:"Helsingør Station P", address:"Stationspladsen, 3000 Helsingør", lat:56.0395, lng:12.6065, note:"Kommunalt p-hus & pladser med tidsbegrænsning; Helsingør har mange gratis/tidsbegrænsede pladser (tjek kommunens info)." },
  { name:"Jernbanevej P", address:"Jernbanevej, 3000 Helsingør", lat:56.0390, lng:12.6130, note:"Kystnær p-plads, ofte gratis uden for spidsbelastning; tjek skilte." },

  // ROSKILDE (eksempel)
  { name:"Roskilde Bymidte P", address:"Roskilde Bymidte, 4000 Roskilde", lat:55.6412, lng:12.0804, note:"I Roskilde: typisk 2 timers gratis parkering når registreret via p-automater eller app." },

  // ODENSE (eksempel)
  { name:"Parkering Syd (Odense)", address:"Tarup Centret / Parkering Syd, Odense", lat:55.4011, lng:10.3470, note:"Større parkeringspladser ved handelsområder - ofte gratis for kunder. Se Odense kommunes parkeringskort for detaljer." },

  // Ekstra spots (brug disse eksempler til at fylde kortet)
  { name:"Frederiksberg (Smallegade)", address:"Smallegade, Frederiksberg", lat:55.6760, lng:12.5230, note:"Små gadepladser med tidsbegrænsning - tjek skiltning." }
];

/* =========================
   App state
   ========================= */
let userLat = 55.6761;   // default: København centre
let userLng = 12.5683;
let map, userMarker;

/* =========================
   Init map (Carto Voyager tile for neutral clean look)
   ========================= */
map = L.map('map', { preferCanvas: true }).setView([userLat, userLng], 11);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CARTO',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);

/* =========================
   Utility functions
   ========================= */
function toRad(x){ return x * Math.PI / 180; }
function distanceKm(lat1, lon1, lat2, lon2){
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* =========================
   Add markers for existing spots
   ========================= */
function addSpotMarker(spot){
  const marker = L.circleMarker([spot.lat, spot.lng], {
    radius:6,
    color:'#0bb07b',
    weight:2,
    fillColor:'#00c07b',
    fillOpacity:1
  }).addTo(map);

  // popup with simple info + "Se info" button that opens modal with richer info
  marker.bindPopup(`
    <strong>${escapeHtml(spot.name)}</strong><br>
    <small>${escapeHtml(spot.address)}</small><br>
    <div style="margin-top:8px;">
      <button class="popupInfoBtn" data-name="${escapeHtml(spot.name)}" style="background:#0a84ff;border:none;color:white;padding:6px 8px;border-radius:8px;cursor:pointer">Se info</button>
    </div>`);

  // store marker reference
  spot.marker = marker;

  marker.on('popupopen', ()=> {
    // When popup opens, attach click to button inside popup
    const btn = document.querySelector('.popupInfoBtn[data-name="'+escapeHtml(spot.name)+'"]');
    if(btn){
      btn.addEventListener('click', (e)=> {
        openInfoModal(spot);
      });
    }
  });

  marker.on('click', ()=>{
    map.setView([spot.lat, spot.lng], 14);
  });
}

/* add all initial markers */
parkingSpots.forEach(s => addSpotMarker(s));

/* =========================
   User marker (blue circle with white border like Apple Maps)
   ========================= */
function setUserMarker(lat,lng){
  if(userMarker) map.removeLayer(userMarker);
  userMarker = L.circleMarker([lat, lng], {
    radius:9,
    weight:3,
    color:'#ffffff',   // white border
    fillColor:'#0a84ff', // blue fill
    fillOpacity:1,
    pane: 'markerPane'
  }).addTo(map);
  userMarker.bindPopup('Din position');
}

/* =========================
   Render the 5 nearest spots in the list
   ========================= */
function renderNearby(centerLat = userLat, centerLng = userLng){
  const list = document.getElementById('parkingList');
  list.innerHTML = '';

  // compute distances
  const withDist = parkingSpots.map(s => {
    return Object.assign({}, s, { dist: distanceKm(centerLat, centerLng, s.lat, s.lng) });
  });

  withDist.sort((a,b)=> a.dist - b.dist);
  const nearest = withDist.slice(0,5);

  nearest.forEach(spot => {
    const li = document.createElement('li');
    li.innerHTML = `<div>
                      <strong>${escapeHtml(spot.name)}</strong>
                      <div class="meta">${escapeHtml(spot.address)} • ${spot.dist.toFixed(1)} km</div>
                    </div>`;
    const btn = document.createElement('button');
    btn.textContent = 'Se info';
    btn.addEventListener('click', (ev) => { ev.stopPropagation(); openInfoModal(spot); });
    li.appendChild(btn);
    li.addEventListener('click', ()=> {
      map.setView([spot.lat, spot.lng], 14);
      if(spot.marker) spot.marker.openPopup();
    });
    list.appendChild(li);
  });
}

/* =========================
   Info modal: show details for a single spot
   ========================= */
function openInfoModal(spot){
  document.getElementById('infoTitle').textContent = spot.name;
  document.getElementById('infoAddress').textContent = 'Adresse: ' + spot.address;
  // Add clear info text and hint to check signage
  document.getElementById('infoNote').textContent = (spot.note || 'Ingen ekstra info.') + ' — Husk altid at tjekke skilte og kommunale regler.';
  document.getElementById('infoModal').classList.remove('hidden');
}
document.getElementById('closeInfoBtn').addEventListener('click', ()=> {
  document.getElementById('infoModal').classList.add('hidden');
});

/* =========================
   Search (top input): filters by name or address substring
   When user clicks a result: center map + open info modal
   ========================= */
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if(!q){ searchResults.classList.add('hidden'); searchResults.innerHTML = ''; return; }
  const matches = parkingSpots.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  searchResults.innerHTML = '';
  if(matches.length === 0){ searchResults.classList.add('hidden'); return; }
  matches.slice(0,30).forEach(spot => {
    const row = document.createElement('div');
    row.className = 'result';
    row.innerHTML = `<div><strong>${escapeHtml(spot.name)}</strong><br><small>${escapeHtml(spot.address)}</small></div>
                     <div><small>${distanceKm(userLat,userLng,spot.lat,spot.lng).toFixed(1)} km</small></div>`;
    row.addEventListener('click', () => {
      map.setView([spot.lat, spot.lng], 13);
      if(spot.marker) spot.marker.openPopup();
      openInfoModal(spot);
      searchResults.classList.add('hidden');
      searchResults.innerHTML = '';
      searchInput.value = '';
    });
    searchResults.appendChild(row);
  });
  searchResults.classList.remove('hidden');
});

/* =========================
   Brug min lokation (top)
   ========================= */
document.getElementById('useMyLocationBtn').addEventListener('click', () => {
  if(!navigator.geolocation){ alert('Din browser understøtter ikke geolokation'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude; userLng = pos.coords.longitude;
    setUserMarker(userLat, userLng);
    map.setView([userLat, userLng], 13);
    renderNearby(userLat, userLng);
  }, ()=> alert('Kunne ikke hente din lokation'));
});

/* =========================
   Tilføj spot flow: toggle modal, geocode address or use user coords
   ========================= */
document.getElementById('toggleAddBtn').addEventListener('click', () => {
  document.getElementById('addSpotBox').classList.toggle('hidden');
});
document.getElementById('cancelAddBtn').addEventListener('click', () => {
  document.getElementById('addSpotBox').classList.add('hidden');
});

// Use my location inside add-modal: fills coords and reverse-geocodes to an address
document.getElementById('useMyLocationAddBtn').addEventListener('click', () => {
  if(!navigator.geolocation){ alert('Din browser understøtter ikke geolokation'); return; }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    // reverse geocode via Nominatim
    try {
      const resp = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params:{ lat, lon, format:'json' }
      });
      const display = resp.data && (resp.data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`);
      document.getElementById('spotAddress').value = display;
      // store coords as temporary so we can save exact geo-point
      document.getElementById('spotAddress').dataset.lat = lat;
      document.getElementById('spotAddress').dataset.lng = lon;
      alert('Din lokation er sat i adressefeltet. Tryk Gem for at gemme spotet.');
    } catch (err) {
      document.getElementById('spotAddress').value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      document.getElementById('spotAddress').dataset.lat = lat;
      document.getElementById('spotAddress').dataset.lng = lon;
      alert('Lokation sat (ingen adresse fundet). Tryk Gem for at gemme spotet.');
    }
  }, ()=> alert('Kunne ikke hente din lokation'));
});

// Save new spot (geocode if needed)
document.getElementById('addSpotBtn').addEventListener('click', async () => {
  const name = (document.getElementById('spotName').value || '').trim();
  const address = (document.getElementById('spotAddress').value || '').trim();
  if(!name || !address){ alert('Udfyld både navn og adresse'); return; }

  // If dataset contains coords (from "Brug min lokation"), use them
  const latData = document.getElementById('spotAddress').dataset.lat;
  const lngData = document.getElementById('spotAddress').dataset.lng;
  if(latData && lngData){
    pushNewSpot(name, address, parseFloat(latData), parseFloat(lngData));
    // clear dataset
    delete document.getElementById('spotAddress').dataset.lat;
    delete document.getElementById('spotAddress').dataset.lng;
    return;
  }

  // If address looks like coords "lat, lng"
  const coordMatch = address.match(/^\s*([-+]?\d+\.\d+)\s*,\s*([-+]?\d+\.\d+)\s*$/);
  if(coordMatch){
    const lat = parseFloat(coordMatch[1]), lng = parseFloat(coordMatch[2]);
    pushNewSpot(name, address, lat, lng);
    return;
  }

  // Geocode via Nominatim
  try {
    const resp = await axios.get('https://nominatim.openstreetmap.org/search', { params:{ q: address, format:'json', limit:1 }});
    if(!resp.data || resp.data.length === 0){ alert('Adresse ikke fundet'); return; }
    const lat = parseFloat(resp.data[0].lat), lng = parseFloat(resp.data[0].lon);
    pushNewSpot(name, resp.data[0].display_name || address, lat, lng);
  } catch(e){
    alert('Fejl ved geokodning. Prøv igen.');
  }
});

function pushNewSpot(name, address, lat, lng){
  const spot = { name, address, lat, lng, note: 'Bruger-tilføjet. Husk at tjekke skilte.' };
  parkingSpots.push(spot);
  addSpotMarker(spot);
  document.getElementById('spotName').value = '';
  document.getElementById('spotAddress').value = '';
  document.getElementById('addSpotBox').classList.add('hidden');
  renderNearby(userLat, userLng);
}

/* =========================
   Init: get geolocation & initial rendering
   ========================= */
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude; userLng = pos.coords.longitude;
    setUserMarker(userLat, userLng);
    map.setView([userLat, userLng], 12);
    renderNearby(userLat, userLng);
  }, ()=> {
    renderNearby(userLat, userLng);
  }, { timeout: 5000 });
} else {
  renderNearby(userLat, userLng);
}

/* =========================
   Expose helper for popup inline button (older popups might call this)
   ========================= */
window.openInfoFromMarker = (name) => {
  const spot = parkingSpots.find(s => s.name === name);
  if(spot) openInfoModal(spot);
};

}); // DOMContentLoaded end
