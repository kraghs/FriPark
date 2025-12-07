document.addEventListener('DOMContentLoaded', () => {

/* =========================
   Constants and state
   ========================= */
const DK_BOUNDS = { minLat: 54.56, maxLat: 57.75, minLng: 8.07, maxLng: 15.19 };
function isInDenmark(lat, lng) {
  return lat >= DK_BOUNDS.minLat && lat <= DK_BOUNDS.maxLat &&
         lng >= DK_BOUNDS.minLng && lng <= DK_BOUNDS.maxLng;
}

// Fallback near Helsingør to reflect your location
let userLat = 56.0308;
let userLng = 12.6136;

/* =========================
   Seed spots (DK-only) – shown immediately
   ========================= */
let parkingSpots = [
  // Nordsjælland / Helsingør
  { name:"Helsingør Nordhavn", address:"Nordhavnsvej, 3000 Helsingør", lat:56.0390, lng:12.6130, note:"Gratis på udvalgte tider" },
  { name:"Kronborg Område", address:"Kronborg 2 C, 3000 Helsingør", lat:56.0385, lng:12.6201, note:"Gratis zoner tæt på slottet (tjek skiltning)" },
  { name:"Humlebæk Strand", address:"Strandvejen, 3050 Humlebæk", lat:55.9690, lng:12.5330, note:"Gratis strandparkering uden for sæson" },
  { name:"Nivå Havn", address:"Havnen 1, 2990 Nivå", lat:55.9434, lng:12.5050, note:"Ofte gratis efter 18" },
  { name:"Hørsholm Parkvej", address:"Parkvej, 2970 Hørsholm", lat:55.8750, lng:12.4980, note:"Offentlige p-pladser" },

  // København og omegn (Amager, Brøndby, Roskilde)
  { name:"Amager Strandpark", address:"Amager Strandvej, 2300 København S", lat:55.6469, lng:12.5950, note:"Stor p‑plads ved stranden" },
  { name:"Amagerbro Syd", address:"Amagerbrogade, 2300 København S", lat:55.6565, lng:12.6120, note:"Gratis på udvalgte tider (tjek skiltning)" },
  { name:"Brøndby Stadion", address:"Brøndby Stadion 1, 2605 Brøndby", lat:55.6480, lng:12.4180, note:"Gratis ved kampdage" },
  { name:"Roskilde Havn", address:"Strandgade, 4000 Roskilde", lat:55.6420, lng:12.0830, note:"Stor p‑plads nær havnen" },
  { name:"Roskilde Nord", address:"Hyrdehøj, 4000 Roskilde", lat:55.6610, lng:12.0690, note:"Gratis zoner — tjek skiltning" },

  // Fyn
  { name:"Odense Havn", address:"Havnegade, 5000 Odense", lat:55.4038, lng:10.3883, note:"Gratis efter kl. 18" },

  // Jylland
  { name:"Tangkrogen", address:"Marselisborg Havnevej 4, 8000 Aarhus", lat:56.1520, lng:10.2030, note:"Stor p‑plads ved havnen" },
  { name:"Ceres Park", address:"Stadion Allé 70, 8000 Aarhus", lat:56.1515, lng:10.2050, note:"Gratis i weekenden" },
  { name:"Esbjerg Strand", address:"Strandpromenaden, 6700 Esbjerg", lat:55.4737, lng:8.4200, note:"Offentlig p‑plads, ofte ledig" },
  { name:"Aalborg Vestby", address:"Nørresundby nær Broen, 9000 Aalborg", lat:57.0500, lng:9.9210, note:"Gratis zoner – tjek skiltning" },
  { name:"Kolding Marina", address:"Marinavej, 6000 Kolding", lat:55.4900, lng:9.4800, note:"Gratis efter 18" }
].filter(s => isInDenmark(s.lat, s.lng));

/* =========================
   Area index for search (centers + radius in km)
   ========================= */
const AREA_INDEX = [
  // København-områder
  { key:["københavn","copenhagen","kbh"], center:[55.6761,12.5683], radiusKm:20 },
  { key:["amager","københavn s","2300"], center:[55.64,12.60], radiusKm:8 },
  { key:["brøndby","2605"], center:[55.648,12.418], radiusKm:8 },
  { key:["roskilde","4000"], center:[55.6419,12.0870], radiusKm:12 },

  // Nordsjælland
  { key:["helsingør","3000"], center:[56.036,12.611], radiusKm:10 },
  { key:["humlebæk","3050"], center:[55.969,12.533], radiusKm:8 },
  { key:["nivå","2990"], center:[55.943,12.505], radiusKm:8 },
  { key:["hørsholm","2970"], center:[55.875,12.498], radiusKm:8 },

  // Fyn
  { key:["odense","5000"], center:[55.403,10.388], radiusKm:12 },

  // Jylland
  { key:["aarhus","århus","8000"], center:[56.1629,10.2039], radiusKm:12 },
  { key:["esbjerg","6700"], center:[55.476,8.459], radiusKm:12 },
  { key:["aalborg","9000"], center:[57.0488,9.9217], radiusKm:12 },
  { key:["kolding","6000"], center:[55.491,9.472], radiusKm:12 }
];

function findArea(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const area of AREA_INDEX) {
    if (area.key.some(k => q.includes(k))) return area;
  }
  return null;
}

/* =========================
   Map setup with clean Apple-like style
   ========================= */
const map = L.map('map', { preferCanvas: true }).setView([55.8, 11.0], 6);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

/* =========================
   Utilities
   ========================= */
function toRad(x) { return x * Math.PI / 180; }
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmt(text){ return (text||"").trim(); }
function isDuplicate(a,b){
  const nameMatch = fmt(a.name).toLowerCase() === fmt(b.name).toLowerCase();
  const addrMatch = fmt(a.address).toLowerCase() === fmt(b.address).toLowerCase();
  const close = distanceKm(a.lat,a.lng,b.lat,b.lng) < 0.05; // ~50 m
  return (nameMatch && addrMatch) || close;
}

/* =========================
   Marker creation – show ALL spots immediately
   ========================= */
function markerPopupHTML(spot) {
  const note = spot.note ? `<p>${spot.note}</p>` : '';
  return `
    <div>
      <strong>${spot.name}</strong><br/>
      <small>${spot.address || 'Ukendt adresse'}</small>
      ${note}
      <div style="margin-top:8px;">
        <button class="open-info-btn" style="background:#007AFF;border:none;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer;font-weight:700">Se detaljer</button>
      </div>
    </div>
  `;
}
function addSpotToMap(spot) {
  if (!isInDenmark(spot.lat, spot.lng)) return;
  const marker = L.circleMarker([spot.lat, spot.lng], {
    radius: 6,
    color: '#0bb07b',
    weight: 2,
    fillColor: '#00c07b',
    fillOpacity: 1
  }).addTo(map);
  marker.bindPopup(markerPopupHTML(spot));
  marker.on('popupopen', () => {
    const el = marker.getPopup().getElement();
    const btn = el.querySelector('.open-info-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openInfoModal(spot);
      });
    }
  });
  spot.marker = marker;
}
// Add all spots to the map immediately
parkingSpots.forEach(addSpotToMap);

