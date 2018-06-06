
var awsIot = require('aws-iot-device-sdk');


var device = awsIot.device({
    keyPath: './sdk/private.pem.key',
    certPath: './sdk/certificate.pem.crt',
    caPath: './sdk/caCert.crt',
    clientId: 'Test',
    region: 'us-west-2',
    host:   'https://a2eevwwnr9qezw.iot.us-west-2.amazonaws.com'
});


device.on('connect', function() {
    console.log('connected');
});