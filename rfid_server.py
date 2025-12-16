#!/usr/bin/env python3
"""
MedSync RFID Server
A WebSocket and REST API server that bridges Arduino RFID reader with the MedSync web application.
Provides real-time RFID scan broadcasts and secure data synchronization.
"""

import asyncio
import json
import os
import hashlib
import secrets
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, Dict, Set, Any
from glob import glob
import threading
from dataclasses import dataclass, asdict
from functools import wraps

# Third-party imports
try:
    import serial
except ImportError:
    print("Please install pyserial: pip install pyserial")
    serial = None

try:
    import websockets
    from websockets.server import serve
except ImportError:
    print("Please install websockets: pip install websockets")
    websockets = None

try:
    from aiohttp import web
    import aiohttp_cors
except ImportError:
    print("Please install aiohttp and aiohttp-cors: pip install aiohttp aiohttp-cors")
    web = None

# Load external config if available
try:
    import server_config
    _ext_config = True
except ImportError:
    _ext_config = False


# Configuration
class Config:
    # Use external config if available, otherwise use defaults
    if _ext_config:
        WEBSOCKET_PORT = getattr(server_config, 'WEBSOCKET_PORT', 8000)
        HTTP_PORT = getattr(server_config, 'HTTP_PORT', 8001)
        DATABASE_PATH = getattr(server_config, 'DATABASE_PATH', "medsync.db")
        SERIAL_PORT = getattr(server_config, 'SERIAL_PORT', "") or None
        SERIAL_BAUDRATE = getattr(server_config, 'SERIAL_BAUDRATE', 9600)
        _secret = getattr(server_config, 'SECRET_KEY', "")
        SECRET_KEY = _secret if _secret else os.environ.get("MEDSYNC_SECRET_KEY", secrets.token_hex(32))
        TOKEN_EXPIRY_HOURS = getattr(server_config, 'TOKEN_EXPIRY_HOURS', 24)
    else:
        WEBSOCKET_PORT = int(os.environ.get("MEDSYNC_WS_PORT", 8000))
        HTTP_PORT = int(os.environ.get("MEDSYNC_HTTP_PORT", 8001))
        DATABASE_PATH = os.environ.get("MEDSYNC_DB_PATH", "medsync.db")
        SECRET_KEY = os.environ.get("MEDSYNC_SECRET_KEY", secrets.token_hex(32))
        TOKEN_EXPIRY_HOURS = int(os.environ.get("MEDSYNC_TOKEN_EXPIRY", 24))
        SERIAL_PORT = os.environ.get("MEDSYNC_SERIAL_PORT", None)
        SERIAL_BAUDRATE = int(os.environ.get("MEDSYNC_SERIAL_BAUDRATE", 9600))


