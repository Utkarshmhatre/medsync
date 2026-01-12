
import serial
from datetime import datetime

PORT = "/dev/ttyACM0"
BAUD = 9600

print(f"Connecting to {PORT} at {BAUD} baud...")
print("Scan an RFID card (Ctrl+C to exit)\n")

with serial.Serial(PORT, BAUD, timeout=1) as s:
    s.reset_input_buffer()
    while True:
        try:
            line = s.readline().decode(errors="ignore").strip()
            if not line:
                continue
            
            print(f"Raw: {line}")
            
            # Parse DATA format from sketch: DATA,<label>,<date>,<time>,<uid>
            if line.startswith("DATA"):
                parts = line.split(",")
                if len(parts) >= 5:
                    label = parts[1]
                    date = parts[2]
                    time_str = parts[3]
                    uid = parts[4]
                    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"  ✓ Card detected!")
                    print(f"    UID:   {uid}")
                    print(f"    Label: {label}")
                    print(f"    Time:  {now}\n")
            # Also handle simple UID format (test sketch)
            elif line.startswith("UID:"):
                uid = line.split(":")[1].strip()
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"  ✓ Card detected (simple format)!")
                print(f"    UID:  {uid}")
                print(f"    Time: {now}\n")
        except KeyboardInterrupt:
            print("\nExiting...")
            break