/* =========================
   Fit to all DK spots initially
   ========================= */
(function fitAllDKSpotsInitially() {
  const layers = parkingSpots.map(s => s.marker).filter(Boolean);
  if (layers.length > 0) {
    const group = L.featureGroup(layers);
    map.fitBounds(group.getBounds().pad(0.12));
  } else {
    map.setView([55.8, 11.0], 6);
  }
})();

/* =========================
   User geolocation (optional, for nearby)
   ========================= */
let userMarker = null;
function setUserMarker(lat, lng) {
  if (userMarker) map.removeLayer(userMarker);
  userMarker = L.circleMarker([lat, lng], {
    radius: 8, color: '#ffffff', weight: 3, fillColor: '#007AFF', fillOpacity: 1
  }).addTo(map).bindPopup('Din position');
}
function initGeolocationAndNearby() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      if (isInDenmark(userLat, userLng)) {
        setUserMarker(userLat, userLng);
      }
      renderNearbySpotsTop5(userLat, userLng);
    }, () => {
      renderNearbySpotsTop5(userLat, userLng);
    }, { enableHighAccuracy: true, timeout: 12000 });
  } else {
    renderNearbySpotsTop5(userLat, userLng);
  }
}

/* =========================
   Nearby spots list – TOP 5, sorted by distance
   ========================= */
