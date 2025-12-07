document.addEventListener('DOMContentLoaded', function() {

/* =========================
   parkingSpots (uændret indhold fra din version)
   ========================= */
let parkingSpots = [
  // Aarhus
  {name: "Tangkrogen", address: "Marselisborg Havnevej 4, 8000 Aarhus", lat: 56.1520, lng: 10.2030, note: "Stor parkeringsplads, ofte ledig om aftenen, gratis"},
  {name: "Ceres Park", address: "Stadion Allé 70, 8000 Aarhus", lat: 56.1515, lng: 10.2050, note: "Gratis i weekenden, tæt på stadion"},
  {name: "Donbækhaven", address: "Oddervej 6, 8000 Aarhus", lat: 56.1440, lng: 10.2100, note: "Gadeparkering, tjek skilte."},
  {name: "Marselisborg Strand", address: "Strandvejen 23, 8000 Aarhus", lat: 56.1470, lng: 10.2055, note: "Mindre p-plads ved strand, ofte gratis udenfor sæson."},

  // København (udvalg + Amager)
  {name: "Amager Strand", address: "Strandvejen 3, 2300 København S", lat: 55.6469, lng: 12.5950, note: "Større p-pladser ved stranden. Tjek skilte for zoner."},
  {name: "Amagerbrogade", address: "Amagerbrogade, 2300 København S", lat: 55.6600, lng: 12.5900, note: "Gadeparkering i dele af Amager - tidsbegrænset."},
  {name: "Ørestad P", address: "Ørestads Boulevard, 2300 København S", lat: 55.6356, lng: 12.5868, note: "Store p-pladser, ofte gratis i ydre områder."},
  {name: "Valby Langgade", address: "Valby Langgade, 2500 Valby", lat: 55.6575, lng: 12.4960, note: "Gadeparkering, tjek p-skiltning."},
  {name: "Vesterbro / Sønder Boulevard", address: "Sønder Boulevard, 1720 København", lat: 55.6670, lng: 12.5650, note: "Gratis efter visse tidspunkter - se skiltning."},
  {name: "Nørrebrogade (NV)", address: "Nørrebrogade, 2200 København", lat: 55.6920, lng: 12.5660, note: "Nørrebro gader - nogle steder tidsbegrænset/gratis i weekender."},
  {name: "Østerbro (sidegader)", address: "Østerbro, København", lat: 55.7030, lng: 12.5850, note: "Sidegader har ofte gratis pladser - tjek skilte."},
  {name: "Frederiksberg / Smallegade", address: "Smallegade, Frederiksberg", lat: 55.6760, lng: 12.5230, note: "Gratis tidlig morgen/visse områder - tjek lokalt."},
  {name: "Christianshavn / Torvegade", address: "Torvegade, 1400 København K", lat: 55.6760, lng: 12.5930, note: "Sidegader kan have gratis pladser."},

  // Helsingør
  {name: "Jernbanevej P-plads", address: "Jernbanevej, 3000 Helsingør", lat: 56.0390, lng: 12.6130, note: "P-plads nær station. Tjek skilte for timebegrænsning."},
  {name: "Stationens P-plads", address: "Stationspladsen, 3000 Helsingør", lat: 56.0395, lng: 12.6065, note: "Korttidsparkering ved stationen."},
  {name: "Nordhavnen / Mole", address: "Nordhavnsvej, 3000 Helsingør", lat: 56.0425, lng: 12.6080, note: "Kystnær p-plads, ofte gratis."},

  // Ekstra spots (fyld op med flere i København/Amager)
  {name: "Vanløse (stationsområde)", address: "Vanløse, København", lat: 55.6970, lng: 12.4890, note: "Stationsnær parkering, tjek lokalt."},
  {name: "Hellerup område", address: "Hellerup, Gentofte", lat: 55.7390, lng: 12.5740, note: "Visse gader/tidszoner gratis uden for peak."},
  {name: "Amager Vest (ydre)", address: "Amager Vest, København", lat: 55.6450, lng: 12.5700, note: "Ydre Amager: flere gratis p-pladser."},
  {name: "Valby Syd P", address: "Valbyparken, Valby", lat: 55.6560, lng: 12.4995, note: "Større p-plads tæt ved park."},
  {name: "Ørestad P2", address: "Arne Jacobsens Allé, Ørestad", lat: 55.6366, lng: 12.5902, note: "Parkeringspladser i Ørestad, ofte med gratis zoner."}
];

/* =========================
   App state (fixed: declare userMarker)
   ========================= */
let userLat = 55.6761;
let userLng = 12.5683;
let userMarker = null; // <-- vigtige linje, før setUserMarker kaldes
let map = L.map('map', { preferCanvas: true }).setView([userLat, userLng], 6);

/* =========================
   Tile layer (Carto Voyager som vi brugte)
   ========================= */
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CARTO',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);

/* =========================
   Utility functions (uændrede)
   ========================= */
function toRad(x){return x*Math.PI/180}
function distance(lat1,lng1,lat2,lng2){
  const R=6371;
  const dLat=toRad(lat2-lat1);
  const dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

/* =========================
   Ensure openInfoFromMarker exists early (stability)
   ========================= */
function openInfoFromMarker(name){

  const spot = parkingSpots.find(s => s.name === name);
  if(spot) openInfoModal(spot);
};

/* =========================
   Markers: add all spots to map as small circleMarkers
   and keep reference in spot.marker
   (kept your logic, only small popup onclick uses window.openInfoFromMarker)
   ========================= */
parkingSpots.forEach(spot=>{
  // create small clean marker
  const circle = L.circleMarker([spot.lat, spot.lng], {
    radius: 6,
    color: '#0bb07b',
    weight: 2,
    fillColor: '#00c07b',
    fillOpacity: 1
  }).addTo(map);

  // bind popup with Se info button that calls global function
  // Use double-escaped name with escapeJs to avoid quote breaks
  const popupContent = document.createElement('div');

const title = document.createElement('strong');
title.textContent = spot.name;
popupContent.appendChild(title);

const addr = document.createElement('div');
addr.innerHTML = `<small>${spot.address}</small>`;
popupContent.appendChild(addr);

const btnDiv = document.createElement('div');
btnDiv.style.marginTop = '8px';
const infoBtn = document.createElement('button');
infoBtn.textContent = 'Se info';
infoBtn.style.cssText = 'background:#007AFF;border:none;color:white;padding:6px 8px;border-radius:6px;cursor:pointer;font-weight:600';
infoBtn.addEventListener('click', ()=> openInfoModal(spot)); // ✅ Her binder vi direkte
btnDiv.appendChild(infoBtn);
popupContent.appendChild(btnDiv);

circle.bindPopup(popupContent);


  // store marker on spot
  spot.marker = circle;

  // click on marker centers and opens popup
  circle.on('click', () => {
    map.setView([spot.lat, spot.lng], 14);
    circle.openPopup();
  });
});

/* =========================
   User marker function (REPLACED: Apple-ish blue with white border)
   ========================= */
function setUserMarker(lat,lng){
  if(userMarker) map.removeLayer(userMarker);
  userMarker = L.circleMarker([lat,lng], {
    radius: 8,
    color: '#ffffff',      // white outline
    weight: 3,
    fillColor: '#007AFF',  // blue fill (Apple-like)
    fillOpacity: 1
  }).addTo(map).bindPopup("Din position");
}

/* =========================
   Render 5 nearest in list
   ========================= */
function renderSpots(lat=userLat,lng=userLng){
  const list=document.getElementById('parkingList');
  if(!list) return; // defensive
  list.innerHTML='';
  const nearby=parkingSpots.map(s=>({...s,dist:distance(lat,lng,s.lat,s.lng)}))
                           .sort((a,b)=>a.dist-b.dist)
                           .slice(0,5);
  nearby.forEach(spot=>{
    const li=document.createElement('li');
    const infoBtn=document.createElement('button');
    infoBtn.textContent="Se info";
    infoBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openInfoModal(spot); });
    li.innerHTML=`${spot.name} - ${spot.address} (${spot.dist.toFixed(1)} km) `;
    li.appendChild(infoBtn);
    li.addEventListener('click',()=>{map.setView([spot.lat,spot.lng],15); if(spot.marker) spot.marker.openPopup();});
    list.appendChild(li);
    if(!spot.marker) spot.marker=L.marker([spot.lat,spot.lng]).addTo(map).bindPopup(spot.name);
  });
}

/* =========================
   Info modal
   ========================= */
function openInfoModal(spot){
  const titleEl = document.getElementById('infoTitle');
  const addrEl = document.getElementById('infoAddress');
  const noteEl = document.getElementById('infoNote');
  if(titleEl) titleEl.textContent=spot.name;
  if(addrEl) addrEl.textContent="Adresse: "+spot.address;
  if(noteEl) noteEl.textContent="Info: "+spot.note;
  const modal = document.getElementById('infoModal');
  if(modal) modal.classList.remove('hidden');
}
const closeBtn = document.getElementById('closeInfoBtn');
if(closeBtn) closeBtn.addEventListener('click',()=>{ const m=document.getElementById('infoModal'); if(m) m.classList.add('hidden'); });

/* =========================
   Search: show matching results under search field
   ========================= */
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
if(searchInput){
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if(!q){
      if(searchResults){ searchResults.classList.add('hidden'); searchResults.innerHTML = ''; }
      return;
    }
    const matches = parkingSpots.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
    if(matches.length === 0){ if(searchResults){ searchResults.classList.add('hidden'); searchResults.innerHTML=''; } return; }
    if(searchResults) searchResults.innerHTML = '';
    matches.forEach(spot => {
      const row = document.createElement('div');
      row.className = 'result';
      row.innerHTML = `<div><strong>${escapeHtml(spot.name)}</strong><br><small>${escapeHtml(spot.address)}</small></div><div><small>${distance(userLat,userLng,spot.lat,spot.lng).toFixed(1)} km</small></div>`;
      row.addEventListener('click', () => {
        map.setView([spot.lat, spot.lng], 14);
        if(spot.marker) spot.marker.openPopup();
        openInfoModal(spot);
        if(searchResults){ searchResults.classList.add('hidden'); searchResults.innerHTML=''; }
        if(searchInput) searchInput.value = '';
      });
      if(searchResults) searchResults.appendChild(row);
    });
    if(searchResults) searchResults.classList.remove('hidden');
  });
}

