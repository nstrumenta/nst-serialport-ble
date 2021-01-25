# nst-serialport
Reads data from the serial port and sends messages to a websocket server.

Intended to be used with the server here:
https://github.com/nstrumenta/nst-websockets.git


## Installation

```bash
npm install -g nst-serialport
```

## Configuration

local file ```nst-serialport-config.json``` can specify multiple devices with comName, name, and baudRate

```json
{
  "devices": [
    {
      "comName": "COM42",
      "name": "u-blox",
      "baudRate": 38600
    },
    {
      "comName": "COM13",
      "name": "can",
      "baudRate": 115200
    }
  ]
}
```

## How to use

```bash
nst-serialport --port 8080
```

```bash
$ nst-serialport --port 8080
connected to server
{ comName: '/dev/tty.usbmodem141103',
  manufacturer: 'STMicroelectronics',
  serialNumber: '0672FF504955857567203333',
  pnpId: undefined,
  locationId: '14110000',
  vendorId: '0483',
  productId: '374b' }
connecting to /dev/tty.usbmodem141103
nucleo
Open
```


## RPi installation as BLE Peripheral for canlogger
the rPi bleno requires special dependencies
use the rpi branch - the main branch works on macOS x86 (hasn't been tested on M1, and may require some changes to get bleno working)

* install raspbian
https://www.raspberrypi.org/blog/raspberry-pi-imager-imaging-utility/

sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev

https://www.raspberrypi.org/blog/raspberry-pi-imager-imaging-utility/


https://www.raspberrypi.org/documentation/installation/installing-images/mac.md

https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md

git clone https://github.com/nstrumenta/nst-serialport-ble.git

sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev

https://www.raspberrypi.org/forums/viewtopic.php?t=229881


### to start on boot
add this to `/etc/rc.local`:

cd /home/pi/nst-serialport-ble
/node-v11.6.0-linux-armv6l/bin/node index > logs/$(date -u +"%FT%H%MZ").log &