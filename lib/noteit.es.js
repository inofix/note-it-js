
function draw_noteit(color="#f7ff72", size="10") {

    var note = svg.append("g")
            .attr("class", "noteit");
    // note the height/width via css above works in chrome
    // but for ff it must be set here...
    var paper = note.append("rect")
        .attr("class", "paper")
        .attr("width", size + "em")
        .attr("height", size + "em");
    paper.style("fill", color);

    return note;
}

function draft_noteit(type, color, size) {

    var note = draw_noteit(color, size);

    let tl = size / 2;
    var t = note.append("g")
        .attr("class", "type");
    var note_type = t.append("foreignObject")
        .attr("x", "2")
        .attr("y", "0")
        .attr("width", tl + "em")
        .attr("height", "1em")
        .append("xhtml:div")
        .attr("style", "width: " + tl + "em; height: 1em;")
        .attr("contentEditable", "true")
        .style("font-size", "0.8em")
        .style("color", "grey")
        .text(type);
    // TODO: Works without in FF but not in Chromium (..)?!
    note_type.on("mouseover", () => this.focus());

    let hl = size - 2;
    var handle_add = note.append("text")
                        .text("+").attr("x", hl + "em").attr("y", "1em");
    handle_add.on("click", function() {
        let n = create_noteit(note_type.node().textContent, color, size, "Title", "");
        let nX = note.node().getBoundingClientRect().left - svgX - 3;
        let nY = note.node().getBoundingClientRect().top - svgY - 3;
        n.attr("transform", "translate(" + nX + "," + nY + ")");
    });
    return note;
}

function create_noteit(type, color, size, title, text) {

    var note = draft_noteit(type, color, size);

    var nX = note.node().getBoundingClientRect().left;
    var nY = note.node().getBoundingClientRect().top;

    note.call(d3.drag().on("drag", function() {
        nX += d3.event.dx;
        nY += d3.event.dy;
        note.raise().attr("transform", "translate(" + nX + "," + nY + ")");
    }));

    let hl = size - 1;
    var handle_close = note.append("g")
        .attr("class", "handle")
        .attr("width", "1em")
        .attr("height", "1em");
    handle_close.append("text")
        .text("x")
        .attr("x", hl + "em")
        .attr("y", "1em");
    handle_close.on("click", function() { note.remove() });

    let tl = size - 1;
    let th = tl - 2;
    var t = note.append("g")
        .attr("class", "title");
    var note_title = t.append("foreignObject")
        .attr("x", "6")
        .attr("y", "16")
        .attr("width", tl + "em")
        .attr("height", "1em")
        .append("xhtml:div")
        .attr("style", "width: " + tl + "em; height: 1em;")
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
        .attr("width", tl + "em")
        .attr("height", th + "em")
        .append("xhtml:div")
        .attr("style", "width: " + tl + "em; height: " + th + "em;")
        .attr("contentEditable", "true")
        .text(text);
    // TODO: Works without in FF but not in Chromium (..)?!
    note_content.on("mouseover", function() { this.focus(); });

    return note;
};

function create_stock(type, color, size, posX, posY) {

    let back1 = draw_noteit(color, size);
    let back0 = draw_noteit(color, size);
    let stock = draft_noteit(type, color, size);

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

