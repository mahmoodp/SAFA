const opcua = require("node-opcua");
const async = require("async");
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const index = require('./routes/index');
const app = express();
const port = 4500;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

//declare new client
let client = new opcua.OPCUAClient();
let endpointUrl = "opc.tcp://WS-11551-LT.INTRA.TUT.FI:4334/UA/MyLittleServer";
let the_session = null;
let io = require('socket.io').listen(app.listen(port));


io.sockets.on('connection', function (socket) {
});


// function to subscribe to nodes
function testMonitor(id){

    let newSub = new opcua.ClientSubscription(the_session,{
            requestedPublishingInterval: 10000,
            requestedLifetimeCount: 10,
            requestedMaxKeepAliveCount: 2,
            maxNotificationsPerPublish: 10,
            publishingEnabled: true,
            priority: 10
        });
    let monitoredItem  = newSub.monitor({
            nodeId: opcua.resolveNodeId(id),
            attributeId: opcua.AttributeIds.Value
        },
        { 
            samplingInterval: 10000,
            discardOldest: true,
            queueSize: 10 
        });

        monitoredItem.on("changed",function(value){
           console.log(id, " New Value = ",value.toString());
            io.sockets.emit('message', {
                value: value,
                browseName: id.substr(7)

            });
        });

}

async.series([


    // step 1 : connect to
    function(callback)  {

        client.connect(endpointUrl,function (err) {

            if(err) {
                console.log(" cannot connect to endpoint :" , endpointUrl );
            } else {
                console.log("connected !");
            }
            callback(err);
        });
    },
    // step 2 : createSession
    function(callback) {
        client.createSession( function(err,session) {
            if(!err) {
                the_session = session;
            }
            callback(err);
        });

    },


       //
    // -----------------------------------------
    // create subscription
    function(callback) {

        testMonitor("ns=1;s=Tampere_Temp");
        testMonitor("ns=1;s=Tampere_Humi");
        testMonitor("ns=1;s=Tampere_Pres");

    },
    // ------------------------------------------------
    // closing session

    function(callback) {
        console.log(" closing session");
        the_session.close(function(err){

            console.log(" session closed");
            callback();
        });
    }


],
    function(err) {
        if (err) {
            console.log(" failure ",err);
        } else {
            console.log("done!")
        }
        client.disconnect(function(){});
    }) ;

console.log("Listening on port " + port);