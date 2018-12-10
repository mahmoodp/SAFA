const opcua = require("node-opcua");
const config = require('./config');
const request = require('request');

//import APPID
const {OpenWeahter:{APPID}} = config;
const city = "Tampere";

//Define url to OpenWeather
const url = 'http://api.openweathermap.org/data/2.5/weather?q='+city+'&units=metric&APPID='+APPID;

// Let's create an instance of OPCUAServer
const server = new opcua.OPCUAServer({
    port: 4334, // the port of the listening socket of the server
    resourcePath: "UA/MyLittleServer", // this path will be added to the endpoint resource name
    buildInfo : {
        productName: "MySampleServer1",
        buildNumber: "7658",
        buildDate: new Date(2014,5,2)
    }
});

function post_initialize() {
    console.log("initialized");
    function construct_my_address_space(server) {

        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();


        // create a folder stations
        const WeahterStations  = namespace.addFolder("ObjectsFolder",{ browseName: "Stations"});
        // create sub folder of city station
        const CityNode = namespace.addFolder(WeahterStations,{browseName: city});



        // Function to get weather information from OpenWeather
        function GetWeather(url,callback) {
            let options = {
                method: 'GET',
                json: true,
                url:url,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            request(options, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    const data  = ExtractData(body);
                    callback(null,data);
                } else {
                    callback(error);
                }
            });
        }


        //Extract data from body
        function ExtractData(body) {
            return  {
                humidity:           body.main.humidity,
                temperature:        body.main.temp,
                pressure:           body.main.pressure,
                description:        body.weather[0].description,
                wind_speed:         body.wind.speed,
                visibility:         body.visibility

            };
        }

        // Get weather information from OpenWeather
        let TampereData = {};
        setInterval(function() {
            GetWeather(url,function(err,data) {
                if (!err) {
                    TampereData = data;
                }
            });
        }, 10000);


        // function to extract Tampere weather values
        function extract_value(property) {
            let value = TampereData[property];
            return new opcua.Variant({dataType: opcua.DataType.Double, value: value });
        }

        function extract_description(property) {
            let value = TampereData[property];
            return new opcua.Variant({dataType: opcua.DataType.String, value: value });
        }

        //add object to address space
        let Temperature = namespace.addAnalogDataItem({
            componentOf: CityNode,
            nodeId: "s=Tampere_Temp",
            browseName: "Temperature",
            engineeringUnitsRange: {
                low:  -40.0,
                high: +40.0
            },
            engineeringUnits: opcua.standardUnits.degree_celsius,
            dataType: "Double",
            value: {  get: function () { return extract_value("temperature"); } }
        });

        //add object to address space
        namespace.addAnalogDataItem({
            componentOf: CityNode,
            nodeId: "s=Tampere_Pres",
            browseName: "Pressure",
            engineeringUnitsRange: {
                low:  850,
                high: 1050
            },
            engineeringUnits: opcua.standardUnits.hectopascal,
            dataType: "Double",

            value: {  get: function () { return extract_value("pressure"); } }
        });

        //add object to address space
        namespace.addAnalogDataItem({
            componentOf: CityNode,
            nodeId: "s=Tampere_Humi",
            browseName: "Humidity",
            engineeringUnitsRange: {
                low:  0,
                high: 100
            },
            engineeringUnits: opcua.standardUnits.percent,
            dataType: "Double",
            value: {  get: function () { return extract_value("humidity"); } }
        });

        //add object to address space
        namespace.addVariable({
            componentOf: CityNode,
            nodeId: "s=Tampere_visibility",
            browseName: "Visibility",
            dataType: "Double",
            value: {  get: function () { return extract_value("visibility"); } }
        });

        //add object to address space
        namespace.addVariable({
            componentOf: CityNode,
            nodeId: "s=Tampere_wind_speed",
            browseName: "Wind_speed",
            dataType: "Double",
            value: {  get: function () { return extract_value("wind_speed"); } }
        });

        //add object to address space
        namespace.addVariable({
            componentOf: CityNode,
            nodeId: "s=Tampere_description",
            browseName: "Description",
            dataType: "String",
            value: {  get: function () { return extract_description("description"); } }
        });


        //make Temerature node historical object

        addressSpace.installHistoricalDataNode(Temperature);

       let variable_switch = true;
        
        namespace.addVariable({
            
            componentOf: CityNode,
            
            nodeId: "s=Switch_status", // some opaque NodeId in namespace 4
            
            browseName: "Switch",
            
            dataType: "Boolean",    
            
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Boolean, value: variable_switch });
                },
                set: function (variant) {
                    variable_switch = variant.value;
                    return opcua.StatusCodes.Good;
                }
            }
        });
      



    }
    construct_my_address_space(server);
    server.start(function() {
        console.log("Server is now listening ... ( press CTRL+C to stop)");
        console.log("port ", server.endpoints[0].port);
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        console.log(" the primary server endpoint url is ", endpointUrl );
    });
}
server.initialize(post_initialize);