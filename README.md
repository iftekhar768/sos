# Surokkha — Simple Safety Website (ZIP)

This is a **simple front-end website** based on your provided screens:

- **Home page** (buttons)
- **Real Time Tracker** (GPS / map)
- **Report an Issue** (feedback form)
- **Emergency SOS** (share location & open directions)
- **Book the Ride** (seat selection)

## How to run

### Option A (easiest)
1. Unzip the project
2. Open `index.html` in your browser

> Note: Some browsers limit GPS on `file://` pages. If location does not work, use Option B.

### Option B (recommended for GPS)
Run a small local server:

**Windows**
- Open the folder in Terminal / PowerShell
- Run: `python -m http.server 8000`
- Open: `http://localhost:8000`

**Mac/Linux**
- Run: `python3 -m http.server 8000`
- Open: `http://localhost:8000`

## What each page does

### Home (index.html)
Buttons navigate to the four features.

### Real Time Tracker (tracker.html)
- Requests location permission
- Shows your current location on a map (Leaflet + OpenStreetMap)
- Updates live while tracking is ON
- Provides a Google Maps link for sharing

### Report an Issue (report.html)
- Issue type, date & time, location, description (20+ chars), attachment (optional)
- Saves report to your browser (Local Storage)
- Lets you download the report as JSON

### Emergency SOS (sos.html)
- Turns SOS ON/OFF
- Tracks your live coordinates
- Copies a ready SOS message including a Google Maps link
- Optional: enter a safety destination and open Google Maps directions

### Book the Ride (ride.html)
- 4×4 seat selection (1–16)
- Some seats are pre-booked to match your screenshot style
- Confirmed bookings are saved locally

## Design references
Your provided images are stored here:
`assets/references/`

## No backend
This is a demo without a server/database. If you want:
- Admin dashboard to receive reports
- SMS/WhatsApp sending
- Verified emergency contacts
- Live trip + destination tracking

…you’ll need a backend (Node, Python, Firebase, etc.).
