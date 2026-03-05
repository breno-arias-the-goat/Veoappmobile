const qrcode = require('qrcode-terminal');
qrcode.generate('exp://192.168.15.25:8081', { small: true });
