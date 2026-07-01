// Load flights on page load
document.addEventListener('DOMContentLoaded', () => {
    loadFlights();
    loadBookings();
});

// Search flights
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const date = document.getElementById('date').value;
    
    let url = '/api/flights?';
    if (from) url += `from=${encodeURIComponent(from)}&`;
    if (to) url += `to=${encodeURIComponent(to)}&`;
    if (date) url += `date=${date}`;
    
    try {
        const response = await fetch(url);
        const flights = await response.json();
        displayFlights(flights);
    } catch (error) {
        console.error('Error searching flights:', error);
        showMessage('Error searching flights', 'error');
    }
});

// Load all flights
async function loadFlights() {
    try {
        const response = await fetch('/api/flights');
        const flights = await response.json();
        displayFlights(flights);
    } catch (error) {
        console.error('Error loading flights:', error);
        document.getElementById('flightsList').innerHTML = 
            '<p class="error">Error loading flights</p>';
    }
}

// Display flights
function displayFlights(flights) {
    const flightsList = document.getElementById('flightsList');
    
    if (flights.length === 0) {
        flightsList.innerHTML = '<p>No flights found</p>';
        return;
    }
    
    flightsList.innerHTML = flights.map(flight => `
        <div class="flight-card">
            <div class="flight-details">
                <h3>${flight.from} → ${flight.to}</h3>
                <p>📅 ${flight.date} | 🕐 ${flight.time}</p>
                <p class="flight-seats">💺 ${flight.seats} seats available</p>
            </div>
            <div class="flight-price">
                $${flight.price}
                <button class="book-btn" onclick="openBooking(${flight.id})">
                    Book Now
                </button>
            </div>
        </div>
    `).join('');
}

// Open booking form
function openBooking(flightId) {
    fetch(`/api/flights/${flightId}`)
        .then(response => response.json())
        .then(flight => {
            document.getElementById('flightId').value = flightId;
            document.getElementById('selectedFlightInfo').innerHTML = `
                <p><strong>${flight.from}</strong> → <strong>${flight.to}</strong></p>
                <p>📅 ${flight.date} | 🕐 ${flight.time}</p>
                <p>Price: $${flight.price} per seat</p>
                <p>💺 ${flight.seats} seats available</p>
            `;
            document.getElementById('totalPrice').textContent = 
                `Total: $${flight.price}`;
            document.getElementById('bookingSection').style.display = 'block';
            document.getElementById('bookingSection').scrollIntoView({ 
                behavior: 'smooth' 
            });
            
            // Update total price when seats change
            document.getElementById('seats').oninput = function() {
                const total = flight.price * parseInt(this.value || 0);
                document.getElementById('totalPrice').textContent = 
                    `Total: $${total}`;
            };
        })
        .catch(error => {
            console.error('Error loading flight:', error);
            showMessage('Error loading flight details', 'error');
        });
}

// Close booking form
function closeBooking() {
    document.getElementById('bookingSection').style.display = 'none';
    document.getElementById('bookingForm').reset();
}

// Book flight
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const flightId = document.getElementById('flightId').value;
    const passengerName = document.getElementById('passengerName').value;
    const email = document.getElementById('email').value;
    const seats = document.getElementById('seats').value;
    
    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flightId,
                passengerName,
                email,
                seats: parseInt(seats)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message, 'success');
            closeBooking();
            loadFlights();
            loadBookings();
        } else {
            showMessage(data.error || 'Booking failed', 'error');
        }
    } catch (error) {
        console.error('Error booking flight:', error);
        showMessage('Error booking flight', 'error');
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
    const bookingsList = document.getElementById('bookingsList');
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = '<p>No bookings yet</p>';
        return;
    }
    
    bookingsList.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-info">
                <p><strong>${booking.flightDetails.from}</strong> → 
                   <strong>${booking.flightDetails.to}</strong></p>
                <p>📅 ${booking.flightDetails.date} | 🕐 ${booking.flightDetails.time}</p>
                <p>👤 ${booking.passengerName} | 💺 ${booking.seats} seats</p>
                <p>💰 Total: $${booking.totalPrice} | 
                   📅 Booked: ${new Date(booking.bookingDate).toLocaleDateString()}</p>
                <p style="color: #28a745; font-weight: bold;">Status: ${booking.status}</p>
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
            showMessage('Booking cancelled successfully', 'success');
            loadFlights();
            loadBookings();
        } else {
            showMessage(data.error || 'Failed to cancel booking', 'error');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showMessage('Error cancelling booking', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Remove existing messages
    document.querySelectorAll('.message').forEach(el => el.remove());
    
    // Add new message at top
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}
