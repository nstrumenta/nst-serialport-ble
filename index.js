var SerialPort = require("serialport");
var argv = require("minimist")(process.argv.slice(2));

var serialDevices = [
  {
    name: "bluecoin",
    vendorId: "0483",
    productId: "5740",
    baudRate: 115200,
  },
  {
    name: "nucleo",
    vendorId: "0483",
    productId: "374b",
    baudRate: 9600,
  },
  {
    name: "canlogger",
    vendorId: "1cbe",
    productId: "021a",
    baudRate: 115200,
  },
  {
    name: "trax",
    vendorId: "0403",
    productId: "6015",
    baudRate: 38600,
  },
  {
    name: "teseo",
    vendorId: "067b",
    productId: "2303",
    baudRate: 115200,
  },
];

var fs = require("fs");
if (fs.existsSync("nst-serialport-config.json")) {
  console.log("nst-serialport-config.json begin:");
  var config = JSON.parse(
    fs.readFileSync("nst-serialport-config.json", "utf8")
  );
  config.devices.forEach((element) => {
    console.dir(element);
    serialDevices.push(element);
  });
  console.log("nst-serialport-config.json end");
}

function match(port, device) {
  var match = false;
  //match on path from config file
  if (device.path) {
    match = device.path == port.path;
  }
  //match on vId and pId
  match =
    port.vendorId &&
    port.vendorId.toLowerCase() == device.vendorId &&
    port.productId &&
    port.productId.toLowerCase() == device.productId;
  return match;
}

const serialPorts = new Map();

const connectToPeripherals = () => {
  SerialPort.list().then((ports) => {
    ports.forEach(function (port) {
      console.dir(port);
      //look for device in list
      serialDevices.forEach((device) => {
        const serialDevice = device;
        if (match(port, device)) {
          console.log("connecting to", port.path);
          const serialPort = new SerialPort(port.path, {
            baudRate: device.baudRate,
          });

          //adds to the map for closing in unsubscribe
          serialPorts.set(device.name, serialPort);

          serialPort.on("open", function () {
            console.log("open", device.name);
          });
          serialPort.on("error", function (err) {
            console.error(err);
          });

          console.log(serialDevice.name);
          serialPort.on("data", function (data) {
            switch (serialDevice.name) {
              case "canlogger":
                if (message.id == "canlogger") {
                  try {
                    const dataArray = new Uint8Array(data);
                    const dataView = new DataView(dataArray.buffer);
                    if (dataView.getUint8(0) == 0x7e) {
                      //start bit
                      if (dataView.getUint8(1) == 0x01) {
                        // Received CAN-bus message
                        // Description: The application data contain a CAN-bus message received by the logger. Format:
                        // ID 1
                        // Time 4 byte
                        // Time ms 2 byte
                        // Message ID 4 byte
                        // Data length 1 byte
                        // Data 0-8 byte
                        // The Time field is encoded as ”Epoch” seconds. The message ID is extended if bit 29 (indexed from zero) is set. Multi-byte fields shall be interpreted MSB (Most-Significant- Byte) first.

                        //filter vehicle speed, steering angle, and wheel speeds
                        //send on
                        if ([0x309, 0x156, 0x158, 0x1d0].includes(id)) {
                          if (characteristic?._updateValueCallback) {
                            characteristic._updateValueCallback(dataArray);
                          }
                        }
                      }
                    }
                  } catch (err) {
                    console.log(err);
                  }
                }
                break;
              default:
                console.log(serialDevice.name);
                console.log(data);
                // send on BLE
                break;
            }
          });
        }
      });
    });
  });
};

//bleno
var bleno = require("bleno-mac");

var BlenoPrimaryService = bleno.PrimaryService;

var EchoCharacteristic = require("./characteristic");

var characteristic = new EchoCharacteristic();

console.log("bleno - echo");

characteristic.onSubscribe = () => {
  console.log("onSubscribe");
  connectToPeripherals();
};

characteristic.onUnsubscribe = () => {
  console.log("onUnsubscribe");
  serialPorts.forEach((serialPort, name) =>
    serialPort.close(() => {
      console.log("closed", name, serialPort);
    })
  );
  serialPorts.clear();
};

bleno.on("stateChange", function (state) {
  console.log("on -> stateChange: " + state);

  if (state === "poweredOn") {
    bleno.startAdvertising("nst-serialport-ble", [
      "097eb207-a128-49bb-a5e0-d3fe45100000",
    ]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on("advertisingStart", function (error) {
  console.log(
    "on -> advertisingStart: " + (error ? "error " + error : "success")
  );

  if (!error) {
    bleno.setServices([
      new BlenoPrimaryService({
        uuid: "097eb207-a128-49bb-a5e0-d3fe45100000",
        characteristics: [characteristic],
      }),
    ]);
  }
});
