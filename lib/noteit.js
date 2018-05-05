
function draw_noteit(color) {

    var note = svg.append("g")
            .attr("class", "noteit");
    // note the height/width via css above works in chrome
    // but for ff it must be set here...
    var paper = note.append("rect")
        .attr("class", "paper")
        .attr("width", "10em")
        .attr("height", "10em");
    if (color) {
        paper.style("fill", color);
    } else {
        paper.style("fill", "#f7ff72");
    }

    return note;
}

function draft_noteit(type, color) {

    var note = draw_noteit(color);

    var t = note.append("g")
        .attr("class", "type");
    var note_type = t.append("foreignObject")
        .attr("x", "2")
        .attr("y", "0")
        .attr("width", "5em")
        .attr("height", "1em")
        .append("xhtml:div")
        .attr("style", "width: 5em; height: 1em;")
        .attr("contentEditable", "true")
        .style("font-size", "0.8em")
        .style("color", "grey")
        .text(type);
    // TODO: Works without in FF but not in Chromium (..)?!
    note_type.on("mouseover", function() { this.focus(); });

    var handle_add = note.append("text")
                        .text("+").attr("x", "8em").attr("y", "1em");
    handle_add.on("click", function() {
        let n = create_noteit(note_type.node().textContent, color, "Title", "");
        let nX = note.node().getBoundingClientRect().left - svgX - 3;
        let nY = note.node().getBoundingClientRect().top - svgY - 3;
        n.attr("transform", "translate(" + nX + "," + nY + ")");
    });
    return note;
}

function create_noteit(type, color, title, text) {

    var note = draft_noteit(type, color);

//    var handle_drag = note.append("g")
//        .attr("class", "handle")
//        .attr("width", "1em")
//        .attr("height", "1em");
//    handle_drag.append("text")
//        .text("#")
//        .attr("x", "5em")
//        .attr("y", "1em");
    note.call(d3.drag().on("drag", function() {
        note.raise().attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
    }));
    var handle_close = note.append("g")
        .attr("class", "handle")
        .attr("width", "1em")
        .attr("height", "1em");
    handle_close.append("text")
        .text("x")
        .attr("x", "9em")
        .attr("y", "1em");
    handle_close.on("click", function() { note.remove() });

    var t = note.append("g")
        .attr("class", "title");
    var note_title = t.append("foreignObject")
        .attr("x", "6")
        .attr("y", "16")
        .attr("width", "8em")
        .attr("height", "1em")
        .append("xhtml:div")
        .attr("style", "width: 8em; height: 1em;")
        .attr("contentEditable", "true")
        .style("font-weight", "bold")
        .text(title);
    // TODO: Works without in FF but not in Chromium (..)?!
    note_title.on("mouseover", function() { this.focus(); });

    var tt = note.append("g")
        .attr("class", "content");
    var note_content = t.append("foreignObject")
        .attr("x", "6")
        .attr("y", "36")
        .attr("width", "9em")
        .attr("height", "7em")
        .append("xhtml:div")
        .attr("style", "width: 9em; height: 7em;")
        .attr("contentEditable", "true")
        .text(text);
    // TODO: Works without in FF but not in Chromium (..)?!
    note_content.on("mouseover", function() { this.focus(); });

    return note;
};

function create_stock(type, color, posX, posY) {

    let back1 = draw_noteit(color);
    let back0 = draw_noteit(color);
    let stock = draft_noteit(type, color);

    if (!type) {
        var type = "Type";
    }

    if (posX && posY) {
        var p = posX + "," + posY;
        let pX = posX+2;
        let pY = posY+2;
        let ppX = pX+2;
        let ppY = pY+2;
        var p = posX + "," + posY;
        var pp = pX + "," + pY;
        var ppp = ppX + "," + ppY;
    } else {
        var p = "0,0";
        var pp = "2,2";
        var ppp = "4,4";
    }

    stock.attr("transform", "translate(" + p + ")");
    back0.attr("transform", "translate(" + pp + ")");
    back1.attr("transform", "translate(" + ppp + ")");

    return stock;
}

