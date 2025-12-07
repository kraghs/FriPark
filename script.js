// efter du har sat userLat, userLng ved geolocation

function getNearbySpots(maxSpots = 5, maxDist = 10) {
  return parkingSpots
    .map(s => {
      const d = distance(userLat, userLng, s.lat, s.lng);
      return {...s, dist: d};
    })
    .filter(s => s.dist <= maxDist)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxSpots);
}

function displayNearbySpots() {
  const nearby = getNearbySpots();
  const list = document.getElementById('parkingList');
  list.innerHTML = '';
  nearby.forEach(spot => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${spot.name}</strong><br>${spot.info}<br><em>${spot.dist.toFixed(1)} km væk</em>`;
    list.appendChild(li);
    L.marker([spot.lat, spot.lng]).addTo(map)
      .bindPopup(`${spot.name}<br>${spot.info}`);
  });
}
