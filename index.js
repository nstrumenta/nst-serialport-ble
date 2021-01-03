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

setInterval(() => {
  console.log("testing BLE");
}, 1000);
