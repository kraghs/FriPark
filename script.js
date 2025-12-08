// Apple-agtig kortapp der rent faktisk virker.
// - Alle parkeringspladser vises som pæne markører.
// - Klik: viser navn + adresse + "Vis info".
// - Info-sheet: kort, faktuel tekst (fx "3 timer gratis", "fri efter 18").
// - Koordinater bruges kun internt og vises aldrig.

// ===== Robust init =====
window.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("map");
  if (!mapEl) {
    console.error("Map element mangler.");
    return;
  }

  // Opret kort
  const map = L.map("map", {
    zoomControl: true,
    attributionControl: true
  });

  // OSM tiles (stabil, gratis)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // Start: København
  map.setView([55.6761, 12.5683], 12);

  // Custom marker-dot
  const MarkerDot = L.DivIcon.extend({
    options: {
      className: "",
      html: '<div class="marker-dot" aria-hidden="true"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    }
  });
  const markerDot = new MarkerDot();

  // UI refs
  const inlineCard = document.getElementById("inlineCard");
  const cardName = document.getElementById("cardName");
  const cardAddress = document.getElementById("cardAddress");
  const cardBadge = document.getElementById("cardBadge");
  const infoButton = document.getElementById("infoButton");
  const closeCardBtn = document.getElementById("closeCard");

  const sheet = document.getElementById("sheet");
  const sheetBackdrop = document.getElementById("sheetBackdrop");
  const sheetTitle = document.getElementById("sheetTitle");
  const sheetAddress = document.getElementById("sheetAddress");
  const sheetBadge = document.getElementById("sheetBadge");
  const sheetFacts = document.getElementById("sheetFacts");
  const sheetNotes = document.getElementById("sheetNotes");
  const closeSheetBtn = document.getElementById("closeSheet");

  const aboutButton = document.getElementById("aboutButton");

  // ===== Data (udskift med verificerede steder) =====
  // Struktur:
  // {
  //   id: "unik-id",
  //   name: "Navn",
  //   address: "Adresse, Postnr By",
  //   lat: Number, lng: Number,    // Intern placering
  //   facts: ["Kort, faktuel tekst", ...],
  //   notes: "Valgfri uddybning",
  //   verified: true|false
  // }
  const parkingSpots = [
    {
      id: "kbh-svanemollen-station",
      name: "Svanemøllen Station P",
      address: "Strandboulevarden 150, 2100 København Ø",
      lat: 55.71662, lng: 12.57878,
      facts: [
        "Fri parkering efter 18:00 hverdage (tjek lokale zoneregler)",
        "Gratis søn- og helligdage i visse lommer"
      ],
      notes: "Læs altid lokale skilte. Regler kan ændre sig.",
      verified: false
    },
    {
      id: "frederiksberg-solbjerg-plads",
      name: "Solbjerg Plads",
      address: "Solbjerg Plads, 2000 Frederiksberg",
      lat: 55.68066, lng: 12.52367,
      facts: [
        "3 timer gratis ved indkøb (centerbetingelser)",
        "Kontrolafgift ved overskridelse"
      ],
      notes: "Se centerets p-skilte for aktuelle betingelser.",
      verified: false
    },
    {
      id: "valby-spinderiet",
      name: "Spinderiet P",
      address: "Valby Langgade 97, 2500 Valby",
      lat: 55.66179, lng: 12.50520,
      facts: [
        "Fri efter 18:00 i enkelte gader (lokale skilte)",
        "Betalingszoner kan gælde på hverdage"
      ],
      notes: "Bekræft information på stedet.",
      verified: false
    }
  ];

  // ===== State =====
  let currentSpotId = null;
  let markers = [];

  // ===== UI helpers =====
  function openInlineCard(spot) {
    cardName.textContent = spot.name;
    cardAddress.textContent = spot.address;
    cardBadge.hidden = !spot.verified;
    inlineCard.hidden = false;
  }
  function closeInlineCard() {
    inlineCard.hidden = true;
    currentSpotId = null;
  }
  function openSheet(spot) {
    sheetTitle.textContent = spot.name;
    sheetAddress.textContent = spot.address;
    sheetBadge.hidden = !spot.verified;

    sheetFacts.innerHTML = "";
    if (Array.isArray(spot.facts)) {
      spot.facts.forEach(text => {
        const li = document.createElement("li");
        const icon = document.createElement("div");
        icon.className = "icon";
        const p = document.createElement("div");
        p.className = "text";
        p.textContent = text;
        li.appendChild(icon);
        li.appendChild(p);
        sheetFacts.appendChild(li);
      });
    }
    if (spot.notes && spot.notes.trim()) {
      sheetNotes.hidden = false;
      sheetNotes.textContent = spot.notes;
    } else {
      sheetNotes.hidden = true;
      sheetNotes.textContent = "";
    }

    sheet.hidden = false;
  }
  function closeSheet() {
    sheet.hidden = true;
  }

  // ===== Events =====
  infoButton.addEventListener("click", () => {
    if (!currentSpotId) return;
    const spot = parkingSpots.find(s => s.id === currentSpotId);
    if (spot) openSheet(spot);
  });
  closeCardBtn.addEventListener("click", closeInlineCard);
  sheetBackdrop.addEventListener("click", closeSheet);
  closeSheetBtn.addEventListener("click", closeSheet);

  aboutButton.addEventListener("click", () => {
    const info = [
      "Klik på markører for navn og adresse.",
      "Tryk “Vis info” for regler (fx 3 timer gratis, fri efter 18).",
      "Oplysninger skal verificeres mod lokale skilte/kommunale kilder."
    ];
    sheetTitle.textContent = "Om appen";
    sheetAddress.textContent = "Faktuel, rolig og dansk";
    sheetBadge.hidden = true;
    sheetFacts.innerHTML = "";
    info.forEach(t => {
      const li = document.createElement("li");
      const icon = document.createElement("div");
      icon.className = "icon";
      const p = document.createElement("div");
      p.className = "text";
      p.textContent = t;
      li.appendChild(icon);
      li.appendChild(p);
      sheetFacts.appendChild(li);
    });
    sheetNotes.hidden = false;
    sheetNotes.textContent = "Udskift sample-data i script.js med verificerede steder. Koordinater vises aldrig.";
    sheet.hidden = false;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!sheet.hidden) closeSheet();
      if (!inlineCard.hidden) closeInlineCard();
    }
  });

  // Luk kort-kortet ved klik på tomt område
  map.on("click", () => {
    if (!inlineCard.hidden) closeInlineCard();
  });

  // ===== Markers =====
  function addMarkers() {
    // Ryd gamle
    markers.forEach(m => m.remove());
    markers = [];

    parkingSpots.forEach(spot => {
      const marker = L.marker([spot.lat, spot.lng], { icon: markerDot, title: spot.name })
        .addTo(map);

      marker.on("click", () => {
        currentSpotId = spot.id;
        openInlineCard(spot);
        // Pan roligt mod markøren uden at zoom-spamme
        map.panTo([spot.lat, spot.lng], { animate: true });
      });

      markers.push(marker);
    });
  }

  addMarkers();

  // Fit bounds til alle markører
  if (markers.length > 0) {
    const group = new L.FeatureGroup(markers);
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  // Forhindre dobbelt-tryk zoom når sheet er åbent
  sheet.addEventListener("touchstart", (e) => {
    e.stopPropagation();
  }, { passive: true });
});
