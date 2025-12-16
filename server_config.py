# MedSync Server Configuration
# Edit these values to match your setup

# Network Configuration
WEBSOCKET_PORT = 8000
HTTP_PORT = 8001

# Serial Port Configuration (Arduino)
# Leave empty for auto-detection, or specify a port like:
# Linux: /dev/ttyACM0 or /dev/ttyUSB0
# Windows: COM3, COM4, etc.
# macOS: /dev/tty.usbmodem* or /dev/tty.usbserial*
SERIAL_PORT = ""
SERIAL_BAUDRATE = 9600

# Database
DATABASE_PATH = "medsync.db"

# Security (change in production!)
# Set MEDSYNC_SECRET_KEY environment variable or it will auto-generate
SECRET_KEY = ""
TOKEN_EXPIRY_HOURS = 24
