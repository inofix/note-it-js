var svg = d3.select("svg");

var noteits = [];

//TODO
//    function zooming(e) {
//        e.attr("transform", d3.event.transform);
//    }

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

function create_noteit(text) {

    var n = draw_noteit(text);

    var t = n.append("g")
        .attr("class", "title")
        .attr("width", "9em")
        .attr("height", "1em")
    t.append("text")
        .text(text)
        .attr("x", "4px")
        .attr("y", "1em")
    var h = n.append("g")
        .attr("class", "handle")
        .attr("width", "1em")
        .attr("height", "1em");
    h.append("text")
        .text("-")
        .attr("x", "9em")
        .attr("y", "1em");
    h.on("click", function() { n.remove() })
//        n.call(d3.zoom().on("zoom", zooming(n)));
    n.call(d3.zoom().on("zoom", function() { n.attr("transform", d3.event.transform)}));
    noteits.push(n);
};

var stock = draw_noteit("+");
stock.append("text").text("+").attr("x", "9em").attr("y", "1em");
stock.on("mouseover", function() { create_noteit("...") } );

// TODO - make text editable on click
// TODO - d3.zoom is not the ideal solution, should be rewritten to work with the other features
// TODO - lift note-it on drag over the others
// TODO - add a textbox for content / functions below the title (9em remaining)
// TODO - display the config as json
// TODO - add sync between json:svg
// TODO - box shadow

