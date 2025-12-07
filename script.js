document.addEventListener('DOMContentLoaded', function() {

/* =========================
   Seed-data
   ========================= */
let parkingSpots = [
  {name:"Tangkrogen",address:"Marselisborg Havnevej 4, 8000 Aarhus",lat:56.1520,lng:10.2030,note:"Stor p-plads ved havnen",timeLimit:"Ingen tidsbegrænsning",freeHours:"Hele dagen"},
  {name:"Ceres Park",address:"Stadion Allé 70, 8000 Aarhus",lat:56.1515,lng:10.2050,note:"Gratis i weekenden",timeLimit:"Ingen tidsbegrænsning i weekenden",freeHours:"Lørdag-søndag"},
  {name:"Amager Strandpark",address:"Amager Strandvej, 2300 København S",lat:55.6469,lng:12.5950,note:"Stor p-plads ved stranden",timeLimit:"Varierer",freeHours:"Efter kl. 18"}
];

/* =========================
   App state
   ========================= */
let userLat=55.6761,userLng=12.5683;
let addLat=null, addLng=null;

const map=L.map('map').setView([userLat,userLng],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© OpenStreetMap'
}).addTo(map);

/* =========================
   Utils
   ========================= */
function toRad(x){return x*Math.PI/180}
function distance(lat1,lng1,lat2,lng2){
  const R=6371;
  const dLat=toRad(lat2-lat1);
  const dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function fmt(text){return (text||"").trim();}
function isDuplicate(a,b){
  const nameMatch=fmt(a.name).toLowerCase()===fmt(b.name).toLowerCase();
  const addrMatch=fmt(a.address).toLowerCase()===fmt(b.address).toLowerCase();
  const close=distance(a.lat,a.lng,b.lat,b.lng)<0.05;
  return (nameMatch&&addrMatch)||close;
}

/* =========================
   Markers
   ========================= */
function markerPopupHTML(spot){
  const tl=spot.timeLimit?`<p><strong>Tidsbegrænsning:</strong> ${spot.timeLimit}</p>`:"";
  const fh=spot.freeHours?`<p><strong>Gratisperioder:</strong> ${spot.freeHours}</p>`:"";
  const note=spot.note?`<p>${spot.note}</p>`:"";
  return `
    <strong>${spot.name}</strong><br>
    <small>${spot.address}</small><br>
    <details style="margin-top:8px;">
      <summary>Se info</summary>
      ${note}${tl}${fh}
      <div style="margin-top:8px;">
        <button data-open-info style="background:#007AFF;border:none;color:white;padding:6px 8px;border-radius:6px;cursor:pointer;font-weight:600">Åbn detaljer</button>
      </div>
    </details>`;
}
function addSpotToMap(spot){
  const circle=L.circleMarker([spot.lat,spot.lng],{
    radius:6,color:'#0bb07b',weight:2,
    fillColor:'#00c07b',fillOpacity:1
  }).addTo(map);
  circle.bindPopup(markerPopupHTML(spot));
  circle.on('popupopen',()=>{
    const container=circle.getPopup().getElement();
    const btn=container.querySelector('button[data-open-info]');
    if(btn){btn.addEventListener('click',(e)=>{e.preventDefault();openInfoModal(spot);});}
  });
  spot.marker=circle;
}
parkingSpots.forEach(addSpotToMap);

/* =========================
   User marker
   ========================= */
let userMarker;
function setUserMarker(lat,lng){
  if(userMarker) map.removeLayer(userMarker);
  userMarker=L.circleMarker([lat,lng],{
    radius:8,color:'#fff',weight:3,
    fillColor:'#007AFF',fillOpacity:1
  }).addTo(map).bindPopup("Din position");
}

/* =========================
   Render 5 nearest
   ========================= */
function renderSpots(lat=userLat,lng=userLng){
  const list=document.getElementById('parkingList');
  list.innerHTML='';
  const nearby=parkingSpots.map(s=>({...s,dist:distance(lat,lng,s.lat,s.lng)}))
    .sort((a,b)=>a.dist-b.dist).slice(0,5);
  nearby.forEach(spot=>{
    const li=document.createElement('li');
    const left=document.createElement('div');
    left.textContent=`${spot.name} - ${spot.address} (${spot.dist.toFixed(1)} km)`;
    const infoBtn=document.createElement('button');
    infoBtn.textContent="Se info";
    infoBtn.addEventListener('click',(e)=>{e.stopPropagation();openInfoModal(spot);});
    li.appendChild(left);li.appendChild(infoBtn);
    li.addEventListener('click',()=>{map.setView([spot.lat,spot.lng],15);spot.marker&&spot.marker.openPopup();});
    list.appendChild(li);
  });
}

/* =========================
   Info modal
   ========================= */
function openInfoModal(spot){
  document.getElementById('infoTitle').textContent=spot.name;
  document.getElementById('infoAddress').textContent="Adresse: "+spot.address;
  const details=[];
  if(spot.note) details.push(`<p>${spot.note}</p>`);
  if(spot.timeLimit) details.push(`<p><strong>Tidsbegrænsning:</strong> ${spot.timeLimit}</p>`);
  if(spot.freeHours) details.push(`<p><strong>Gratisperioder:</strong> ${spot.freeHours}</p>`);
  document.getElementById('infoDetails').innerHTML=details.join("");
  document.getElementById('infoModal').classList.remove('hidden');
}
document.getElementById('closeInfoBtn').addEventListener('click',()=>document.getElementById('infoModal').classList.add('hidden'));

/* =========================
   Geolocation init
   ========================= */
function initialRender(){renderSpots();}
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(pos=>{
    userLat=pos.coords.latitude;userLng=pos.coords.longitude;
    setUserMarker(userLat,userLng);
    map.setView([userLat,userLng],12);
    initialRender();
  },()=>{initialRender();});
}else{initialRender();}

/* =========================
   Søgning (brug min lokation)
   ========================= */
document.getElementById('useMyLocationBtn').addEventListener('click',()=>{
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      userLat=pos.coords.latitude;userLng=pos.coords.longitude;
      setUserMarker(userLat,userLng);
      map.setView([userLat,userLng],12);
      renderSpots(userLat,userLng);
    });
  }
});

/* =========================
   Tilføj parkering flow
   ========================= */
const addFab=document.getElementById('addFab');
const addModal=document.getElementById('addModal');
const addCloseBtn=document.getElementById('addCloseBtn');
const addName=document.getElementById('addName');
const addAddress=document.getElementById('addAddress');
const addUseLocation=document.getElementById('addUseLocation');
const addStatus=document.getElementById('addStatus');
const addSaveBtn=document.getElementById('addSaveBtn');

function openAddModal(){addModal.classList.remove('hidden');addName.value="";addAddress.value="";addStatus.textContent="Koordinater: ikke valgt";addLat=null;addLng=null;}
function closeAddModal(){addModal.classList.add('hidden');}
addFab.addEventListener('click',openAddModal);
addCloseBtn.addEventListener('click',closeAddModal);
document.addEventListener('keydown',(e)=>{if(e.key==="Escape") closeAddModal();});
addModal.addEventListener('click',(e)=>{if(e.target===addModal) closeAddModal();});

/* Reverse geocode */
async function reverseGeocode(lat,lng){
  const url=`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const res=await axios.get(url,{headers:{'User-Agent':'FreeParkApp/1.0'}});
  if(res.data&&res.data.display_name){return res.data.display_name;}
  return "Adresse ukendt";
}
addUseLocation.addEventListener('click',async()=>{
  addStatus.textContent="Finder lokation...";
  if(!navigator.geolocation){addStatus.textContent="
