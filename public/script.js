// State
let currentView = 'grid';
let selectedFlightId = null;

// DOM Elements
const flightsList = document.getElementById('flightsList');
const bookingsList = document.getElementById('bookingsList');
const bookingSection = document.getElementById('bookingSection');
const searchForm = document.getElementById('searchForm');

// Load flights on page load
document.addEventListener('DOMContentLoaded', () => {
    loadFlights();
    loadBookings();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('date').value = tomorrow.toISOString().split('T')[0];
});

// Search flights
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await loadFlights();
});

// Reset search
function resetSearch() {
    document.getElementById('from').value = '';
    document.getElementById('to').value = '';
    document.getElementById('date').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('stops').value = '';
    loadFlights();
}

// Load flights with filters
async function loadFlights() {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const date = document.getElementById('date').value;
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    const stops = document.getElementById('stops').value;
    
    let url = '/api/flights?';
    if (from) url += `from=${encodeURIComponent(from)}&`;
    if (to) url += `to=${encodeURIComponent(to)}&`;
    if (date) url += `date=${date}&`;
    if (minPrice) url += `minPrice=${minPrice}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;
    if (stops !== '') url += `stops=${stops}`;
    
    try {
        const response = await fetch(url);
        const flights = await response.json();
        displayFlights(flights);
        document.getElementById('flightCount').textContent = 
            `${flights.length} flights available`;
    } catch (error) {
        console.error('Error loading flights:', error);
        flightsList.innerHTML = '<p class="error">Error loading flights</p>';
    }
}

// Display flights
function displayFlights(flights) {
    if (flights.length === 0) {
        flightsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No Flights Found</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }
    
    flightsList.innerHTML = flights.map(flight => {
        const seatClass = flight.seats <= 5 ? 'very-low' : 
                         flight.seats <= 15 ? 'low' : '';
        
        const amenitiesHTML = flight.amenities.map(a => 
            `<span class="amenity-badge">${a}</span>`
        ).join('');
        
        return `
            <div class="flight-card" data-id="${flight.id}">
                <div class="airline-info">
                    <span class="airline-icon">${flight.image || '✈️'}</span>
                    <span class="airline-name">${flight.airline}</span>
                </div>
                
                <div class="flight-route">
                    <div class="route-cities">
                        <span>${flight.from}</span>
                        <span class="route-arrow">→</span>
                        <span>${flight.to}</span>
                    </div>
                    <div class="flight-meta">
                        <span>📅 ${flight.date}</span>
                        <span>🕐 ${flight.time}</span>
                        <span>⏱️ ${flight.duration}</span>
                        <span>🛑 ${flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}</span>
                        <span class="seats-available ${seatClass}">💺 ${flight.seats} seats</span>
                    </div>
                    <div class="amenities">${amenitiesHTML}</div>
                </div>
                
                <div class="flight-actions">
                    <div class="flight-price">
                        $${flight.price}
                        <small>per seat</small>
                    </div>
                    <button class="book-btn" onclick="openBooking(${flight.id})">
                        Book Now
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Set view
function setView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.view-btn:has([data-view="${view}"])`)?.classList.add('active');
    
    if (view === 'grid') {
        flightsList.classList.remove('list-view');
    } else {
        flightsList.classList.add('list-view');
    }
}

// Open booking
function openBooking(flightId) {
    fetch(`/api/flights/${flightId}`)
        .then(response => response.json())
        .then(flight => {
            selectedFlightId = flightId;
            
            document.getElementById('flightId').value = flightId;
            document.getElementById('flightRoute').textContent = 
                `${flight.from} → ${flight.to}`;
            document.getElementById('flightDetails').textContent = 
                `${flight.airline} • ${flight.date} • ${flight.time} • ${flight.duration}`;
            document.getElementById('perSeatPrice').textContent = `$${flight.price}`;
            document.getElementById('totalPrice').textContent = `$${flight.price}`;
            document.getElementById('seatCount').textContent = '1';
            document.getElementById('seats').value = 1;
            
            document.getElementById('bookingSection').style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Update total on seat change
            document.getElementById('seats').onchange = function() {
                updateTotal(flight.price);
            };
            
            // Reset form
            document.getElementById('bookingForm').reset();
            document.getElementById('passengerName').value = '';
            document.getElementById('email').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('specialRequests').value = '';
        })
        .catch(error => {
            console.error('Error loading flight:', error);
            showToast('Error loading flight details', 'error');
        });
}

// Adjust seats
function adjustSeats(delta) {
    const input = document.getElementById('seats');
    let value = parseInt(input.value) + delta;
    if (value < 1) value = 1;
    if (value > 10) value = 10;
    input.value = value;
    input.dispatchEvent(new Event('change'));
}

// Update total price
function updateTotal(pricePerSeat) {
    const seats = parseInt(document.getElementById('seats').value) || 1;
    const total = pricePerSeat * seats;
    document.getElementById('totalPrice').textContent = `$${total}`;
    document.getElementById('seatCount').textContent = seats;
}

// Close booking
function closeBooking() {
    bookingSection.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Book flight
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const flightId = document.getElementById('flightId').value;
    const passengerName = document.getElementById('passengerName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const seats = document.getElementById('seats').value;
    const specialRequests = document.getElementById('specialRequests').value;
    
    if (!passengerName || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                flightId,
                passengerName,
                email,
                phone,
                seats: parseInt(seats),
                specialRequests
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`✅ Booking confirmed! Reference: ${data.booking.reference}`, 'success');
            closeBooking();
            loadFlights();
            loadBookings();
        } else {
            showToast(data.error || 'Booking failed', 'error');
        }
    } catch (error) {
        console.error('Error booking flight:', error);
        showToast('Error booking flight', 'error');
    }
});

// Load bookings
async function loadBookings() {
    try {
        const response = await fetch('/api/bookings');
        const bookings = await response.json();
        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Display bookings
function displayBookings(bookings) {
    if (bookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛫</div>
                <h3>No Bookings Yet</h3>
                <p>Start your journey by booking a flight today!</p>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-info">
                <div class="booking-header-row">
                    <span class="booking-ref">Ref: ${booking.reference}</span>
                    <span class="booking-status ${booking.status}">${booking.status.toUpperCase()}</span>
                </div>
                <div class="flight-details">
                    <span>✈️ ${booking.flightDetails.from} → ${booking.flightDetails.to}</span>
                    <span>📅 ${booking.flightDetails.date}</span>
                    <span>🕐 ${booking.flightDetails.time}</span>
                    <span>👤 ${booking.passengerName}</span>
                    <span>💺 ${booking.seats} seats</span>
                    <span>💰 $${booking.totalPrice}</span>
                </div>
                <div style="font-size: 12px; color: #718096; margin-top: 4px;">
                    Booked: ${new Date(booking.bookingDate).toLocaleDateString()}
                </div>
            </div>
            <button class="cancel-btn" onclick="cancelBooking(${booking.id})">
                Cancel
            </button>
        </div>
    `).join('');
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Booking cancelled successfully', 'success');
            loadFlights();
            loadBookings();
        } else {
            showToast(data.error || 'Failed to cancel booking', 'error');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showToast('Error cancelling booking', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Scroll to booking section
function scrollToBooking() {
    document.getElementById('bookingSection').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Close booking modal on backdrop click
bookingSection.addEventListener('click', (e) => {
    if (e.target === bookingSection) {
        closeBooking();
    }
});

// Keyboard shortcut: Escape to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bookingSection.style.display === 'flex') {
        closeBooking();
    }
});