function renderNearbySpotsTop5(lat, lng) {
  const ul = document.getElementById('parkingList');
  const meta = document.getElementById('nearbyMeta');
  ul.innerHTML = '';

  const sortedAll = parkingSpots
    .filter(s => isInDenmark(s.lat, s.lng))
    .map(s => ({ ...s, distKm: distanceKm(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.distKm - b.distKm);

  const top5 = sortedAll.slice(0, 5);
  meta.textContent = `Afstand fra din position — viser top 5 af ${sortedAll.length} spots`;

  top5.forEach(spot => {
    const li = document.createElement('li');

    const left = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'parking-item-title';
    title.textContent = spot.name;

    const sub = document.createElement('div');
    sub.className = 'parking-item-sub';
    sub.textContent = spot.address && spot.address.trim() ? spot.address : 'Ukendt adresse';

    left.appendChild(title);
    left.appendChild(sub);

    const right = document.createElement('div');
    const badge = document.createElement('span');
    badge.className = 'distance-badge';
    badge.textContent = `${spot.distKm.toFixed(1)} km`;
    right.appendChild(badge);

    li.appendChild(left);
    li.appendChild(right);

    li.addEventListener('click', () => {
      map.setView([spot.lat, spot.lng], 14);
      spot.marker && spot.marker.openPopup();
    });

    ul.appendChild(li);
  });
}

/* =========================
   Info modal
   ========================= */
function openInfoModal(spot) {
  document.getElementById('infoTitle').textContent = spot.name;
  document.getElementById('infoAddress').textContent = `Adresse: ${spot.address || 'Ukendt adresse'}`;
  const details = [];
  if (spot.note) details.push(`<p>${spot.note}</p>`);
  document.getElementById('infoDetails').innerHTML = details.join('');
  const overlay = document.getElementById('infoModal');
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}
function closeInfoModal() {
  const overlay = document.getElementById('infoModal');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}
document.getElementById('closeInfoBtn').addEventListener('click', closeInfoModal);
document.getElementById('infoModal').addEventListener('click', (e) => {
  if (e.target.id === 'infoModal') closeInfoModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeInfoModal();
});

/* =========================
   Slick search with AREA matching
   - Tries area radius first (Amager, København, Roskilde, ...)
   - Falls back to name/address contains
   - Does not move the map while typing
   - Moves only when a result is clicked
   ========================= */
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const searchResultsBox = document.getElementById('searchResults');

function hideSearchResults() {
  searchResultsBox.classList.add('hidden');
  searchResultsBox.innerHTML = '';
}
function showNoResults() {
  searchResultsBox.innerHTML = '<div class="no-results">Ingen resultater</div>';
  searchResultsBox.classList.remove('hidden');
}
function renderSearchResults(items) {
  const ul = document.createElement('ul');
  items.forEach(spot => {
    const li = document.createElement('li');
    li.textContent = `${spot.name} — ${spot.address || 'Ukendt adresse'}`;
    li.addEventListener('click', () => {
      map.setView([spot.lat, spot.lng], 14);
      spot.marker && spot.marker.openPopup();
      searchInput.value = '';
      hideSearchResults();
      renderNearbySpotsTop5(userLat, userLng);
    });
    ul.appendChild(li);
  });
  searchResultsBox.innerHTML = '';
  searchResultsBox.appendChild(ul);
  searchResultsBox.classList.remove('hidden');
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  const qLower = q.toLowerCase();

  if (!qLower) {
    hideSearchResults();
    renderNearbySpotsTop5(userLat, userLng);
    return;
  }

  // 1) Try area match first
  const area = findArea(qLower);
  let matches = [];
  if (area) {
    const [clat, clng] = area.center;
    matches = parkingSpots.filter(s => {
      if (!isInDenmark(s.lat, s.lng)) return false;
      const d = distanceKm(clat, clng, s.lat, s.lng);
      return d <= area.radiusKm;
    });
  }

  // 2) If no area result, fall back to name/address contains
  if (matches.length === 0) {
    matches = parkingSpots.filter(s =>
      (s.name || '').toLowerCase().includes(qLower) ||
      (s.address || '').toLowerCase().includes(qLower)
    );
  }

  if (matches.length > 0) renderSearchResults(matches);
  else showNoResults();
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  hideSearchResults();
  renderNearbySpotsTop5(userLat, userLng);
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.search-wrapper');
  if (!wrapper.contains(e.target) && !searchResultsBox.contains(e.target)) {
    hideSearchResults();
  }
});
// Close dropdown with ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideSearchResults();
});

/* =========================
   Initial render
   ========================= */
(function fitAllDKSpotsInitially() {
  const layers = parkingSpots.map(s => s.marker).filter(Boolean);
  if (layers.length > 0) {
    const group = L.featureGroup(layers);
    map.fitBounds(group.getBounds().pad(0.12));
  } else {
    map.setView([55.8, 11.0], 6);
  }
})();
initGeolocationAndNearby();

});
