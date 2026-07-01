const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Sample flight data
let flights = [
    {
        id: 1,
        from: 'New York',
        to: 'London',
        date: '2026-07-15',
        time: '10:00 AM',
        price: 450,
        seats: 50
    },
    {
        id: 2,
        from: 'New York',
        to: 'Paris',
        date: '2026-07-16',
        time: '2:00 PM',
        price: 550,
        seats: 30
    },
    {
        id: 3,
        from: 'London',
        to: 'Dubai',
        date: '2026-07-17',
        time: '8:00 AM',
        price: 600,
        seats: 40
    },
    {
        id: 4,
        from: 'New York',
        to: 'Tokyo',
        date: '2026-07-20',
        time: '11:30 PM',
        price: 800,
        seats: 25
    }
];

let bookings = [];
let bookingIdCounter = 1;

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all flights
app.get('/api/flights', (req, res) => {
    const { from, to, date } = req.query;
    let filteredFlights = flights;

    if (from) {
        filteredFlights = filteredFlights.filter(f => 
            f.from.toLowerCase().includes(from.toLowerCase())
        );
    }
    if (to) {
        filteredFlights = filteredFlights.filter(f => 
            f.to.toLowerCase().includes(to.toLowerCase())
        );
    }
    if (date) {
        filteredFlights = filteredFlights.filter(f => f.date === date);
    }

    res.json(filteredFlights);
});

// Get single flight
app.get('/api/flights/:id', (req, res) => {
    const flight = flights.find(f => f.id === parseInt(req.params.id));
    if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
    }
    res.json(flight);
});

// Book a flight
app.post('/api/book', (req, res) => {
    const { flightId, passengerName, email, seats } = req.body;

    const flight = flights.find(f => f.id === parseInt(flightId));
    if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
    }

    if (flight.seats < parseInt(seats)) {
        return res.status(400).json({ error: 'Not enough seats available' });
    }

    // Update seats
    flight.seats -= parseInt(seats);

    // Create booking
    const booking = {
        id: bookingIdCounter++,
        flightId: flight.id,
        flightDetails: flight,
        passengerName,
        email,
        seats: parseInt(seats),
        totalPrice: flight.price * parseInt(seats),
        bookingDate: new Date().toISOString(),
        status: 'confirmed'
    };

    bookings.push(booking);

    res.status(201).json({
        message: 'Booking successful!',
        booking: booking
    });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

// Cancel booking
app.delete('/api/bookings/:id', (req, res) => {
    const bookingId = parseInt(req.params.id);
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    // Return seats
    const booking = bookings[bookingIndex];
    const flight = flights.find(f => f.id === booking.flightId);
    if (flight) {
        flight.seats += booking.seats;
    }

    bookings.splice(bookingIndex, 1);
    res.json({ message: 'Booking cancelled successfully' });
});

app.listen(PORT, () => {
    console.log(`✈️ Flight Booking App running at http://localhost:${PORT}`);
});
