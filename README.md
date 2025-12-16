# MedSync - RFID-Integrated Smart Health Card System

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Arduino-RFID-teal?style=for-the-badge&logo=arduino" alt="Arduino" />
</p>

MedSync is an RFID-integrated smart health card system designed to securely store and instantly retrieve medical and pharmaceutical records through a real-time cloud-based system.

## ✨ Features

- 🏥 **RFID Integration** - Connect Arduino RFID readers for instant patient identification
- ⚡ **Real-time Updates** - WebSocket-based communication for live data synchronization
- 👥 **Multi-role Authentication** - Support for patients, doctors, pharmacies, and admins
- 💊 **Prescription Management** - Create, verify, and track prescriptions with barcode support
- 🔒 **Secure Storage** - Encrypted data with JWT authentication and bcrypt password hashing
- 📱 **Responsive Design** - Modern UI that works on desktop and mobile devices
- 🌐 **Offline Support** - Local storage fallback when server is unavailable

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Arduino** with RFID-RC522 reader (optional for demo mode)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pbhacks/medsync.git
   cd medsync
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   cd medsync
   npm install
   ```

4. **Start the Python server**
   ```bash
   # From the project root
   python rfid_server.py
   ```

5. **Start the web application**
   ```bash
   # In a new terminal
   cd medsync
   npm run dev
   ```

6. **Open your browser**
   - Web App: http://localhost:3000
   - API Server: http://localhost:8001

## 🔧 Configuration

### Frontend Configuration

Edit `medsync/lib/config.ts` or create `medsync/.env.local`:

```env
NEXT_PUBLIC_WS_HOST=localhost
NEXT_PUBLIC_WS_PORT=8000
NEXT_PUBLIC_API_HOST=localhost
NEXT_PUBLIC_API_PORT=8001
```

### Backend Configuration

Edit `server_config.py`:

```python
WEBSOCKET_PORT = 8000
HTTP_PORT = 8001
SERIAL_PORT = ""  # Leave empty for auto-detect
```

## 🎮 Demo Mode

The system works without Arduino hardware using demo credentials:

| Role     | Email                     | Password   |
|----------|---------------------------|------------|
| Admin    | admin@medsync.local       | admin123   |
| Doctor   | doctor@medsync.local      | doctor123  |
| Patient  | patient@medsync.local     | patient123 |
| Pharmacy | pharmacy@medsync.local    | pharmacy123|

## 📁 Project Structure

```
medsync/
├── rfid_server.py          # Python WebSocket + REST API server
├── server_config.py        # Server configuration
├── requirements.txt        # Python dependencies
├── sketch_dec15a/          # Arduino RFID sketch
│   └── sketch_dec15a.ino
└── medsync/                # Next.js web application
    ├── app/                # App router pages
    │   ├── dashboard/      # Main dashboard
    │   ├── login/          # Authentication
    │   ├── patients/       # Patient management
    │   ├── prescriptions/  # Prescription management
    │   ├── profile/        # User profile
    │   ├── rfid/           # RFID card management
    │   └── settings/       # App settings
    ├── components/         # React components
    ├── lib/                # Utilities & config
    ├── providers/          # Context providers
    └── services/           # API & WebSocket services
```

## 🔌 Arduino Setup

### Hardware Required

- Arduino Uno/Nano/Mega
- RFID-RC522 Module
- Jumper wires

### Wiring

| RFID-RC522 | Arduino UNO |
|------------|-------------|
| SDA        | Pin 10      |
| SCK        | Pin 13      |
| MOSI       | Pin 11      |
| MISO       | Pin 12      |
| IRQ        | Not connected |
| GND        | GND         |
| RST        | Pin 9       |
| 3.3V       | 3.3V        |

### Upload Sketch

Upload `sketch_dec15a/sketch_dec15a.ino` to your Arduino.

## 🛠️ API Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - User logout

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient

### Prescriptions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription
- `POST /api/prescriptions/:id/verify` - Verify and dispense

### RFID Cards
- `GET /api/rfid/cards` - List RFID cards
- `POST /api/rfid/cards` - Register new card
- `POST /api/rfid/cards/:uid/link` - Link card to patient

## 🔐 Security

- JWT-based authentication
- bcrypt password hashing
- Role-based access control
- CORS protection
- Input validation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Pbhacks**

---

<p align="center">Made with ❤️ for better healthcare</p>
