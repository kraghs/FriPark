 // script.js — komplet med rapport funktionalitet
document.addEventListener('DOMContentLoaded', () => {
  let parkingSpots = [];
  let userLat=55.6761,userLng=12.5683;
  let map = L.map('map',{preferCanvas:true}).setView([userLat,userLng],11);
  let userMarker;

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
    attribution:'&copy; OpenStreetMap & CARTO',subdomains:'abcd',maxZoom:20
  }).addTo(map);

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function toRad(x){return x*Math.PI/180;}
  function distanceKm(lat1,lon1,lat2,lon2){const R=6371,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
  function generateMapLinks(lat,lng,name){const q=encodeURIComponent(name||`${lat},${lng}`);return {apple:`https://maps.apple.com/?ll=${lat},${lng}&q=${q}`,google:`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`};}

  function showUserLocation(lat,lng,openPopup=false){if(userMarker&&map.hasLayer(userMarker))map.removeLayer(userMarker);userMarker=L.circleMarker([lat,lng],{radius:9,color:'#fff',weight:3,fillColor:'#0a84ff',fillOpacity:1}).addTo(map);if(openPopup)userMarker.bindPopup('Din position').openPopup();}

  async function loadSpots(){
    try{
      const resp = await axios.get('spots.json',{cache:'no-store'});
      parkingSpots = resp.data.map(s=>Object.assign({},s,{lat:Number(s.lat),lng:Number(s.lng),_id:s._id||(`spot_${Date.now()}_${Math.floor(Math.random()*10000)}`)}));
      parkingSpots.forEach(addSpotMarker);
      renderNearby();
    }catch(err){console.error('Kunne ikke hente spots.json',err);}
  }

  function addSpotMarker(spot){
    if(typeof spot.lat!=='number'||typeof spot.lng!=='number'||isNaN(spot.lat)||isNaN(spot.lng))return;
    const marker=L.circleMarker([spot.lat,spot.lng],{radius:6,color:'#0bb07b',weight:2,fillColor:'#00c07b',fillOpacity:1}).addTo(map);
    const links = generateMapLinks(spot.lat,spot.lng,spot.name);
    const popupHtml=`<div class="popup-content"><strong>${escapeHtml(spot.name)}</strong><br/>${spot.address?escapeHtml(spot.address)+'<br/>':''}${spot.note?'<small>'+escapeHtml(spot.note)+'</small><br/>':''}<div style="margin-top:8px"><button class="popupInfoBtn" data-id="${spot._id}">Se info</button></div><div style="margin-top:8px"><a class="mapBtn" target="_blank" rel="noopener" href="${links.apple}">Åbn i Apple Maps</a><br/><a class="mapBtn" target="_blank" rel="noopener" href="${links.google}" style="margin-top:6px; display:inline-block;">Åbn i Google Maps</a></div></div>`;
    marker.bindPopup(popupHtml);
    spot.marker=marker;
    marker.on('popupopen',()=>{
      const btn=document.querySelector(`.popupInfoBtn[data-id="${spot._id}"]`);
      if(btn)btn.addEventListener('click',e=>{e.stopPropagation();openInfoModal(spot);});
    });
  }

  function renderNearby(centerLat=userLat,centerLng=userLng){
    const listEl=document.getElementById('parkingList');listEl.innerHTML='';
    parkingSpots.map(s=>({...s,dist:distanceKm(centerLat,centerLng,s.lat,s.lng)})).sort((a,b)=>a.dist-b.dist).slice(0,5).forEach(spot=>{
      const li=document.createElement('li');li.innerHTML=`<div><strong>${escapeHtml(spot.name)}</strong><div class="meta">${escapeHtml(spot.address||'')} • ${spot.dist.toFixed(1)} km</div></div>`;
      const btn=document.createElement('button');btn.textContent='Se info';btn.addEventListener('click',e=>{e.stopPropagation();openInfoModal(spot);});
      li.appendChild(btn);
      li.addEventListener('click',()=>{map.setView([spot.lat,spot.lng],14);if(spot.marker)spot.marker.openPopup();});
      listEl.appendChild(li);
    });
  }

  function openInfoModal(spot){
    document.getElementById('infoTitle').textContent=spot.name||'Uden navn';
    document.getElementById('infoAddress').textContent='Adresse: '+(spot.address||'Ukendt');
    document.getElementById('infoNote').textContent=(spot.note||'')+' — Husk altid at tjekke skilte.';
    document.getElementById('infoModal').classList.remove('hidden');
    window.currentSpot=spot;
  }

  document.getElementById('closeInfoBtn').addEventListener('click',()=>document.getElementById('infoModal').classList.add('hidden'));

  const addSpotBox=document.getElementById('addSpotBox');
  document.getElementById('toggleAddBtn').addEventListener('click',()=>addSpotBox.classList.remove('hidden'));
  document.getElementById('cancelAddBtn').addEventListener('click',()=>addSpotBox.classList.add('hidden'));

  document.getElementById('useMyLocationBtn').addEventListener('click',()=>{
    if(!navigator.geolocation){alert('Din browser understøtter ikke geolokation');return;}
    navigator.geolocation.getCurrentPosition(pos=>{userLat=pos.coords.latitude;userLng=pos.coords.longitude;showUserLocation(userLat,userLng,true);map.setView([userLat,userLng],13);renderNearby(userLat,userLng);});
  });

  document.getElementById('addSpotBtn').addEventListener('click',async()=>{
    const name=document.getElementById('spotName').value.trim();
    const address=document.getElementById('spotAddress').value.trim();
    const note=document.getElementById('spotInfo').value.trim();
    if(!name||!address){alert('Udfyld både navn og adresse');return;}
    const loc=map.getCenter();
    const spot={_id:`spot_${Date.now()}_${Math.floor(Math.random()*10000)}`,name,address,note,lat:loc.lat,lng:loc.lng};
    parkingSpots.push(spot);addSpotMarker(spot);renderNearby(userLat,userLng);addSpotBox.classList.add('hidden');document.getElementById('spotName').value='';document.getElementById('spotAddress').value='';document.getElementById('spotInfo').value='';
  });

  // Rapport funktion
  const reportModal=document.getElementById('reportModal');
  const reportName=document.getElementById('reportName');
  const reportEmail=document.getElementById('reportEmail');
  const reportMessage=document.getElementById('reportMessage');
  let reportType='site'; // 'site' eller 'spot'

  function openReportModal(type){
    reportType=type;
    reportModal.classList.remove('hidden');
    reportName.value='';reportEmail.value='';reportMessage.value='';
  }
  document.getElementById('cancelReportBtn').addEventListener('click',()=>reportModal.classList.add('hidden'));
  document.getElementById('reportSiteBtn').
