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

SerialPort.list().then((ports) => {
  ports.forEach(function (port) {
    console.dir(port);
    //look for device in list
    serialDevices.forEach((device) => {
      var serialDevice = device;
      if (match(port, device)) {
        console.log("connecting to", port.path);
        var serialPort = new SerialPort(port.path, {
          baudRate: device.baudRate,
        });

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
                  var dataArray = new Uint8Array(data);
                  var dataView = new DataView(dataArray.buffer);
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

                      var canTimestamp =
                        dataView.getUint32(2) * 1000 + dataView.getUint16(6);

                      if (SensorEventUtils.canBusTimeOffset == null) {
                        SensorEventUtils.canBusTimeOffset =
                          message.serverTimeMs - canTimestamp;
                      }

                      var id = dataView.getUint32(8);
                      var values = [];
                      var dataLength = dataView.getUint8(12);
                      var systemTime =
                        canTimestamp + SensorEventUtils.canBusTimeOffset;

                      //filter vehicle speed, steering angle, and wheel speeds
                      //send on
                      if ([0x309, 0x156, 0x158, 0x1d0].includes(id)) {
                        if (characteristic._updateValueCallback) {
                          characteristic._updateValueCallback(dataArray);
                        }
                      }
                      switch (id) {
                        case 0x309:
                          //vehicleSpeed
                          var vehicleSpeedCan = dataView.getUint16(17);
                          var vehicleSpeed = Number(vehicleSpeedCan) / 360;
                          values = [
                            vehicleSpeed,
                            0,
                            0,
                            vehicleSpeed,
                            vehicleSpeed,
                            vehicleSpeed,
                            vehicleSpeed,
                          ];
                          values.push(vehicleSpeed);
                          return new SensorEvent(systemTime, 65667, values);
                        //               case 0x156:
                        //                 //steering wheel angle
                        //                 values.push(Number(dataView.getInt16(13)) / 360);
                        //                 return new SensorEvent(systemTime, id, values);
                        //               case 0x158:
                        //                 //wheel speed
                        //                 values.push(Number(dataView.getUint16(13)) / 360);
                        //                 values.push(Number(dataView.getUint16(17)) / 360);
                        //                 return new SensorEvent(systemTime, id, values);
                        //               case 0x1d0:
                        //                 values.push(Number(dataView.getUint16(13)) / 360);
                        //                 values.push(Number(dataView.getUint16(17)) / 360);
                        //                 return new SensorEvent(systemTime, id, values);
                        default:
                          if (dataLength < dataArray.length - 12) {
                            values = Array.from(
                              new Uint8Array(dataArray.buffer, 13, dataLength)
                            );
                          }
                          return null;
                        //return new SensorEvent(message.serverTimeMs,id,values);
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
              var message = {
                id: serialDevice.name,
                path: port.path,
                data: data,
              };
              // send on BLE
              break;
          }
        });
      }
    });
  });
});

var mockCanlogger = require("./mock-canlogger.json");

let i = 0;
setInterval(() => {
  // console.log("testing BLE");
  canloggerMessage = mockCanlogger[i++];
  if (i == mockCanlogger.length) {
    i = 0;
  }
  // console.log(canloggerMessage);
  if (characteristic._updateValueCallback && canloggerMessage.data) {
    dataArray = new Uint8Array(canloggerMessage.data.data);
    var dataView = new DataView(dataArray.buffer);
    var id = dataView.getUint32(8);
    var dataLength = dataView.getUint8(12);
    //if ([0x309, 0x156, 0x158, 0x1d0].includes(id)) {
      if (characteristic._updateValueCallback) {
        characteristic._updateValueCallback(dataArray);
      }
    //}
  }
}, 1000);

//bleno
var bleno = require("rpi-fix-bleno");

var BlenoPrimaryService = bleno.PrimaryService;

var EchoCharacteristic = require("./characteristic");

var characteristic = new EchoCharacteristic();

console.log("bleno - echo");

bleno.on("stateChange", function (state) {
  console.log("on -> stateChange: " + state);

  if (state === "poweredOn") {
    bleno.startAdvertising("nst-serial", ["097eb207-a128-49bb-a5e0-d3fe45100000"]);
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
