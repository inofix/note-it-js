var svg = d3.select("svg");
//var noteits = [];

//TODO
//function zooming(toZoom) {
//    toZoom.attr("transform", d3.event.transform);
//}

//function zooming() {
//    d3.selectAll(".noteit").attr("transform", d3.event.transform);
//}
//svg.call(d3.zoom().on("zoom", zooming));


function draw_noteit(text) {

    var n = svg.append("g")
            .attr("class", "noteit")
    // note the height/width via css above works on chrome
    // but for ff it must be set here...
    n.append("rect")
        .attr("class", "paper")
        .attr("width", "10em")
        .attr("height", "10em");
    return n;
}

function change_text(textField) {
    d = prompt("change text:");
    textField.text(d);
}

function edit_text(d, t) {

    var text = t.text.innerHTML;
    var f = d.append("foreignObject")
                .append("xhtml:form")
                .append("input")
                .attr("type", "textarea")
                .attr("value", function() {
                    this.focus();
                    return text;
                })
    f.on("keypress", function() {
        if (d3.event.keyCode == 13) {

            var v = f.node().value;
            if (v) {
                t.text(f.node().value);
            } else {
                t.text("...");
            }
            f.remove();
            d3.event.preventDefault();
        }
    })
}

function create_noteit(text) {

    var n = draw_noteit(text);

    var h = n.append("g")
        .attr("class", "handle")
        .attr("width", "1em")
        .attr("height", "1em");
    h.append("text")
        .text("-")
        .attr("x", "9em")
        .attr("y", "1em");
    h.on("click", function() { n.remove() });

    var t = n.append("g")
        .attr("class", "title")
        .attr("width", "9em")
        .attr("height", "1em")
    var tt = t.append("text")
        .text("..")
        .attr("x", "4px")
        .attr("y", "1em");
    t.on("click", function() { edit_text(t, tt) });
    var c = n.append("g")
        .attr("class", "content")
        .attr("width", "100px")
        .attr("height", "100px")
    var ct = c.append("text")
        .text("_")
        .attr("x", "4px")
        .attr("y", "2em")
    c.on("click", function() { change_text(ct) });
//    d3.selectAll("#title").on("click", change_text(tt));
//        n.call(d3.zoom().on("zoom", zooming(n)));
    n.call(d3.drag().on("drag", function() {
// TODO the delta should have been calculated each time the mouse is pressed down, neither when adding the handler nor while dragging...
//        var dX = d3.event.x - n.attr("x");
//        var dY = d3.event.y - n.attr("y");
        n.attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
        n.raise();
    }));
//    noteits.push(n);
};

var stock = draw_noteit("+");
stock.append("text").text("+").attr("x", "9em").attr("y", "1em");
stock.on("click", function() { create_noteit("...") } );

// TODO - make text editable on click
// TODO - d3.zoom is not the ideal solution, should be rewritten to work with the other features
// TODO - lift note-it on drag over the others
// TODO - add a textbox for content / functions below the title (9em remaining)
// TODO - display the config as json
// TODO - add sync between json:svg
// TODO - box shadow

