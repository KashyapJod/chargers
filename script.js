let map, userMarker;
// Define custom icons using Leaflet's default icons
// Define custom icons using Font Awesome
const userIcon = L.divIcon({
    className: 'custom-icon',
    html: '<i class="fas fa-map-marker-alt" style="color: red; font-size: 24px;"></i>',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const stationIcon = L.divIcon({
    className: 'custom-icon',
    html: '<i class="fas fa-map-marker-alt" style="color: green; font-size: 24px;"></i>',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
const stations = [
    { id: 1, name: "Panaji Central Station", coords: { lat: 15.4909, lng: 73.8278 }, slots: { normal: 4, fast: 3, delayed: 1 } },
    { id: 2, name: "Vasco QuickCharge", coords: { lat: 15.3983, lng: 73.8112 }, slots: { normal: 5, fast: 2, delayed: 1 } },
    { id: 3, name: "Margao Station", coords: { lat: 15.2717, lng: 73.9581 }, slots: { normal: 2, fast: 4, delayed: 2 } },
    { id: 4, name: "Ponda EcoHub", coords: { lat: 15.4026, lng: 74.0183 }, slots: { normal: 3, fast: 2, delayed: 2 } },
    { id: 5, name: "Mapusa Charging Point", coords: { lat: 15.5931, lng: 73.8158 }, slots: { normal: 4, fast: 3, delayed: 1 } },
    { id: 6, name: "Calangute PowerStation", coords: { lat: 15.5439, lng: 73.7554 }, slots: { normal: 5, fast: 1, delayed: 1 } },
    { id: 7, name: "Benaulim Express", coords: { lat: 15.2487, lng: 73.9239 }, slots: { normal: 3, fast: 3, delayed: 2 } },
    { id: 8, name: "Old Goa Charging Zone", coords: { lat: 15.5036, lng: 73.9129 }, slots: { normal: 4, fast: 2, delayed: 2 } },
    { id: 9, name: "Dabolim Eco Station", coords: { lat: 15.3809, lng: 73.8339 }, slots: { normal: 3, fast: 4, delayed: 1 } },
    { id: 10, name: "Colva Charging Hub", coords: { lat: 15.2795, lng: 73.9226 }, slots: { normal: 4, fast: 2, delayed: 2 } },
    { id: 11, name: "Candolim PowerPoint", coords: { lat: 15.5170, lng: 73.7630 }, slots: { normal: 5, fast: 1, delayed: 2 } },
    { id: 12, name: "Anjuna FastCharge", coords: { lat: 15.5861, lng: 73.7444 }, slots: { normal: 2, fast: 3, delayed: 3 } },
    { id: 13, name: "Pernem Charging Spot", coords: { lat: 15.7198, lng: 73.7956 }, slots: { normal: 4, fast: 3, delayed: 1 } },
    { id: 14, name: "Canacona Station", coords: { lat: 15.0151, lng: 74.0236 }, slots: { normal: 3, fast: 3, delayed: 2 } },
    { id: 15, name: "Siolim Charging Zone", coords: { lat: 15.6057, lng: 73.7433 }, slots: { normal: 4, fast: 2, delayed: 2 } },
    { id: 16, name: "Porvorim PowerHub", coords: { lat: 15.5264, lng: 73.8317 }, slots: { normal: 3, fast: 3, delayed: 2 } },
    { id: 17, name: "Cansaulim Express", coords: { lat: 15.3286, lng: 73.9135 }, slots: { normal: 4, fast: 2, delayed: 2 } },
    { id: 18, name: "Morjim Hub", coords: { lat: 15.6237, lng: 73.7368 }, slots: { normal: 5, fast: 1, delayed: 1 } },
    { id: 19, name: "Panjim EcoCharge", coords: { lat: 15.4909, lng: 73.8278 }, slots: { normal: 4, fast: 2, delayed: 2 } },
    { id: 20, name: "Aldona Charging", coords: { lat: 15.6010, lng: 73.8882 }, slots: { normal: 3, fast: 3, delayed: 2 } }
];


let selectedStation = null;
let userLocation = null;
let bookings = [];

function initMap() {
    try {
        map = L.map('map').setView([15.391330466343666, 73.87808649388262], 10); // Centered on Patna
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } catch (error) {
        console.error("Error initializing map:", error);
    }
}

function updateBatteryIndicator() {
    const charge = document.getElementById("charge").value;
    const level = Math.min(Math.max(charge, 0), 100);
    const batteryLevel = document.querySelector(".battery-level");
    const batteryText = document.querySelector(".battery-text");

    batteryLevel.style.width = `${level}%`;
    batteryText.textContent = `${level}%`;
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                userLocation = { lat: latitude, lng: longitude };
                // Fix the string formatting
                document.getElementById("location").value = `${latitude}, ${longitude}`;
                updateMap(latitude, longitude);
            },
            (error) => {
                alert("Unable to retrieve location. Please enter manually.");
                console.error("Geolocation error:", error);
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function updateMap(lat, lng) {
    if (!map) initMap();

    // Update user marker with red icon
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
    map.setView([lat, lng], 13);

    // Clear existing markers
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer !== userMarker) {
            map.removeLayer(layer);
        }
    });

    // Add station markers with green icon
    stations.forEach(station => {
        const marker = L.marker([station.coords.lat, station.coords.lng], { icon: stationIcon })
            .bindPopup(`
                <b>${station.name}</b><br>
                Normal: ${station.slots.normal}<br>
                Fast: ${station.slots.fast}<br>
                Delayed: ${station.slots.delayed}
            `)
            .addTo(map);
    });
}

function updateStationCard(station) {
    const stationCard = document.querySelector(`[data-station-id="${station.id}"]`);
    if (stationCard) {
        const normalSlot = stationCard.querySelector('.normal-slot');
        const fastSlot = stationCard.querySelector('.fast-slot');
        const delayedSlot = stationCard.querySelector('.delayed-slot');

        normalSlot.textContent = station.slots.normal;
        fastSlot.textContent = station.slots.fast;
        delayedSlot.textContent = station.slots.delayed;
    }
}

function findStations() {
    const locationInput = document.getElementById("location");
    const chargeInput = document.getElementById("charge");
    
    // Use HTML5 form validation
    if (!locationInput.checkValidity() || !chargeInput.checkValidity()) {
        return;
    }

    const location = locationInput.value;
    const charge = parseInt(chargeInput.value);

    // Extract coordinates from location input
    const coords = location.split(",").map(coord => parseFloat(coord.trim()));
    if (coords.length === 2) {
        userLocation = { lat: coords[0], lng: coords[1] };
        updateMap(coords[0], coords[1]);
    }

    const stationList = document.getElementById("station-list");
    const stationPanel = document.getElementById("station-panel");
    stationList.innerHTML = "";
    stationPanel.classList.add("active");

    // Sort stations by distance
    const sortedStations = stations
        .map(station => ({
            ...station,
            distance: calculateDistance(userLocation, station.coords)
        }))
        .sort((a, b) => a.distance - b.distance);

    sortedStations.forEach(station => {
        const stationDiv = document.createElement("div");
        stationDiv.classList.add("station-card");
        stationDiv.setAttribute('data-station-id', station.id);

        const loggedInUser = localStorage.getItem("loggedInUser");
        const bookBtnDisabled = !loggedInUser ? 'disabled' : '';
        const bookBtnTitle = !loggedInUser ? 'Please login to book' : 'Book slot';
        const navigateBtnTitle = 'Book a slot first to enable navigation';

        stationDiv.innerHTML = `
            <div class="station-header">
                <span class="station-name">${station.name}</span>
                <span class="station-distance"><i class="fas fa-map-marker-alt"></i> ${station.distance.toFixed(1)} km</span>
            </div>
            <div class="slots-grid">
                <div class="slot-type">
                    <div class="slot-count normal-slot">${station.slots.normal}</div>
                    <div>Normal</div>
                </div>
                <div class="slot-type">
                    <div class="slot-count fast-slot">${station.slots.fast}</div>
                    <div>Fast</div>
                </div>
                <div class="slot-type">
                    <div class="slot-count delayed-slot">${station.slots.delayed}</div>
                    <div>Adaptive Delayed</div>
                </div>
            </div>
            <div class="booking-controls">
                <div class="booking-options">
                    <select class="charging-select" id="charging-type-${station.id}" ${bookBtnDisabled}>
                        <option value="normal">Normal Charging</option>
                        <option value="fast">Fast Charging</option>
                        <option value="delayed">Adaptive Delayed Charging</option>
                    </select>
                    <select class="time-slot-select" id="time-slot-${station.id}" ${bookBtnDisabled}>
                        <option value="1">7AM - 7PM</option>
                        <option value="2">7PM - 7AM</option>
                    </select>
                </div>
                <div class="button-group">
                    <button class="book-btn" onclick="bookSlot(${station.id})" ${bookBtnDisabled} title="${bookBtnTitle}">
                        <i class="fas fa-calendar-check"></i> Book
                    </button>
                    <button class="navigate-btn" onclick="navigateToStation(${station.coords.lat}, ${station.coords.lng})" disabled title="${navigateBtnTitle}">
                        <i class="fas fa-directions"></i> Navigate
                    </button>
                </div>
            </div>
        `;
        stationList.appendChild(stationDiv);
    });

    // After populating the station list, scroll to the results
    stationPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bookSlot(stationId) {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("Please login to book a charging slot");
        window.location.href = "login.html";
        return;
    }

    const station = stations.find(s => s.id === stationId);
    const chargingType = document.getElementById(`charging-type-${stationId}`).value;
    const timeSlot = document.getElementById(`time-slot-${stationId}`).value;
    
    if (!station) {
        alert("Station not found.");
        return;
    }

    if (station.slots[chargingType] > 0) {
        // Decrease slot count
        station.slots[chargingType]--;
        selectedStation = station;

        // Update the station card and map marker
        updateStationCard(station);
        updateMap(userLocation.lat, userLocation.lng);

        // Add booking to the list
        const bookingTimeSlot = timeSlot === "1" ? "7AM - 7PM" : "7PM - 7AM";
        bookings.push({
            station: station,
            type: chargingType,
            timeSlot: bookingTimeSlot
        });

        alert(`Booking confirmed at ${station.name} for ${chargingType} charging during ${bookingTimeSlot}!`);

        // Enable the navigate button and update tooltip only after successful booking
        const navigateBtn = document.querySelector(`[data-station-id="${stationId}"] .navigate-btn`);
        navigateBtn.removeAttribute('disabled');
        navigateBtn.title = 'Navigate to station';
    } else {
        alert("No slots available for this charging type.");
    }
}

function navigateToStation(lat, lng) {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
        alert("Please login to navigate");
        window.location.href = "login.html";
        return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

function showBookingsPopup() {
    const popup = document.getElementById('bookings-popup');
    const bookingsList = document.getElementById('bookings-list');
    bookingsList.innerHTML = '';

    bookings.forEach((booking, index) => {
        const bookingItem = document.createElement('div');
        bookingItem.classList.add('booking-item');
        bookingItem.innerHTML = `
            <div><strong>Station:</strong> ${booking.station.name}</div>
            <div><strong>Type:</strong> ${booking.type}</div>
            <div><strong>Time Slot:</strong> ${booking.timeSlot}</div>
            <button class="cancel-booking-btn" onclick="cancelBooking(${index})">Cancel</button>
        `;
        bookingsList.appendChild(bookingItem);
    });

    popup.style.display = 'flex';
}

function cancelBooking(index) {
    const booking = bookings[index];
    booking.station.slots[booking.type]++;
    updateStationCard(booking.station);
    updateMap(userLocation.lat, userLocation.lng);
    bookings.splice(index, 1);
    showBookingsPopup();
}

function hideBookingsPopup() {
    const popup = document.getElementById('bookings-popup');
    popup.style.display = 'none';
}

document.getElementById('close-bookings').onclick = hideBookingsPopup;

// Initialize map when the page loads
window.addEventListener('load', initMap);
