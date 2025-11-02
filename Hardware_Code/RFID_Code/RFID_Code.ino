#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9
#define INDICATOR 6
#define Red_Led 7
#define BUZZER 8

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

void setup() {
  Serial.begin(9600);

  pinMode(INDICATOR, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  SPI.begin();
  rfid.PCD_Init();

  // Set the default key
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

  digitalWrite(Red_Led,HIGH);
  delay(1000);
  digitalWrite(Red_Led,LOW);

}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();
    if (command == ';') {
      writeData();
    } else if (command == '-') {
      printData();
    }
  }
}

void writeData() {
  while (true) {
    // Exit condition
    if (Serial.available() > 0 && Serial.peek() == ':') {
      Serial.read();  // remove ':'
      // Serial.println(F("\n[WRITE MODE EXITED]"));
      break;
    }

    // Check for new card
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      digitalWrite(Red_Led, HIGH);  // Card detected
      // Serial.println(F("\nCard detected! Ready to write."));
      // Serial.println(F("Enter data (max 16 chars), then press ENTER:"));

      String dataToWrite = waitForInput();

      if (dataToWrite.length() == 0) {
        // Serial.println(F(" No input received, skipping..."));
        digitalWrite(Red_Led, LOW);
        continue;
      }

      if (dataToWrite.length() > 16) {
        dataToWrite = dataToWrite.substring(0, 16);
      }

      writeBlock(4, dataToWrite);

      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();

      digitalWrite(Red_Led, LOW);
      // Serial.println(F("Waiting for next card or ':' to exit..."));
    }

    delay(100);
  }
}

String waitForInput() {
  String input = "";
  unsigned long startTime = millis();
  while ((millis() - startTime) < 10000) {  // 10 second timeout
    if (Serial.available() > 0) {
      input = Serial.readStringUntil('\n');
      input.trim();
      return input;
    }
  }
  return "";
}

void writeBlock(byte blockAddr, String data) {
  MFRC522::StatusCode status;

  // Authenticate the card
  status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockAddr, &key, &(rfid.uid));
  if (status != MFRC522::STATUS_OK) {
    // Serial.print(F("Auth failed: "));
    // Serial.println(rfid.GetStatusCodeName(status));
    return;
  }

  byte buffer[18];
  memset(buffer, 0, sizeof(buffer));
  data.getBytes(buffer, 18);

  // Attempt to write data
  status = rfid.MIFARE_Write(blockAddr, buffer, 16);
  if (status == MFRC522::STATUS_OK) {
    // Serial.print(F("Data written to block "));
    // Serial.print(blockAddr);
    // Serial.print(F(": "));
    // Serial.println(data);

    digitalWrite(INDICATOR, HIGH);
    digitalWrite(BUZZER, HIGH);
    delay(300);  
    digitalWrite(INDICATOR, LOW);
    digitalWrite(BUZZER, LOW);
  } else {
    // Serial.print(F(" Write failed: "));
    Serial.println(rfid.GetStatusCodeName(status));
    for (int i = 0; i < 2; i++) {
      digitalWrite(INDICATOR, HIGH);
      delay(100);
      digitalWrite(INDICATOR, LOW);
      delay(100);
    }
  }
}


void printData() {
  while (true) {
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      byte blockAddr = 4;  // Block address to read from
      byte buffer[18] = { 0 };
      byte size = sizeof(buffer);
      MFRC522::StatusCode status;

      // Authenticate
      status = rfid.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockAddr, &key, &(rfid.uid));
      if (status != MFRC522::STATUS_OK) {
        // Serial.print(F("PCD_Authenticate() failed: "));
        // Serial.println(rfid.GetStatusCodeName(status));
        rfid.PICC_HaltA();  // Halt the card and continue reading
        rfid.PCD_StopCrypto1();
        continue;
      }

      // Read data from the block
      status = rfid.MIFARE_Read(blockAddr, buffer, &size);
      if (status != MFRC522::STATUS_OK) {
        // Serial.print(F("MIFARE_Read() failed: "));
        // Serial.println(rfid.GetStatusCodeName(status));
      } else {
        // Print data from the block
        String readData = "";
        for (byte i = 0; i < 16; i++) {
          if (buffer[i] == '#' || buffer[i] == '$') {
            break;  // Stop reading when '#' or '$' is encountered
          }
          if (buffer[i] >= 32 && buffer[i] <= 126) {  // Only add printable characters
            readData += (char)buffer[i];
          }
        }

        Serial.println(readData);  // Print the filtered data
      }

      // Buzzer and LED indicators
      digitalWrite(INDICATOR, HIGH);
      digitalWrite(BUZZER, HIGH);
      delay(50);
      digitalWrite(INDICATOR, LOW);
      digitalWrite(BUZZER, LOW);
    }

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    if (Serial.available() > 0) {
      char command = Serial.read();
      if (command == '_') {
        break;
      }
    }
  }
}