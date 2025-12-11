// script.js — komplet version
document.addEventListener('DOMContentLoaded', () => {

  // --- STATE ---
  let parkingSpots = [];
  let userLat = 55.6761, userLng = 12.5683;
  let map = null;
  let userMarker = null;
  let reportingSpotId = null; // spot id for spot rapport

  // --- INIT MAP ---
  map = L.map('map', { preferCanvas:true }).setView([userLat, userLng], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution:'&copy; OpenStreetMap & CARTO',
    subdomains:'abcd',
    maxZoom:20
  }).addTo(map);

  // --- HELPERS ---
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function toRad(x){return x*Math.PI/180;}
  function distanceKm(lat1,lon1,lat2,lon2){
    const R=6371,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);
    const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function generateMapLinks(lat,lng,name){
    const q=encodeURIComponent(name||`${lat},${lng}`);
    return {
      apple:`https://maps.apple.com/?ll=${lat},${lng}&q=${q}`,
      google:`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    };
  }

  // --- USER LOCATION ---
  function showUserLocation(lat,lng,openPopup=false){
    if(userMarker && map.hasLayer(userMarker)) map.removeLayer(userMarker);
    userMarker=L.circleMarker([lat,lng],{
      radius:9,color:'#fff',weight:3,fillColor:'#0a84ff',fillOpacity:1
    }).addTo(map);
    if(openPopup) userMarker.bindPopup('Din position').openPopup();
  }

  // --- LOAD SPOTS ---
  async function loadSpots(){
    try{
      const resp=await axios.get('spots.json',{cache:'no-store'});
      parkingSpots=resp.data.map(s=>({
        _id:s._id||`spot_${Date.now()}_${Math.floor(Math.random()*10000)}`,
        name:s.name,
        address:s.address,
        note:s.note,
        lat:Number(s.lat),
        lng:Number(s.lng)
      }));
      parkingSpots.forEach(addSpotMarker);
      renderNearby();
    }catch(err){
      console.error('Kunne ikke hente spots.json',err);
    }
  }

  // --- ADD SPOT MARKER ---
  function addSpotMarker(spot){
    if(typeof spot.lat!=='number'||typeof spot.lng!=='number'||isNaN(spot.lat)) return;
    const marker=L.circleMarker([spot.lat,spot.lng],{
      radius:6,color:'#0bb07b',weight:2,fillColor:'#00c07b',fillOpacity:1
    }).addTo(map);

    const links=generateMapLinks(spot.lat,spot.lng,spot.name);
    const popupHtml=`
      <div class="popup-content">
        <strong>${escapeHtml(spot.name)}</strong><br/>
        ${spot.address?escapeHtml(spot.address)+'<br/>':''}
        ${spot.note?'<small>'+escapeHtml(spot.note)+'</small><br/>':''}
        <div style="margin-top:8px">
          <button class="popupInfoBtn" data-id="${spot._id}">Se info</button>
        </div>
        <div style="margin-top:8px">
          <a class="mapBtn" target="_blank" rel="noopener" href="${links.apple}">Åbn i Apple Maps</a><br/>
          <a class="mapBtn" target="_blank" rel="noopener" href="${links.google}" style="margin-top:6px;display:inline-block;">Åbn i Google Maps</a>
        </div>
      </div>`;
    marker.bindPopup(popupHtml);
    spot.marker=marker;

    marker.on('popupopen',()=>{
      const btn=document.querySelector(`.popupInfoBtn[data-id="${spot._id}"]`);
      if(btn) btn.addEventListener('click', e=>{
        e.stopPropagation();
        openInfoModal(spot);
      });
    });
  }

  // --- RENDER NEARBY ---
  function renderNearby(centerLat=userLat,centerLng=userLng){
    const listEl=document.getElementById('parkingList');
    listEl.innerHTML='';
    const items=parkingSpots
      .filter(s=>typeof s.lat==='number' && typeof s.lng==='number')
      .map(s=>Object.assign({},s,{dist:distanceKm(centerLat,centerLng,s.lat,s.lng)}))
      .sort((a,b)=>a.dist-b.dist)
      .slice(0,5);
    if(items.length===0){listEl.innerHTML='<li>Ingen parkeringspladser fundet.</li>';return;}

    items.forEach(spot=>{
      const li=document.createElement('li');
      li.innerHTML=`<div><strong>${escapeHtml(spot.name)}</strong>
        <div class="meta">${escapeHtml(spot.address||'')} • ${spot.dist.toFixed(1)} km</div></div>`;
      const btn=document.createElement('button'); btn.textContent='Se info';
      btn.addEventListener('click',e=>{e.stopPropagation();openInfoModal(spot);});
      li.appendChild(btn);
      li.addEventListener('click',()=>{map.setView([spot.lat,spot.lng],14);if(spot.marker) spot.marker.openPopup();});
      listEl.appendChild(li);
    });
  }

  // --- INFO MODAL ---
  function openInfoModal(spot){
    document.getElementById('infoTitle').textContent=spot.name||'Uden navn';
    document.getElementById('infoAddress').textContent='Adresse: '+(spot.address||'Ukendt');
    document.getElementById('infoNote').textContent=(spot.note||'')+' — Husk altid at tjekke skilte.';
    document.getElementById('infoModal').classList.remove('hidden');
    reportingSpotId=spot._id;
  }
  document.getElementById('closeInfoBtn').addEventListener('click',()=>document.getElementById('infoModal').classList.add('hidden'));

  // --- ADD SPOT MODAL ---
  const addSpotBox=document.getElementById('addSpotBox');
  document.getElementById('toggleAddBtn').addEventListener('click',()=>addSpotBox.classList.remove('hidden'));
  document.getElementById('cancelAddBtn').addEventListener('click',()=>addSpotBox.classList.add('hidden'));

  async function geocodeAddress(address){
    if(!address) return null;
    const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=dk&q=${encodeURIComponent(address)}`;
    try{const res=await fetch(url);if(!res.ok) return null;const j=await res.json();if(j && j.length) return {lat:Number(j[0].lat),lng:Number(j[0].lon),display_name:j[0].display_name};return null}catch(e){console.error('Geocode fejl',e);return null;}
  }
  async function reverseGeocode(lat,lng){try{const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);if(!res.ok) return null;const j=await res.json();return j;}catch(e){console.error('Reverse geocode fejl',e);return null;}}

  document.getElementById('useMyLocationAddBtn').addEventListener('click',()=>{
    if(!navigator.geolocation){alert('Din browser understøtter ikke geolokation');return;}
    navigator.geolocation.getCurrentPosition(async pos=>{
      const lat=pos.coords.latitude,lng=pos.coords.longitude;
      showUserLocation(lat,lng,true);
      const r=await reverseGeocode(lat,lng);
      document.getElementById('spotAddress').value=(r && r.display_name)?r.display_name:`${lat},${lng}`;
    },err=>{alert('Kunne ikke hente din lokation: '+(err.message||err.code));},{enableHighAccuracy:true,timeout:10000});
  });

  document.getElementById('addSpotBtn').addEventListener('click',async()=>{
    const name=document.getElementById('spotName').value.trim();
    const address=document.getElementById('spotAddress').value.trim();
    const note=document.getElementById('spotInfo').value.trim();
    if(!name||!address){alert('Udfyld både navn og adresse');return;}
    let loc=await geocodeAddress(address);
    let lat,lng,displayName;
    if(loc){lat=loc.lat;lng=loc.lng;displayName=loc.display_name;}else{const c=map.getCenter();lat=c.lat;lng=c.lng;displayName=address;}
    const spot={_id:`spot_${Date.now()}_${Math.floor(Math.random()*10000)}`,name,address:displayName,note,lat,lng};
    parkingSpots.push(spot);
    addSpotMarker(spot);
    renderNearby(userLat,userLng);
    addSpotBox.classList.add('hidden');
    document.getElementById('spotName').value='';
    document.getElementById('spotAddress').value='';
    document.getElementById('spotInfo').value='';
  });

  // --- MAIN LOCATION BUTTON ---
  document.getElementById('useMyLocationBtn').addEventListener('click',()=>{
    if(!navigator.geolocation){alert('Din browser understøtter ikke geolokation');return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      userLat=pos.coords.latitude;userLng=pos.coords.longitude;
      showUserLocation(userLat,userLng,true);
      map.setView([userLat,userLng],13);
      renderNearby(userLat,userLng);
    },err=>{alert('Kunne ikke hente din lokation: '+(err.message||err.code));},{enableHighAccuracy:true,timeout:10000});
  });

  // --- SEARCH ---
  const searchInput=document.getElementById('searchInput'), searchResults=document.getElementById('searchResults');
  function hideSearchResults(){searchResults.innerHTML='';searchResults.style.display='none'}
  function showSearchResults(){searchResults.style.display='block'}
  async function geoSearch(query){if(!query) return[];try{const res=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=dk&limit=6&q=${encodeURIComponent(query)}`);if(!res.ok) return[];const j=await res.json();return j}catch(e){console.error('geoSearch fejl',e);return[];}}
  let searchTimeout=null;
  searchInput.addEventListener('input',()=>{
    const qRaw=(searchInput.value||'').trim(),q=qRaw.toLowerCase();
    searchResults.innerHTML='';
    if(!q){hideSearchResults();return;}
    clearTimeout(searchTimeout);
    searchTimeout=setTimeout(async()=>{
      const geo=await geoSearch(qRaw);
      const localMatches=parkingSpots.filter(s=>(s.name||'').toLowerCase().includes(q)||(s.address||'').toLowerCase().includes(q)||(s.city||'').toLowerCase().includes(q));
      let shown=0;
      if(geo && geo.length){geo.forEach(g=>{
        const title=(g.display_name||'').split(',')[0]||'Område';
        const row=document.createElement('div');row.className='result';
        row.innerHTML=`<div><strong>${escapeHtml(title)}</strong><br><small>${escapeHtml(g.display_name||'')}</small></div>`;
        row.addEventListener('click',()=>{
          searchInput.value='';hideSearchResults();
          const lat=Number(g.lat),lon=Number(g.lon);map.setView([lat,lon],12);
          const bb=g.boundingbox?g.boundingbox.map(Number):null;
          if(bb && bb.length===4){
            const matches=parkingSpots.filter(s=>s.lat>=bb[0]&&s.lat<=bb[1]&&s.lng>=bb[2]&&s.lng<=bb[3]);
            const listEl=document.getElementById('parkingList');listEl.innerHTML='';
            if(!matches.length){const li=document.createElement('li');li.textContent='Ingen registrerede gratis parkeringspladser i dette område.';listEl.appendChild(li);}
            else matches.forEach(s=>{const li=document.createElement('li');li.innerHTML=`<div><strong>${escapeHtml(s.name)}</strong><div class="meta">${escapeHtml(s.address||'')}</div></div>`;const b=document.createElement('button');b.textContent='Se info';b.addEventListener('click',e=>{e.stopPropagation();openInfoModal(s);});li.appendChild(b);li.addEventListener('click',()=>{map.setView([s.lat,s.lng],14);if(s.marker)s.marker.openPopup();});listEl.appendChild(li);});
          }
        });searchResults.appendChild(row);shown++;
      });}
      if(localMatches && localMatches.length){localMatches.forEach(s=>{
        const row=document.createElement('div');row.className='result';
        row.innerHTML=`<div><strong>${escapeHtml(s.name)}</strong><br><small>${escapeHtml(s.address||'')}</small></div>`;
        row.addEventListener('click',()=>{hideSearchResults();searchInput.value='';map.setView([s.lat,s.lng],14);if(s.marker)s.marker.openPopup();openInfoModal(s);});
        searchResults.appendChild(row);shown++;
      });}
      if(shown>0) showSearchResults(); else hideSearchResults();
    },220);
  });
  document.addEventListener('click',e=>{if(!searchInput.contains(e.target)&&!searchResults.contains(e.target)) hideSearchResults();});

  // --- EMAILJS INIT ---
  emailjs.init('YWh--PawwwyjotIrc'); // public key

  // --- REPORT HANDLING ---
  const reportModal=document.getElementById('reportModal');
  document.getElementById('reportSiteBtn').addEventListener('click',()=>{
    reportingSpotId=null;
    reportModal.classList.remove('hidden');
    document.getElementById('reportName').value='';
    document.getElementById('reportEmail').value='';
    document.getElementById('reportMessage').value='';
  });
  document.getElementById('reportSpotBtn').addEventListener('click',()=>{reportModal.classList.remove('hidden');document.getElementById('reportName').value='';document.getElementById('reportEmail').value='';document.getElementById('reportMessage').value='';});
  document.getElementById('cancelReportBtn').addEventListener('click',()=>reportModal.classList.add('hidden'));

  document.getElementById('sendReportBtn').addEventListener('click',()=>{
    const name=document.getElementById('reportName').value.trim();
    const email=document.getElementById('reportEmail').value.trim();
    const message=document.getElementById('reportMessage').value.trim();
    if(!name||!email||!message){alert('Udfyld alle felter');return;}
    const templateParams={from_name:name,from_email:email,message:message,spot_id:reportingSpotId||'N/A'};
    const subject=reportingSpotId?'Fejl på parkeringsspot':'Fejl på hjemmesiden';
    emailjs.send('service_ccsxqgm','template_mnnib1k',Object.assign({},templateParams,{subject}))
      .then(()=>{alert('Rapport sendt!');reportModal.classList.add('hidden');})
      .catch(err=>{console.error(err);alert('Kunne ikke sende rapport.');});
  });

  // --- START ---
  loadSpots();
  window.__FriPark={parkingSpots,map};

});
