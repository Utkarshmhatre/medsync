#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN 9
#define SS_PIN 10

MFRC522 mfrc522(SS_PIN, RST_PIN);

String lastUID = "";
unsigned long lastScanTime = 0;
unsigned long debounceDelay = 2000; // 2 sec delay to avoid spam

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
}

String getUID(MFRC522::Uid uid) {
  String uidString = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) uidString += "0";
    uidString += String(uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();
  return uidString;
}

void loop() {
  // No new card present
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  // Extract UID
  String currentUID = getUID(mfrc522.uid);

  // Debounce (avoid sending same UID repeatedly)
  if (currentUID == lastUID && millis() - lastScanTime < debounceDelay) {
    return;
  }

  lastUID = currentUID;
  lastScanTime = millis();

  // Create date + time strings for your Python app
  // Arduino doesn't have real time, so we send placeholders:
  String dateStr = "NA";
  String timeStr = "NA";

  // Format Python expects:
  // DATA,<label>,<date>,<time>,<rfid_uid>
  String output = "DATA,Unknown," + dateStr + "," + timeStr + "," + currentUID;

  Serial.println(output);

  // Halt PICC
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}