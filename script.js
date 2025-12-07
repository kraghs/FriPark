let parkingSpots = [
  {name: "P-plads Tangkrogen", info: "Gratis i weekender", lat: 56.1520, lng: 10.2030},
  {name: "Park & Ride", info: "Gratis 2 timer", lat: 55.6761, lng: 12.5683}
];

let map = L.map('map').setView([55.6761, 12.5683], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

function displaySpots() {
  const list = document.getElementById('parkingList');
  list.innerHTML = '';
  parkingSpots.forEach(spot => {
    const li = document.createElement('li');
    li.textContent = `${spot.name} – ${spot.info}`;
    list.appendChild(li);
    L.marker([spot.lat, spot.lng]).addTo(map)
      .bindPopup(`${spot.name}<br>${spot.info}`);
  });
}
displaySpots();

document.getElementById('addSpotBtn').addEventListener('click', () => {
  const name = document.getElementById('spotName').value;
  const info = document.getElementById('spotInfo').value;
  if(name && info){
    const lat = 55.6761 + (Math.random() - 0.5) * 0.1;
    const lng = 12.5683 + (Math.random() - 0.5) * 0.1;
    parkingSpots.push({name, info, lat, lng});
    displaySpots();
    document.getElementById('spotName').value = '';
    document.getElementById('spotInfo').value = '';
  } else {
    alert('Udfyld både navn og beskrivelse');
  }
});
