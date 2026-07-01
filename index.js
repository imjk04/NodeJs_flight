const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Enhanced sample flight data with more airlines and destinations
let flights = [
    {
        id: 1,
        airline: 'American Airlines',
        flightNumber: 'AA101',
        from: 'New York',
        to: 'London',
        date: '2026-07-15',
        time: '10:00 AM',
        price: 450,
        seats: 50,
        duration: '7h 30m',
        stops: 0,
        image: '✈️',
        amenities: ['WiFi', 'Meals', 'Entertainment']
    },
    {
        id: 2,
        airline: 'Delta Airlines',
        flightNumber: 'DL202',
        from: 'New York',
        to: 'Paris',
        date: '2026-07-16',
        time: '2:00 PM',
        price: 550,
        seats: 30,
        duration: '8h 15m',
        stops: 0,
        image: '🇫🇷',
        amenities: ['WiFi', 'Meals', 'Entertainment', 'Power Outlets']
    },
    {
        id: 3,
        airline: 'Emirates',
        flightNumber: 'EK305',
        from: 'London',
        to: 'Dubai',
        date: '2026-07-17',
        time: '8:00 AM',
        price: 600,
        seats: 40,
        duration: '6h 45m',
        stops: 0,
        image: '🇦🇪',
        amenities: ['WiFi', 'Meals', 'Entertainment', 'Power Outlets', 'Lounge Access']
    },
    {
        id: 4,
        airline: 'Japan Airlines',
        flightNumber: 'JL408',
        from: 'New York',
        to: 'Tokyo',
        date: '2026-07-20',
        time: '11:30 PM',
        price: 800,
        seats: 25,
        duration: '14h 20m',
        stops: 0,
        image: '🇯🇵',
        amenities: ['WiFi', 'Meals', 'Entertainment', 'Power Outlets', 'Premium Seats']
    },
    {
        id: 5,
        airline: 'Singapore Airlines',
        flightNumber: 'SQ509',
        from: 'London',
        to: 'Singapore',
        date: '2026-07-18',
        time: '9:30 PM',
        price: 750,
        seats: 35,
        duration: '12h 45m',
        stops: 0,
        image: '🇸🇬',
        amenities: ['WiFi', 'Meals', 'Entertainment', 'Power Outlets', 'Premium Seats']
    },
    {
        id: 6,
        airline: 'Qatar Airways',
        flightNumber: 'QR610',
        from: 'Dubai',
        to: 'New York',
        date: '2026-07-19',
        time: '6:00 AM',
        price: 680,
        seats: 45,
        duration: '14h 30m',
        stops: 0,
        image: '🇶🇦',
        amenities: ['WiFi', 'Meals', 'Entertainment', 'Power Outlets', 'Lounge Access']
    },
    {
        id: 7,
        airline: 'British Airways',
        flightNumber: 'BA707',
        from: 'Paris',
        to: 'Rome',
        date: '2026-07-21',
        time: '1:00 PM',
        price: 320,
        seats: 60,
        duration: '2h 15m',
        stops: 0,
        image: '🇬🇧',
        amenities: ['WiFi', 'Meals', 'Entertainment']
    },
    {
        id: 8,
        airline: 'Lufthansa',
        flightNumber: 'LH808',
        from: 'Frankfurt',
        to: 'New York',
        date: '2026-07-22',
        time: '8:15 AM',
        price: 520,
        seats: 38,
        duration: '8h 45m',
        stops: 0,
        image: '🇩🇪',
        amenities: ['WiFi', 'Meals', 'Entertainment', 'Power Outlets']
    }
];

let bookings = [];
let bookingIdCounter = 1;

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all flights with filters
app.get('/api/flights', (req, res) => {
    const { from, to, date, minPrice, maxPrice, stops } = req.query;
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
    if (minPrice) {
        filteredFlights = filteredFlights.filter(f => f.price >= parseInt(minPrice));
    }
    if (maxPrice) {
        filteredFlights = filteredFlights.filter(f => f.price <= parseInt(maxPrice));
    }
    if (stops !== undefined && stops !== '') {
        filteredFlights = filteredFlights.filter(f => f.stops === parseInt(stops));
    }

    // Sort by price (cheapest first)
    filteredFlights.sort((a, b) => a.price - b.price);

    res.json(filteredFlights);
});

// Get all airlines (for filter)
app.get('/api/airlines', (req, res) => {
    const airlines = [...new Set(flights.map(f => f.airline))];
    res.json(airlines);
});

// Get all destinations
app.get('/api/destinations', (req, res) => {
    const destinations = [...new Set(flights.map(f => f.to))];
    res.json(destinations);
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
    const { flightId, passengerName, email, phone, seats, specialRequests } = req.body;

    const flight = flights.find(f => f.id === parseInt(flightId));
    if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
    }

    const requestedSeats = parseInt(seats);
    if (flight.seats < requestedSeats) {
        return res.status(400).json({ error: 'Not enough seats available' });
    }

    // Generate a booking reference
    const reference = 'BK' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Update seats
    flight.seats -= requestedSeats;

    // Create booking
    const booking = {
        id: bookingIdCounter++,
        reference: reference,
        flightId: flight.id,
        flightDetails: flight,
        passengerName,
        email,
        phone,
        seats: requestedSeats,
        totalPrice: flight.price * requestedSeats,
        bookingDate: new Date().toISOString(),
        status: 'confirmed',
        specialRequests: specialRequests || 'None'
    };

    bookings.unshift(booking); // Add to beginning

    res.status(201).json({
        message: 'Booking successful!',
        booking: booking
    });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

// Get booking by reference
app.get('/api/bookings/:reference', (req, res) => {
    const booking = bookings.find(b => b.reference === req.params.reference);
    if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
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
