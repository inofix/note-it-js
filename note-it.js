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

// a foreignObject is needed, as the svg elements will not carry
// the html form..
function edit_text(d, t) {

//    var ttext = t.node().textContent;
    d["text"] = t.node().textContent;
    var f = d.append("foreignObject")
                .append("xhtml:form")
                .append("input")
                .attr("style", "width: 10em;")
                .attr("type", "text")
                .attr("value", t.node().textContent)
    f.attr("value", function() {
                    this.focus();
                    return d["text"];
    })
    // do update the text whenever the focus is lost, but only once!
    f.on("blur", function() {
        var v = f.node().value;
        if (v) {
            d["text"] = v;
        } else {
            d["text"] = "...";
        }
        t.text(d["text"]);
        // onblur is called on removeChild, make sure not to remove twice..
        f.on("blur", null);
        f.remove();
        rem = false;
        return d["text"];
    })
    f.on("keypress", function() {
        if (d3.event.keyCode == 13) {

            var v = f.node().value;
            if (v) {
                t.text(f.node().value);
            } else {
                t.text("...");
            }
            // onblur is called on removeChild, make sure not to remove twice..
            f.on("blur", null);
            f.remove();
            d3.event.preventDefault();
        }
    }) }

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
        .text("...")
        .style("font-weight", "bold")
        .attr("x", "4px")
        .attr("y", "1em");
    t.on("click", function() { edit_text(t, tt) });
    var c = n.append("g")
        .attr("class", "content")
        .attr("width", "100px")
        .attr("height", "100px")
    var ct = c.append("text")
        .text("...")
        .attr("x", "8px")
        .attr("y", "2em")
        .attr("width", "100px")
        .attr("height", "100px")
    c.on("click", function() { edit_text(c, ct) });
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

// TODO - add a note-it dropped on another to the lower ones group
// TODO - add a textbox for content / functions below the title (9em remaining)
// TODO - display the config as json
// TODO - add sync between json:svg