/* =========================
   "Brug min lokation" (search & add)
   ========================= */
const useLocBtn = document.getElementById('useMyLocationBtn');
if(useLocBtn) useLocBtn.addEventListener('click', () => {
  if(!navigator.geolocation){ alert('Din browser understøtter ikke geolokation'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude; userLng = pos.coords.longitude;
    setUserMarker(userLat, userLng);
    map.setView([userLat, userLng], 12);
    renderSpots();
  }, ()=> alert('Kunne ikke hente din lokation'));
});

/* Bonus: small button inside ADD modal to use location */
const useLocAddBtn = document.getElementById('useMyLocationAddBtn');
if(useLocAddBtn) useLocAddBtn.addEventListener('click', () => {
  if(!navigator.geolocation){ alert('Din browser understøtter ikke geolokation'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude; userLng = pos.coords.longitude;
    const addrField = document.getElementById('spotAddress');
    if(addrField) addrField.value = `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`;
    alert('Din lokation er sat i adressefeltet. Tryk Gem for at gemme spotet her.');
  }, ()=> alert('Kunne ikke hente din lokation'));
});

/* =========================
   Add spot (geocode via Nominatim -> precise coords)
   ========================= */
const toggleAddBtn = document.getElementById('toggleAddBtn');
if(toggleAddBtn) toggleAddBtn.addEventListener('click',()=> { const b=document.getElementById('addSpotBox'); if(b) b.classList.toggle('hidden'); });