# Database initialization
def init_database():
    """Initialize SQLite database with required tables."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    
    # Users table with authentication
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('doctor', 'patient', 'pharmacy', 'admin')),
            created_at TEXT NOT NULL,
            last_login TEXT,
            is_active INTEGER DEFAULT 1
        )
    """)
    
    # Patients table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            date_of_birth TEXT,
            gender TEXT,
            contact TEXT,
            email TEXT,
            address TEXT,
            rfid_uid TEXT UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    
    # RFID cards table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rfid_cards (
            uid TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            patient_id TEXT,
            registered_at TEXT NOT NULL,
            last_scanned TEXT,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)
    
    # Prescriptions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prescriptions (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            medication TEXT NOT NULL,
            dosage TEXT NOT NULL,
            frequency TEXT NOT NULL,
            date_issued TEXT NOT NULL,
            date_expires TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            notes TEXT,
            barcode TEXT UNIQUE,
            verified_at TEXT,
            verified_by TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES users(id)
        )
    """)
    
    # RFID scan logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scan_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rfid_uid TEXT NOT NULL,
            scanned_at TEXT NOT NULL,
            action TEXT,
            details TEXT
        )
    """)
    
    # Auth tokens table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auth_tokens (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Create default admin user if not exists
    cursor.execute("SELECT id FROM users WHERE email = 'admin@medsync.local'")
    if not cursor.fetchone():
        admin_id = secrets.token_hex(16)
        password_hash = hash_password("admin123")  # Change in production!
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (admin_id, "admin@medsync.local", password_hash, "System Admin", "admin", datetime.now().isoformat()))
    
    # Create demo doctor user
    cursor.execute("SELECT id FROM users WHERE email = 'doctor@medsync.local'")
    if not cursor.fetchone():
        doctor_id = secrets.token_hex(16)
        password_hash = hash_password("doctor123")
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (doctor_id, "doctor@medsync.local", password_hash, "Dr. Smith", "doctor", datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    print("✓ Database initialized successfully")


def hash_password(password: str) -> str:
    """Hash password with salt using SHA-256."""
    salt = Config.SECRET_KEY[:16]
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash."""
    return hash_password(password) == password_hash


def generate_token(user_id: str) -> str:
    """Generate authentication token and store in database."""
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now() + timedelta(hours=Config.TOKEN_EXPIRY_HOURS)).isoformat()
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO auth_tokens (token, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    """, (token, user_id, datetime.now().isoformat(), expires_at))
    conn.commit()
    conn.close()
    
    return token


