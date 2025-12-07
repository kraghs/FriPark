let parkingSpots = [
  // Aarhus
  {name: "Tangkrogen", address: "Marselisborg Havnevej 4, 8000 Aarhus", lat: 56.1520, lng: 10.2030},
  {name: "Ceres Park", address: "Stadion Allé 70, 8000 Aarhus", lat: 56.1515, lng: 10.2050},
  {name: "Donbækhaven", address: "Oddervej 6, 8000 Aarhus", lat: 56.1440, lng: 10.2100},
  {name: "Kongevejen", address: "Kongevejen 97, 8000 Aarhus", lat: 56.1580, lng: 10.1980},
  {name: "Marselisborg Strand", address: "Strandvejen 23, 8000 Aarhus", lat: 56.1470, lng: 10.2055},

  // København
  {name: "Valby Syd", address: "Valby, København", lat: 55.657, lng: 12.499},
  {name: "Hellerup område", address: "Hellerup, København", lat: 55.739, lng: 12.574},
  {name: "Amager Strand", address: "Amager, København", lat: 55.648, lng: 12.599},
  {name: "Nordvest", address: "Nordvest, København", lat: 55.703, lng: 12.514},
  {name: "Vanløse", address: "Vanløse, København", lat: 55.697, lng: 12.489},
  {name: "Valby Langgade", address: "Valby Langgade, København", lat: 55.6575, lng: 12.496},
  {name: "Amagerbrogade", address: "Amagerbrogade, København", lat: 55.660, lng: 12.590},
  {name: "Østerbro / Trianglen", address: "Østerbro, København", lat: 55.703, lng: 12.585},
  {name: "Nørrebro / Jægersborggade", address: "Nørrebro, København", lat: 55.686, lng: 12.565},
  {name: "Frederiksberg / Smallegade", address: "Frederiksberg, København", lat: 55.676, lng: 12.523},
  {name: "Kgs. Nytorv / Indre By", address: "Indre By, København", lat: 55.678, lng: 12.583},
  {name: "Christianshavn / Torvegade", address: "Christianshavn, København", lat: 55.676, lng: 12.593},
  {name: "Vesterbro / Sønder Boulevard", address: "Vesterbro, København", lat: 55.667, lng: 12.565},
  {name: "Ørestad", address: "Ørestad, København", lat: 55.633, lng: 12.583},
  {name: "Amager Vest", address: "Amager Vest, København", lat: 55.645, lng: 12.570}
];

let userLat = 55.6761;
let userLng = 12.5683;

let map = L.map('map').setView([userLat, userLng], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

function distance(lat1,lng1,lat2,lng2){
  function toRad(x){return x*Math.PI/180;}
  let R=6371;
  let dLat=toRad(lat2-lat1);
  let dLng=toRad(lng2-lng1);
  let a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)*Math.sin(dLng/2);
  let c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return R*c;
}

function getNearbySpots(lat,lng,maxSpots=5,maxDist=15){
  return parkingSpots
    .map(s=>({...s,dist:distance(lat,lng,s.lat,s.lng)}))
    .filter(s=>s.dist<=maxDist)
    .sort((a,b)=>a.dist-b.dist)
    .slice(0,maxSpots);
}

function renderSpots(lat=userLat,lng=userLng){
  const list=document.getElementById('parkingList');
  list.innerHTML='';
  getNearbySpots(lat,lng).forEach(spot=>{
    const li=document.createElement('li');
    li.textContent=spot.name;
    li.addEventListener('click',()=>{
      if(confirm(`Se info om ${spot.name}?`)){
        alert(`P-plads: ${spot.name}\nAdresse: ${spot.address}\n⚠️ Husk at tjekke skilte – regler kan ændre sig`);
      }
    });
    list.appendChild(li);
    L.marker([spot.lat,spot.lng]).addTo(map).bindPopup(spot.name);
  });
}

// Geolocation
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos=>{
    userLat=pos.coords.latitude;
    userLng=pos.coords.longitude;
    map.setView([userLat,userLng],12);
    L.marker([userLat,userLng]).addTo(map).bindPopup("Du er her").openPopup();
    renderSpots();
  },()=>{renderSpots();});
}else{renderSpots();}

// Søgefunktion
document.getElementById('searchInput').addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  const list=document.getElementById('parkingList');
  list.innerHTML='';
  const filtered=parkingSpots.filter(s=>s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  filtered.forEach(spot=>{
    const li=document.createElement('li');
    li.textContent=spot.name;
    li.addEventListener('click',()=>{alert(`P-plads: ${spot.name}\nAdresse: ${spot.address}\n⚠️ Husk at tjekke skilte – regler kan ændre sig`);});
    list.appendChild(li);
    L.marker([spot.lat,spot.lng]).addTo(map).bindPopup(spot.name);
  });
});

// Tilføj spot
document.getElementById('toggleAddBtn').addEventListener('click',()=>{document.getElementById('addSpotBox').classList.toggle('hidden');});
document.getElementById('addSpotBtn').addEventListener('click',()=>{
  const name=document.getElementById('spotName').value.trim();
  const address=document.getElementById('spotAddress').value.trim();
  if(name && address){
    const lat=userLat+(Math.random()-0.5)*0.02;
    const lng=userLng+(Math.random()-0.5)*0.02;
    parkingSpots.push({name,address,lat,lng});
    document.getElementById('spotName').value='';
    document.getElementById('spotAddress').value='';
    document.getElementById('addSpotBox').classList.add('hidden');
    renderSpots();
  }else{alert('Udfyld både navn og adresse');}
});
document.getElementById('cancelAddBtn').addEventListener('click',()=>{document.getElementById('addSpotBox').classList.add('hidden');});