const cancelAddBtn = document.getElementById('cancelAddBtn');
if(cancelAddBtn) cancelAddBtn.addEventListener('click',()=> { const b=document.getElementById('addSpotBox'); if(b) b.classList.add('hidden'); });

const addSpotBtn = document.getElementById('addSpotBtn');
if(addSpotBtn) addSpotBtn.addEventListener('click',()=>{
  const nameEl = document.getElementById('spotName');
  const addrEl = document.getElementById('spotAddress');
  const name = nameEl ? nameEl.value.trim() : '';
  const address = addrEl ? addrEl.value.trim() : '';
  if(!name || !address){ alert('Udfyld navn og adresse'); return; }

  // If address looks like coords (lat,lng) we parse directly
  const coordMatch = address.match(/^\s*([-+]?\d+\.\d+)\s*,\s*([-+]?\d+\.\d+)\s*$/);
  if(coordMatch){
    const lat = parseFloat(coordMatch[1]), lng = parseFloat(coordMatch[2]);
    pushNewSpot(name, address, lat, lng);
    return;
  }

  // Geocode via Nominatim
  axios.get('https://nominatim.openstreetmap.org/search', { params:{ q: address, format:'json', limit:1 }})
    .then(resp => {
      if(!resp.data || resp.data.length===0){ alert('Adresse ikke fundet'); return; }
      const lat = parseFloat(resp.data[0].lat), lng = parseFloat(resp.data[0].lon);
      pushNewSpot(name, address, lat, lng);
    }).catch(()=> alert('Fejl ved geokodning'));
});

function pushNewSpot(name,address,lat,lng){
  const spot = {name,address,lat,lng,note:'Bruger-tilføjet'};
  parkingSpots.push(spot);
  // add marker
  spot.marker = L.circleMarker([lat,lng], { radius:6, color:'#0bb07b', weight:2, fillColor:'#00c07b', fillOpacity:1 }).addTo(map);
  spot.marker.bindPopup(`<strong>${escapeHtml(spot.name)}</strong><br><small>${escapeHtml(spot.address)}</small><br><div style="margin-top:8px;"><button onclick="window.openInfoFromMarker('${escapeJs(spot.name)}')" style="background:#007AFF;border:none;color:white;padding:6px 8px;border-radius:6px;cursor:pointer;font-weight:600">Se info</button></div>`);
  const nameEl = document.getElementById('spotName');
  const addrEl = document.getElementById('spotAddress');
  if(nameEl) nameEl.value=''; if(addrEl) addrEl.value='';
  const addBox = document.getElementById('addSpotBox'); if(addBox) addBox.classList.add('hidden');
  renderSpots();
}

/* =========================
   Init geolocation & initial rendering
   ========================= */
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos=>{
    userLat=pos.coords.latitude;
    userLng=pos.coords.longitude;
    setUserMarker(userLat,userLng);
    map.setView([userLat,userLng],12);
    renderSpots();
  },()=>{renderSpots();});
}else{renderSpots();}

/* =========================
   Small helpers to escape strings inserted into HTML/JS
   ========================= */
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeJs(s){ return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"'); }

}); // DOMContentLoaded end
