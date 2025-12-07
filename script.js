let parkingSpots = [
  {name: "Tangkrogen", info: "Parkering ved strand/park — ofte gratis", lat: 56.1520, lng: 10.2030},
  {name: "Aarhus – periferi", info: "Muligt gratis gadeparkering (tjek skilte)", lat: 56.1620, lng: 10.2035},
  {name: "København – tidsbegrænset zone", info: "Gratis med p-skive (tjek skilte)", lat: 55.6850, lng: 12.5650},
  {name: "København – omegn / ydre zone", info: "Mulig billig/tidsbegrænset parkering", lat: 55.7000, lng: 12.4500},
  {name: "København – Park & Ride zone", info: "Brug tog/bus fra her", lat: 55.7400, lng: 12.5000}
];

let userLat = 55.6761; 
let userLng = 12.5683;

let map = L.map('map').setView([userLat, userLng], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Geolocation
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    userLat = position.coords.latitude;
    userLng = position.coords.longitude;
    map.setView([userLat, userLng], 12);
    L.marker([userLat, userLng]).addTo(map).bindPopup("Du er her").openPopup();
    displayNearbySpots();
  }, () => { displayNearbySpots(); });
} else {
  displayNearbySpots();
}

function distance(lat1, lng1, lat2, lng2) {
  function toRad(x){return x*Math.PI/180;}
  let R = 6371; 
  let dLat = toRad(lat2-lat1);
  let dLng = toRad(lng2-lng1);
  let a = Math.sin(dLat/2)*Math.sin(dLat/2)+
          Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*
          Math.sin(dLng/2)*Math.sin(dLng/2);
  let c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return R*c;
}

function getNearbySpots(lat, lng, maxSpots = 5, maxDist = 10) {
  return parkingSpots
    .map(s => ({...s, dist: distance(lat, lng, s.lat, s.lng)}))
    .filter(s => s.dist <= maxDist)
    .sort((a,b)=>a.dist-b.dist)
    .slice(0,maxSpots);
}

function displayNearbySpots(lat = userLat, lng = userLng) {
  const list = document.getElementById('parkingList');
  list.innerHTML = '';
  getNearbySpots(lat, lng).forEach(spot => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${spot.name}</strong><br>${spot.info}<br><em>${spot.dist.toFixed(1)} km væk</em>`;
    list.appendChild(li);
    L.marker([spot.lat, spot.lng]).addTo(map)
      .bindPopup(`${spot.name}<br>${spot.info}`);
  });
}

// Toggle tilføj spot
document.getElementById('toggleAddBtn').addEventListener('click', () => {
  const box = document.getElementById('addSpotBox');
  box.classList.toggle('hidden');
});

// Tilføj spot
document.getElementById('addSpotBtn').addEventListener('click', () => {
  const name = document.getElementById('spotName').value.trim();
  const address = document.getElementById('spotAddress').value.trim();
  if(name && address){
    // midlertidig placering tæt på bruger
    const lat = userLat + (Math.random()-0.5)*0.01;
    const lng = userLng + (Math.random()-0.5)*0.01;
    parkingSpots.push({name, info: address, lat, lng});
    displayNearbySpots();
    document.getElementById('spotName').value = '';
    document.getElementById('spotAddress').value = '';
    document.getElementById('addSpotBox').classList.add('hidden');
  } else {
    alert('Udfyld både navn og adresse');
  }
});

// Søgefunktion
document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if(e.key === 'Enter'){
    const query = e.target.value.trim();
    if(!query) return;
    // Midlertidig: vi simulerer søgning ved at centrere kort på hardcoded coords
    // Hvis du tilføjer rigtig geokodning senere (Google Maps API eller Nominatim) kan vi erstatte
    if(query.toLowerCase().includes('nørreport')){
      userLat = 55.6835;
      userLng = 12.5700;
    }
    displayNearbySpots(userLat, userLng);
    map.setView([userLat,userLng], 15);
  }
});
