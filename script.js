document.addEventListener('DOMContentLoaded', function() {

let parkingSpots = [
  {name:"Tangkrogen",address:"Marselisborg Havnevej 4, 8000 Aarhus",lat:56.1520,lng:10.2030,note:"Stor p-plads ved havnen",timeLimit:"Ingen tidsbegrænsning",freeHours:"Hele dagen"},
  {name:"Ceres Park",address:"Stadion Allé 70, 8000 Aarhus",lat:56.1515,lng:10.2050,note:"Gratis i weekenden",timeLimit:"Ingen tidsbegrænsning i weekenden",freeHours:"Lørdag-søndag"},
  {name:"Amager Strandpark",address:"Amager Strandvej, 2300 København S",lat:55.6469,lng:12.5950,note:"Stor p-plads ved stranden",timeLimit:"Varierer",freeHours:"Efter kl. 18"}
];

let userLat=55.6761,userLng=12.5683;
const map=L.map('map').setView([userLat,userLng],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);

function toRad(x){return x*Math.PI/180}
function distance(lat1,lng1,lat2,lng2){
  const R=6371;
  const dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function isDuplicate(a,b){return distance(a.lat,a.lng,b.lat,b.lng)<0.05;}

function markerPopupHTML(spot){
  return `<strong>${spot.name}</strong><br><small>${spot.address}</small>`;
}
function addSpotToMap(spot){
  L.circleMarker([spot.lat,spot.lng],{radius:6,color:'#0bb07b',fillColor:'#00c07b',fillOpacity:1})
    .addTo(map).bindPopup(markerPopupHTML(spot));
}
parkingSpots.forEach(addSpotToMap);

function renderSpots(lat=userLat,lng=userLng){
  const list=document.getElementById('parkingList'); list.innerHTML='';
  parkingSpots.map(s=>({...s,dist:distance(lat,lng,s.lat,s.lng)})).sort((a,b)=>a.dist-b.dist).slice(0,5)
    .forEach(spot=>{
      const li=document.createElement('li');
      li.textContent=`${spot.name} - ${spot.address} (${
