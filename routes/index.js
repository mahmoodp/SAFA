var express = require('express');
var router = express.Router();
var request = require('request');
var async = require("async");



/* GET home page. */
router.get('/',function(req,res){
    res.render('index');
    //  res.render('index', { title: 'Express' });
});




//Add device to IoT Ticket
router.post('/AddDevice', function(req, res,next) {
    var flag = 0;
    async.series([

        function (callback) {
            const username = '******';
            const password = '******';

            var NameOfDevice = req.body.name;

            var MesDeviceData = {
                'name': NameOfDevice,
                'manufacturer': req.body.manufacturer,
                'type': req.body.type,
                'description': req.body.description
                // "attributes":[{ "key":"Application Version", "value": "0.2.3"}, {"key":"Chip","value":"Corei7"}]
            };

            var options = {
                method: 'GET',
                json: true,
                url: 'https://' + username + ':' + password + '@my.iot-ticket.com/api/v1/devices/?limit=50',
                headers: {
                    'Content-Type': 'application/json'
                }
            };


            //Get current devices to check if the device already exists
            request(options, function (err, res) {
                if (!err && res.statusCode === 200) {
                    var devicenum = res.body.items.length;
                    for (var i = 0; i < devicenum; i++) {
                        if (res.body.items[i].name === NameOfDevice) {
                            flag = 1;
                            console.log('Device already exists.');
                            console.log('----------------------------');
                            break;
                        } else if (i === devicenum - 1) {
                            console.log('Creating new device');
                            console.log('----------------------------');
                            var options1 = {
                                method: 'POST',
                                body: MesDeviceData,
                                json: true,
                                url: 'https://' + username + ':' + password + '@my.iot-ticket.com/api/v1/devices/',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            };
                            request(options1, function (err, res, body) {
                                if (!err && res.statusCode === 201) {
                                    // Print out the response body
                                    console.log("Successfully sent ");
                                    console.log(res.body);
                                }
                                else {
                                    console.log("error: " + err);
                                }
                            });
                        }
                    }

                }
                else {
                    console.log("error: " + err);
                }
                callback();
            });
        }

    ], function (err) {
        if (err) return next(err);
        if (flag === 0) {
            res.send('New device added to IoT_Ticket.');
        } else {
            res.send('Device already exists.');
        }
    });

});
module.exports = router;
