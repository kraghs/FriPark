// Spots med info
let parkingSpots = [
  // Aarhus
  {name:"Tangkrogen", address:"Marselisborg Havnevej 4, 8000 Aarhus", lat:56.1520, lng:10.2030, note:"Stor parkeringsplads, ofte ledig om aftenen, gratis"},
  {name:"Ceres Park", address:"Stadion Allé 70, 8000 Aarhus", lat:56.1515, lng:10.2050, note:"Gratis i weekenden, tæt på stadion"},
  {name:"Donbækhaven", address:"Oddervej 6, 8000 Aarhus", lat:56.1440, lng:10.2100, note:"Gratis parkering hele dagen"},
  {name:"Kongevejen", address:"Kongevejen 97, 8000 Aarhus", lat:56.1580, lng:10.1980, note:"Gratis, god plads"},
  {name:"Marselisborg Strand", address:"Strandvejen 23, 8000 Aarhus", lat:56.1470, lng:10.2055, note:"Gratis i ydersæson"},

  // København
  {name:"Valby Syd", address:"Valby, København", lat:55.657, lng:12.499, note:"Gratis parkering 2 timer, tjek skilte"},
  {name:"Hellerup område", address:"Hellerup, København", lat:55.739, lng:12.574, note:"Gratis uden for myldretid"},
  {name:"Amager Strand", address:"Amager, København", lat:55.648, lng:12.599, note:"Gratis i visse zoner"},
  {name:"Nordvest", address:"Nordvest, København", lat:55.703, lng:12.514, note:"Gratis parkering efter kl 18"},
  {name:"Vanløse", address:"Vanløse, København", lat:55.697, lng:12.489, note:"Gratis hele dagen"},
  {name:"Valby Langgade", address:"Valby Langgade, København", lat:55.6575, lng:12.496, note:"Gratis, 2 timer max"},
  {name:"Amagerbrogade", address:"Amagerbrogade, København", lat:55.660, lng:12.590, note:"Gratis efter kl 19"},
  {name:"Østerbro / Trianglen", address:"Østerbro, København", lat:55.703, lng:12.585, note:"Gratis på sidegader"},
  {name:"Nørrebro / Jægersborggade", address:"Nørrebro, København", lat:55.686, lng:12.565, note:"Gratis i weekenden"},
  {name:"Frederiksberg / Smallegade", address:"Frederiksberg, København", lat:55.676, lng:12.523, note:"Gratis tidlig morgen"},
  {name:"Kgs. Nytorv / Indre By", address:"Indre By, København", lat:55.678, lng:12.583, note:"Tjek skilte, gratis enkelte steder"},
  {name:"Christianshavn / Torvegade", address:"Christianshavn, København", lat:55.676, lng:12.593, note:"Gratis i små sidegader"},
  {name:"Vesterbro / Sønder Boulevard", address:"Vesterbro, København", lat:55.667, lng:12.565, note:"Gratis efter kl 18"},
  {name:"Ørestad", address:"Ørestad, København", lat:55.633, lng:12.583, note:"Gratis, store parkeringspladser"},
  {name:"Amager Vest", address:"Amager Vest, København", lat:55.645, lng:12.570, note:"Gratis i ydre områder"}
];

let userLat = 55.6761;
let userLng = 12.5683;

// Map
let map = L.map('map').setView([userLat, userLng], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let userMarker;

// Geolocation
function setUserMarker(lat,lng){
  if(userMarker) map.removeLayer(userMarker);
  userMarker=L.circleMarker([lat,lng],{radius:8,color:'#ff0000',fillColor:'#ff5555',fillOpacity:1}).addTo(map).bindPopup("Du er her");
}

if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos=>{
    userLat=pos.coords.latitude;
    userLng=pos.coords.longitude;
    map.setView([userLat,userLng],12);
    setUserMarker(userLat,userLng);
    renderSpots();
  },()=>{renderSpots();});
}else{renderSpots();}

// Render spots
function renderSpots(lat=userLat,lng=userLng){
  const list=document.getElementById('parkingList');
  list.innerHTML='';
  const nearby=parkingSpots.map(s=>({...s,dist=getDistance(lat,lng,s.lat,s.lng)}))
                           .sort((a,b)=>a.dist-b.dist)
                           .slice(0,5);
  nearby.forEach(spot=>{
    const li=document.createElement('li');
    const infoBtn=document.createElement('button');
    infoBtn.textContent="Se info";
    infoBtn.addEventListener('click',()=>openInfoModal(spot));
    li.textContent=spot.name + " - " + spot.address + " ";
    li.appendChild(infoBtn);
    list.appendChild(li);
    L.marker([spot.lat,spot.lng]).addTo(map).bindPopup(spot.name);
  });
}

function getDistance(lat1,lng1,lat2,lng2){
  function toRad(x){return x*Math.PI/180;}
  const R=6371;
  const dLat=toRad(lat2-lat1);
  const dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// Info modal
function openInfoModal(spot){
  document.getElementById('infoTitle').textContent=spot.name;
  document.getElementById('infoAddress').textContent="Adresse: "+spot.address;
  document.getElementById('infoNote').textContent="Info: "+spot.note;
  document.getElementById('infoModal').classList.remove('hidden');
}
document.getElementById('closeInfoBtn').addEventListener('click',()=>document.getElementById('infoModal').classList.add('hidden'));

// Søgefunktion
document.getElementById('searchInput').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase();
  const list=document.getElementById('parkingList');
  list.innerHTML='';
  const filtered=parkingSpots.filter(s=>s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  filtered.slice(0,5).forEach(spot=>{
    const li=document.createElement('li');
    const infoBtn=document.createElement('button');
    infoBtn.textContent="Se info";
    infoBtn.addEventListener('click',()=>openInfoModal(spot));
    li.textContent=spot.name + " - " + spot.address + " ";
    li.appendChild(infoBtn);
    list.appendChild(li);
    L.marker([spot.lat,spot.lng]).addTo(map).bindPopup(spot.name);
  });
});

// Tilføj spot
document.getElementById('toggleAddBtn').addEventListener('click',()=>document.getElementById('addSpotBox').classList.toggle('hidden'));
document.getElementById('cancelAddBtn').addEventListener('click',()=>document.getElementById('addSpotBox').classList.add('hidden'));

document.getElementById('useMyLocationBtn').addEventListener('click',()=>{
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      userLat=pos.coords.latitude;
      userLng=pos.coords.longitude;
      alert("Din lokation bruges som spot!");
    });
  }else{alert("Kan ikke hente din lokation");}
});

document.getElementById('addSpotBtn').addEventListener('click',()=>{
  const name=document.getElementById('spotName').value.trim();
  const address=document.getElementById('spotAddress').value.trim();
  if(name && address){
    const lat=userLat;
    const lng=userLng;
    parkingSpots.push({name,address,lat,lng,note:"Bruger tilføjet spot"});
    document.getElementById('spotName').value='';
    document.getElementById('spotAddress').value='';
    document.getElementById('addSpotBox').classList.add('hidden');
    renderSpots();
  }else{alert("Udfyld navn og adresse");}
});
