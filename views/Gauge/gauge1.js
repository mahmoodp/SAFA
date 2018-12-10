
var gauge;
var canvas;
var obj = null;
var data      = [];
var numvalues = 1200;
window.onload = function () {
    gauge = new RGraph.Gauge('cvs', -40, 100, 0)
        .set('scale.decimals', 0)
        .set('tickmarks.small', 50)
        .set('tickmarks.big', 5)
        // .set('title.top', 'Temperature')
        .set('title.top.size', 24)
        .set('title.top.pos', 0.15)
        .set('title.bottom', '°C')
        .set('title.bottom.color', '#aaa')
        .set('border.outer', 'Gradient(white:white:white:white:white:white:white:white:white:white:#aaa)')
        .draw();
    canvas    = document.getElementById("cvs_graph");
    function prepare_graph() {
        var l         = 0; // The letter 'L' - NOT a one
        var updates = 0;
        obj = new RGraph.Line('cvs_graph', [])
            .set('title.vpos', 0.5)
            .set('title.yaxis.pos', 0.5)
            .set('colors', ['black'])
            .set('linewidth',0.75)
            .set('yaxispos', 'right')
            .set('ymax', 600)
            .set('xticks', 25)
            .set('numyticks', 0)
            .set('numxticks', 0)
            .set('background.grid', true)
            .set('tickmarks', true)
            .set('shadow', false)
            .set('gutter.top', 5)
            .set('gutter.bottom', 5);
        // Pre-pad the arrays with null values
        for (var i=0; i<numvalues; ++i) { data.push(null); }
    }
    prepare_graph();
}
function drawGraph (value,timestamp) {
    if (!obj) return;
    RGraph.Clear(canvas);
    // Add some data to the data arrays
    var len = data.length;

    data.push(value);
    if (data.length > numvalues) {
        data = RGraph.array_shift(data);
    }
    obj.original_data[0] = data;
    obj.Draw();
}
