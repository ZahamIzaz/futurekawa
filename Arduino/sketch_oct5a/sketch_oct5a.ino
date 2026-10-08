#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>

// ==========================
// DHT22
// ==========================
#define DHTPIN D2
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

// ==========================
// WIFI
// ==========================
const char* WIFI_SSID = "A54 de Aziz";
const char* WIFI_PASSWORD = "Aziz2626";

// ==========================
// MQTT FUTUREKAWA
// ==========================
const char* MQTT_SERVER = "10.218.131.47";
const int MQTT_PORT = 1883;

const char* MQTT_TOPIC =
  "futurekawa/brazil/BR-WH-01/measurements";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);


// ==========================
// WIFI
// ==========================
void connectWiFi() {

  Serial.print("Connexion WiFi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connecte");

  Serial.print("Adresse IP ESP8266 : ");
  Serial.println(WiFi.localIP());
}


// ==========================
// MQTT
// ==========================
void connectMQTT() {

  while (!mqttClient.connected()) {

    Serial.print("Connexion Mosquitto... ");

    if (mqttClient.connect("ESP8266-BR-WH-01")) {

      Serial.println("OK");

    } else {

      Serial.print("ECHEC, code=");
      Serial.println(mqttClient.state());

      delay(3000);
    }
  }
}


// ==========================
// TIMESTAMP UTC
// ==========================
void configureTime() {

  // UTC
  configTime(
    0,
    0,
    "pool.ntp.org",
    "time.nist.gov"
  );

  Serial.print("Synchronisation heure");

  time_t now = time(nullptr);

  while (now < 1000000000) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  Serial.println();
  Serial.println("Heure synchronisee");
}


void setup() {

  Serial.begin(115200);

  dht.begin();

  connectWiFi();

  mqttClient.setServer(
    MQTT_SERVER,
    MQTT_PORT
  );

  configureTime();
}


void loop() {

  // Reconnexion WiFi
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Reconnexion MQTT
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  mqttClient.loop();


  // ==========================
  // Lecture capteur
  // ==========================
  float temperature =
    dht.readTemperature();

  float humidity =
    dht.readHumidity();


  if (isnan(temperature) || isnan(humidity)) {

    Serial.println(
      "Erreur lecture DHT22"
    );

    delay(2000);
    return;
  }


  // ==========================
  // Timestamp ISO UTC
  // ==========================
  time_t now = time(nullptr);

  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);

  char timestamp[30];

  strftime(
    timestamp,
    sizeof(timestamp),
    "%Y-%m-%dT%H:%M:%SZ",
    &timeinfo
  );


  // ==========================
  // JSON FutureKawa
  // ==========================
  char payload[220];

  snprintf(
    payload,
    sizeof(payload),

    "{"
      "\"warehouseId\":\"BR-WH-01\","
      "\"countryCode\":\"BRA\","
      "\"temperature\":%.2f,"
      "\"humidity\":%.2f,"
      "\"timestamp\":\"%s\""
    "}",

    temperature,
    humidity,
    timestamp
  );


  // ==========================
  // Publication MQTT
  // ==========================
  Serial.println();
  Serial.print("MQTT -> ");
  Serial.println(MQTT_TOPIC);

  Serial.print("JSON -> ");
  Serial.println(payload);


  bool published =
    mqttClient.publish(
      MQTT_TOPIC,
      payload
    );


  if (published) {
    Serial.println("Publication OK");
  } else {
    Serial.println("Publication ECHEC");
  }


  // Une mesure toutes les 10 secondes
  delay(10000);
}