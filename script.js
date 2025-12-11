// Sample data
let spots = [
  {
    id: "svanemollen",
    name: "Svanemøllen Station P",
    address: "Strandboulevarden 150, 2100 København Ø",
    facts: ["Fri parkering efter 18:00", "Gratis søn- og helligdage"],
    note: "Tjek lokale skilte.",
    lat: 55.71662,
    lng: 12.57878,
  },
  {
    id: "solbjerg",
    name: "Solbjerg Plads",
    address: "2000 Frederiksberg",
    facts: ["3 timer gratis ved indkøb"],
    note: "Centerets p-skilte gælder.",
    lat: 55.68066,
    lng: 12.52367,
  },
];

let map, markers = {};

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([55.6761, 12.5683], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  renderList();
  renderMarkers();

  // Lokation
  document.getElementById("locBtn").addEventListener("click", () => {
    if (!navigator.geolocation) return alert("Geolocation ikke understøttet");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);
        L.marker([latitude, longitude]).addTo(map).bindPopup("Din position").openPopup();
      },
      () => alert("Kunne ikke hente din position")
    );
  });

  // Tilføj spot
  const addModal = document.getElementById("addModal");
  document.getElementById("addBtn").addEventListener("click", () => {
    addModal.classList.remove("hidden");
  });
  document.getElementById("cancelSpot").addEventListener("click", () => {
    addModal.classList.add("hidden");
  });
  document.getElementById("saveSpot").addEventListener("click", () => {
    const name = document.getElementById("newName").value.trim();
    const address = document.getElementById("newAddress").value.trim();
    const facts = document.getElementById("newFacts").value.trim().split("\n");
    if (!name || !address) return alert("Navn og adresse kræves");
    const spot = {
      id: Date.now().toString(),
      name,
      address,
      facts,
      note: "",
      lat: map.getCenter().lat,
      lng: map.getCenter().lng,
    };
    spots.push(spot);
    renderList();
    renderMarkers();
    addModal.classList.add("hidden");
  });

  // Søg
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    searchResults.innerHTML = "";
    if (!q) {
      searchResults.style.display = "none";
      return;
    }
    const results = spots.filter(
      (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
    results.forEach((s) => {
      const div = document.createElement("div");
      div.className = "result";
      div.innerHTML = `<span>${s.name}</span><small>${s.address}</small>`;
      div.addEventListener("click", () => {
        map.setView([s.lat, s.lng], 15);
        markers[s.id].openPopup();
        searchResults.style.display = "none";
        searchInput.value = "";
      });
      searchResults.appendChild(div);
    });
    searchResults.style.display = results.length ? "block" : "none";
  });
});

function renderList() {
  const ul = document.getElementById("parkingList");
  ul.innerHTML = "";
  spots.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `<div><strong>${s.name}</strong><div class="meta">${s.address}</div></div>
      <button class="small" onclick="showInfo('${s.id}')">Info</button>`;
    ul.appendChild(li);
  });
}

function renderMarkers() {
  Object.values(markers).forEach((m) => map.removeLayer(m));
  markers = {};
  spots.forEach((s) => {
    const marker = L.marker([s.lat, s.lng]).addTo(map).bindPopup(s.name);
    markers[s.id] = marker;
    marker.on("click", () => showInfo(s.id));
  });
}

function showInfo(id) {
  const s = spots.find((x) => x.id === id);
  if (!s) return;
  document.getElementById("infoTitle").textContent = s.name;
  document.getElementById("infoAddress").textContent = s.address;
  document.getElementById("infoFacts").innerHTML = s.facts.map(f => `<div>• ${f}</div>`).join("");
  document.getElementById("infoNote").textContent = s.note || "";
  document.getElementById("infoModal").classList.remove("hidden");
  document.getElementById("closeInfo").onclick = () => {
    document.getElementById("infoModal").classList.add("hidden");
  };
}