def verify_token(token: str) -> Optional[Dict]:
    """Verify token and return user data if valid."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT u.id, u.email, u.name, u.role, t.expires_at
        FROM auth_tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.token = ? AND u.is_active = 1
    """, (token,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        expires_at = datetime.fromisoformat(row['expires_at'])
        if expires_at > datetime.now():
            return dict(row)
    return None


# WebSocket server
class RFIDWebSocketServer:
    def __init__(self):
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.serial_port: Optional[serial.Serial] = None
        self.is_reading = False
        self.last_scan: Optional[Dict] = None
        
    async def register(self, websocket):
        """Register a new WebSocket client."""
        self.clients.add(websocket)
        print(f"✓ Client connected. Total clients: {len(self.clients)}")
        
        # Send current state to new client
        await websocket.send(json.dumps({
            "type": "connection",
            "status": "connected",
            "serialConnected": self.serial_port is not None and self.serial_port.is_open,
            "lastScan": self.last_scan
        }))
        
    async def unregister(self, websocket):
        """Unregister a WebSocket client."""
        self.clients.discard(websocket)
        print(f"✓ Client disconnected. Total clients: {len(self.clients)}")
        
    async def broadcast(self, message: Dict):
        """Broadcast message to all connected clients."""
        if self.clients:
            message_str = json.dumps(message)
            await asyncio.gather(
                *[client.send(message_str) for client in self.clients],
                return_exceptions=True
            )
            
    async def handle_client(self, websocket, path=None):
        """Handle WebSocket client connection."""
        await self.register(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_message(websocket, data)
                except json.JSONDecodeError:
                    await websocket.send(json.dumps({
                        "type": "error",
                        "message": "Invalid JSON"
                    }))
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)
            
    async def handle_message(self, websocket, data: Dict):
        """Handle incoming WebSocket messages."""
        msg_type = data.get("type")
        
        if msg_type == "start_serial":
            await self.start_serial_reading()
        elif msg_type == "stop_serial":
            self.stop_serial_reading()
        elif msg_type == "get_status":
            await websocket.send(json.dumps({
                "type": "status",
                "serialConnected": self.serial_port is not None and self.serial_port.is_open,
                "isReading": self.is_reading,
                "lastScan": self.last_scan
            }))
        elif msg_type == "ping":
            await websocket.send(json.dumps({"type": "pong"}))
            
    def detect_serial_port(self) -> Optional[str]:
        """Detect available serial port."""
        candidates = glob('/dev/ttyACM*') + glob('/dev/ttyUSB*')
        return candidates[0] if candidates else None
        
    async def start_serial_reading(self):
        """Start reading from serial port."""
        if self.is_reading:
            return
            
        port = self.detect_serial_port()
        if not port:
            await self.broadcast({
                "type": "error",
                "message": "No serial device found. Please connect your RFID reader."
            })
            return
            
        try:
            self.serial_port = serial.Serial(port, Config.SERIAL_BAUDRATE, timeout=1)
            self.serial_port.reset_input_buffer()
            self.is_reading = True
            
            await self.broadcast({
                "type": "serial_status",
                "status": "connected",
                "port": port
            })
            
            # Start reading in background
            asyncio.create_task(self.read_serial_loop())
            
        except Exception as e:
            await self.broadcast({
                "type": "error",
                "message": f"Failed to connect to serial port: {str(e)}"
            })
            
    def stop_serial_reading(self):
        """Stop reading from serial port."""
        self.is_reading = False
        if self.serial_port and self.serial_port.is_open:
            self.serial_port.close()
        asyncio.create_task(self.broadcast({
            "type": "serial_status",
            "status": "disconnected"
        }))
        
    async def read_serial_loop(self):
        """Continuously read from serial port."""
        while self.is_reading and self.serial_port and self.serial_port.is_open:
            try:
                if self.serial_port.in_waiting > 0:
                    data = self.serial_port.readline().decode(errors="ignore").strip()
                    if data.startswith("DATA"):
                        parts = data.split(',')
                        if len(parts) >= 5:
                            scan_data = {
                                "type": "rfid_scan",
                                "label": parts[1],
                                "date": parts[2],
                                "time": parts[3],
                                "cardUid": parts[4],
                                "rfidUid": parts[4],
                                "timestamp": datetime.now().isoformat()
                            }
                            
                            self.last_scan = scan_data
                            
                            # Log scan to database
                            self.log_scan(parts[4])
                            
                            # Broadcast to all clients
                            await self.broadcast(scan_data)
                            
                await asyncio.sleep(0.1)
            except Exception as e:
                print(f"Serial read error: {e}")
                self.is_reading = False
                await self.broadcast({
                    "type": "error",
                    "message": f"Serial read error: {str(e)}"
                })
                
    def log_scan(self, rfid_uid: str):
        """Log RFID scan to database."""
        try:
            conn = sqlite3.connect(Config.DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO scan_logs (rfid_uid, scanned_at)
                VALUES (?, ?)
            """, (rfid_uid, datetime.now().isoformat()))
            
            # Update last_scanned in rfid_cards
            cursor.execute("""
                UPDATE rfid_cards SET last_scanned = ? WHERE uid = ?
            """, (datetime.now().isoformat(), rfid_uid))
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Database logging error: {e}")


# HTTP REST API
ws_server = RFIDWebSocketServer()


def require_auth(f):
    """Decorator to require authentication for API endpoints."""
    @wraps(f)
    async def wrapper(request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return web.json_response({"error": "Missing or invalid authorization header"}, status=401)
        
        token = auth_header[7:]
        user = verify_token(token)
        if not user:
            return web.json_response({"error": "Invalid or expired token"}, status=401)
        
        request['user'] = user
        return await f(request)
    return wrapper


async def login_handler(request):
    """Handle user login."""
    try:
        data = await request.json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return web.json_response({"error": "Email and password required"}, status=400)
        
        conn = sqlite3.connect(Config.DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ? AND is_active = 1", (email,))
        user = cursor.fetchone()
        
        if user and verify_password(password, user['password_hash']):
            # Update last login
            cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", 
                         (datetime.now().isoformat(), user['id']))
            conn.commit()
            conn.close()
            
            token = generate_token(user['id'])
            return web.json_response({
                "token": token,
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "name": user['name'],
                    "role": user['role']
                }
            })
        
        conn.close()
        return web.json_response({"error": "Invalid credentials"}, status=401)
        
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def register_handler(request):
    """Handle user registration."""
    try:
        data = await request.json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        role = data.get('role', 'patient')
        
        if not all([email, password, name]):
            return web.json_response({"error": "Email, password, and name required"}, status=400)
        
        if role not in ['doctor', 'patient', 'pharmacy']:
            return web.json_response({"error": "Invalid role"}, status=400)
        
        conn = sqlite3.connect(Config.DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check if email exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return web.json_response({"error": "Email already registered"}, status=400)
        
        user_id = secrets.token_hex(16)
        password_hash = hash_password(password)
        
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, email, password_hash, name, role, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        token = generate_token(user_id)
        return web.json_response({
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "role": role
            }
        }, status=201)
        
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@require_auth
async def get_profile_handler(request):
    """Get current user profile."""
    user = request['user']
    return web.json_response({"user": user})


@require_auth
async def logout_handler(request):
    """Logout user and invalidate token."""
    auth_header = request.headers.get('Authorization', '')
    token = auth_header[7:] if auth_header.startswith('Bearer ') else ''
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM auth_tokens WHERE token = ?", (token,))
    conn.commit()
    conn.close()
    
    return web.json_response({"message": "Logged out successfully"})


# Patient endpoints
@require_auth
async def get_patients_handler(request):
    """Get all patients."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients ORDER BY name")
    patients = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return web.json_response({"patients": patients})


@require_auth
async def create_patient_handler(request):
    """Create a new patient."""
    try:
        data = await request.json()
        patient_id = secrets.token_hex(16)
        now = datetime.now().isoformat()
        
        conn = sqlite3.connect(Config.DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO patients (id, name, date_of_birth, gender, contact, email, address, rfid_uid, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            data.get('name'),
            data.get('dateOfBirth'),
            data.get('gender'),
            data.get('contact'),
            data.get('email'),
            data.get('address'),
            data.get('rfidUid'),
            now, now
        ))
        conn.commit()
        conn.close()
        
        return web.json_response({"id": patient_id, "message": "Patient created successfully"}, status=201)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@require_auth
async def get_patient_handler(request):
    """Get patient by ID or RFID UID."""
    patient_id = request.match_info.get('id')
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Try to find by ID or RFID UID
    cursor.execute("SELECT * FROM patients WHERE id = ? OR rfid_uid = ?", (patient_id, patient_id))
    patient = cursor.fetchone()
    
    if patient:
        # Also get prescriptions
        cursor.execute("SELECT * FROM prescriptions WHERE patient_id = ?", (patient['id'],))
        prescriptions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        result = dict(patient)
        result['prescriptions'] = prescriptions
        return web.json_response(result)
    
    conn.close()
    return web.json_response({"error": "Patient not found"}, status=404)


@require_auth
async def update_patient_handler(request):
    """Update patient data."""
    patient_id = request.match_info.get('id')
    data = await request.json()
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE patients SET 
            name = COALESCE(?, name),
            date_of_birth = COALESCE(?, date_of_birth),
            gender = COALESCE(?, gender),
            contact = COALESCE(?, contact),
            email = COALESCE(?, email),
            address = COALESCE(?, address),
            rfid_uid = COALESCE(?, rfid_uid),
            updated_at = ?
        WHERE id = ?
    """, (
        data.get('name'),
        data.get('dateOfBirth'),
        data.get('gender'),
        data.get('contact'),
        data.get('email'),
        data.get('address'),
        data.get('rfidUid'),
        datetime.now().isoformat(),
        patient_id
    ))
    
    conn.commit()
    conn.close()
    
    return web.json_response({"message": "Patient updated successfully"})


# RFID Card endpoints
@require_auth
async def get_rfid_cards_handler(request):
    """Get all RFID cards."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.*, p.name as patient_name 
        FROM rfid_cards r 
        LEFT JOIN patients p ON r.patient_id = p.id
        ORDER BY r.registered_at DESC
    """)
    cards = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return web.json_response({"cards": cards})


@require_auth
async def register_rfid_card_handler(request):
    """Register a new RFID card."""
    data = await request.json()
    uid = data.get('uid')
    label = data.get('label', 'Unnamed Card')
    patient_id = data.get('patientId')
    
    if not uid:
        return web.json_response({"error": "RFID UID required"}, status=400)
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO rfid_cards (uid, label, patient_id, registered_at)
            VALUES (?, ?, ?, ?)
        """, (uid, label, patient_id, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        
        # Broadcast new card registration
        await ws_server.broadcast({
            "type": "card_registered",
            "uid": uid,
            "label": label,
            "patientId": patient_id
        })
        
        return web.json_response({"message": "Card registered successfully"}, status=201)
    except sqlite3.IntegrityError:
        conn.close()
        return web.json_response({"error": "Card UID already registered"}, status=400)


@require_auth
async def update_rfid_card_handler(request):
    """Update RFID card (rename or link to patient)."""
    uid = request.match_info.get('uid')
    data = await request.json()
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE rfid_cards SET 
            label = COALESCE(?, label),
            patient_id = ?
        WHERE uid = ?
    """, (data.get('label'), data.get('patientId'), uid))
    
    conn.commit()
    conn.close()
    
    return web.json_response({"message": "Card updated successfully"})


@require_auth
async def delete_rfid_card_handler(request):
    """Delete/deactivate RFID card."""
    uid = request.match_info.get('uid')
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE rfid_cards SET is_active = 0 WHERE uid = ?", (uid,))
    conn.commit()
    conn.close()
    
    return web.json_response({"message": "Card deactivated successfully"})


# Prescription endpoints
@require_auth
async def get_prescriptions_handler(request):
    """Get prescriptions with optional filters."""
    patient_id = request.query.get('patientId')
    doctor_id = request.query.get('doctorId')
    status = request.query.get('status')
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = "SELECT * FROM prescriptions WHERE 1=1"
    params = []
    
    if patient_id:
        query += " AND patient_id = ?"
        params.append(patient_id)
    if doctor_id:
        query += " AND doctor_id = ?"
        params.append(doctor_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    
    query += " ORDER BY date_issued DESC"
    cursor.execute(query, params)
    prescriptions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return web.json_response({"prescriptions": prescriptions})


@require_auth
async def create_prescription_handler(request):
    """Create a new prescription."""
    user = request['user']
    if user['role'] not in ['doctor', 'admin']:
        return web.json_response({"error": "Only doctors can create prescriptions"}, status=403)
    
    data = await request.json()
    prescription_id = secrets.token_hex(16)
    barcode = f"RX-{secrets.token_hex(8).upper()}"
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO prescriptions (id, patient_id, doctor_id, medication, dosage, frequency, date_issued, date_expires, status, notes, barcode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        prescription_id,
        data.get('patientId'),
        user['id'],
        data.get('medication'),
        data.get('dosage'),
        data.get('frequency'),
        datetime.now().isoformat(),
        data.get('dateExpires'),
        'active',
        data.get('notes'),
        barcode
    ))
    
    conn.commit()
    conn.close()
    
    return web.json_response({
        "id": prescription_id,
        "barcode": barcode,
        "message": "Prescription created successfully"
    }, status=201)


@require_auth
async def verify_prescription_handler(request):
    """Verify prescription using barcode or ID."""
    prescription_id = request.match_info.get('id')
    user = request['user']
    
    if user['role'] not in ['pharmacy', 'admin']:
        return web.json_response({"error": "Only pharmacists can verify prescriptions"}, status=403)
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Find by ID or barcode
    cursor.execute("""
        SELECT p.*, pt.name as patient_name, u.name as doctor_name
        FROM prescriptions p
        JOIN patients pt ON p.patient_id = pt.id
        JOIN users u ON p.doctor_id = u.id
        WHERE p.id = ? OR p.barcode = ?
    """, (prescription_id, prescription_id))
    
    prescription = cursor.fetchone()
    
    if prescription:
        # Mark as verified
        cursor.execute("""
            UPDATE prescriptions SET verified_at = ?, verified_by = ?
            WHERE id = ?
        """, (datetime.now().isoformat(), user['id'], prescription['id']))
        conn.commit()
        conn.close()
        
        result = dict(prescription)
        result['verified'] = True
        return web.json_response(result)
    
    conn.close()
    return web.json_response({"error": "Prescription not found"}, status=404)


# Scan logs endpoint
@require_auth
async def get_scan_logs_handler(request):
    """Get RFID scan logs."""
    limit = int(request.query.get('limit', 100))
    
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.*, r.label, p.name as patient_name
        FROM scan_logs s
        LEFT JOIN rfid_cards r ON s.rfid_uid = r.uid
        LEFT JOIN patients p ON r.patient_id = p.id
        ORDER BY s.scanned_at DESC
        LIMIT ?
    """, (limit,))
    
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return web.json_response({"logs": logs})


# Health check endpoint
async def health_handler(request):
    """Health check endpoint."""
    return web.json_response({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "websocket_clients": len(ws_server.clients),
        "serial_connected": ws_server.serial_port is not None and ws_server.serial_port.is_open
    })


def create_app():
    """Create and configure the aiohttp application."""
    app = web.Application()
    
    # Setup CORS
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods="*"
        )
    })
    
    # Add routes
    routes = [
        # Health check
        web.get('/health', health_handler),
        
        # Auth routes
        web.post('/api/auth/login', login_handler),
        web.post('/api/auth/register', register_handler),
        web.get('/api/auth/profile', get_profile_handler),
        web.post('/api/auth/logout', logout_handler),
        
        # Patient routes
        web.get('/api/patients', get_patients_handler),
        web.post('/api/patients', create_patient_handler),
        web.get('/api/patients/{id}', get_patient_handler),
        web.put('/api/patients/{id}', update_patient_handler),
        
        # RFID card routes
        web.get('/api/rfid/cards', get_rfid_cards_handler),
        web.post('/api/rfid/cards', register_rfid_card_handler),
        web.put('/api/rfid/cards/{uid}', update_rfid_card_handler),
        web.delete('/api/rfid/cards/{uid}', delete_rfid_card_handler),
        
        # Prescription routes
        web.get('/api/prescriptions', get_prescriptions_handler),
        web.post('/api/prescriptions', create_prescription_handler),
        web.post('/api/prescriptions/{id}/verify', verify_prescription_handler),
        
        # Scan logs
        web.get('/api/scan-logs', get_scan_logs_handler),
    ]
    
    # Add routes to app
    app.add_routes(routes)
    
    # Configure CORS for all routes
    for route in list(app.router.routes()):
        cors.add(route)
    
    return app


async def main():
    """Main entry point."""
    print("=" * 50)
    print("MedSync RFID Server")
    print("=" * 50)
    
    # Initialize database
    init_database()
    
    # Start WebSocket server
    print(f"✓ Starting WebSocket server on ws://localhost:{Config.WEBSOCKET_PORT}")
    ws_server_task = await serve(ws_server.handle_client, "localhost", Config.WEBSOCKET_PORT)
    
    # Start HTTP server
    print(f"✓ Starting HTTP API server on http://localhost:{Config.HTTP_PORT}")
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', Config.HTTP_PORT)
    await site.start()
    
    print("-" * 50)
    print("Server is running. Press Ctrl+C to stop.")
    print("-" * 50)
    print("\nDefault credentials:")
    print("  Admin: admin@medsync.local / admin123")
    print("  Doctor: doctor@medsync.local / doctor123")
    print("-" * 50)
    
    # Keep running
    await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped.")
