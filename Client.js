/*global require,console,setTimeout */
var express = require('express');
var app = express();
var port = 3700;
var opcua = require("node-opcua");
var async = require("async");
const os = require('os');

var client = new opcua.OPCUAClient();
var endpointUrl = "opc.tcp://" + os.hostname() + ":4334/UA/MyLittleServer";
var nodeIdToMonitor = "ns=1;s=free_memory";


var the_session, the_subscription;

console.log(endpointUrl);

/*function startHTTPServer() {

    app.get("/", function(req, res){
        res.send("It works!");
    });

    app.use(express.static(__dirname + '/'));

    io.listen(app.listen(port));

    io.sockets.on('connection', function (socket) {
//        socket.on('send', function (data) {
//            io.sockets.emit('message', data);
//        });
    });

    var monitoredItem = the_subscription.monitor(
        {
            nodeId: nodeIdToMonitor,
            attributeId: 13
        },
        {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 100
        },opcua.read_service.TimestampsToReturn.Both,function(err) {
            if (err) {
                console.log("Monitor  "+ nodeIdToMonitor.toString() +  " failed");
                console.loo("ERr = ",err.message);
            }

        });

    monitoredItem.on("changed", function(dataValue){

        //xx console.log(" value has changed " +  dataValue.toString());

        io.sockets.emit('message', {
            value: dataValue.value.value,
            timestamp: dataValue.serverTimestamp,
            nodeId: nodeIdToMonitor.toString(),
            browseName: "Temperature"
        });
    });
}*/

function testMonitor(){

    app.get("/", function(req, res){
        res.send("It works!");
    });

    app.use(express.static(__dirname + '/'));

    var io = require('socket.io').listen(app.listen(port));

    io.sockets.on('connection', function (socket) {
    });
    the_subscription=new opcua.ClientSubscription(the_session,{
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 10,
        requestedMaxKeepAliveCount: 2,
        maxNotificationsPerPublish: 10,
        publishingEnabled: true,
        priority: 10
    });

    the_subscription.on("started",function(){
        console.log("subscription started  - subscriptionId=",the_subscription.subscriptionId);
    }).on("keepalive",function(){
        console.log("keepalive");
    }).on("terminated",function(){
        callback();
    });

    /*setTimeout(function(){
        the_subscription.terminate();
    },10000);*/

// install monitored item
    var monitoredItem  = the_subscription.monitor({
            nodeId: opcua.resolveNodeId(nodeIdToMonitor),
            attributeId: opcua.AttributeIds.Value
        },
        {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 10
        },
        opcua.read_service.TimestampsToReturn.Both
    );
    console.log("-------------------------------------");

    monitoredItem.on("changed",function(dataValue){
        console.log(" % free mem = ",dataValue.value.value);
        io.sockets.emit('message', {
            value: dataValue.value.value,
            timestamp: dataValue.serverTimestamp,
            nodeId: nodeIdToMonitor.toString(),
            browseName: "FreeMemory"
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

        // step 3 : browse
        function(callback) {
            the_session.browse("RootFolder", function(err,browse_result){
                if(!err) {
                    console.log('***************************************');
                  //  console.log('browse result='+browse_result);
                    console.log('***************************************');
                    browse_result[0].references.forEach(function(reference) {
                        console.log('reference browsename ='+ reference.browseName.toString());
                    });
                }
                callback(err);
            });
        },
        // subscription
        function(callback) {
            testMonitor();
        },
        // close session
        function(callback) {
            the_session.close(function(err){
                if(err) {
                    console.log("session closed failed ?");
                }
                callback();
            });
        }
    ],
    function(err) {
        if (err) {
            console.log(" failure ",err);
        } else {
            console.log("done!");
        }
        client.disconnect(function(){});
    }
    ) ;





