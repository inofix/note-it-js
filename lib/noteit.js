
function draw_noteit(color) {

    var n = svg.append("g")
            .attr("class", "noteit");
    // note the height/width via css above works in chrome
    // but for ff it must be set here...
    var r = n.append("rect")
        .attr("class", "paper")
        .attr("width", "10em")
        .attr("height", "10em");
    if (color) {
        r.style("fill", color);
    } else {
        r.style("fill", "#f7ff72");
    }
    return n;
}

// a foreignObject is needed, as the svg elements will not carry
// the html form..
function edit_textarea(d, t) {
// TODO - fix multi line ...
    let a = t.node().childNodes;
    d["text"] = "";
    for (i = 0; i < a.length; i++) {
        if (a[i].textContent) {
            d["text"] = d["text"] + a[i].textContent + "\n";
        }
    }
    var f = d.append("foreignObject")
                .append("xhtml:form")
                .append("textarea")
                .attr("style", "width: 10em;")
                .attr("style", "height: 10em;")
//                .text(t.node().textContent)
                .text(d["text"])
    f.attr("value", function() {
                    this.focus();
                    return d["text"];
    })
    // do update the text whenever the focus is lost, but only once!
    f.on("blur", function() {
        var v = f.node().value;
        if (v) {
            t.text("");
            d["text"] = v;
            let ls = d["text"].replace(/\r\n/g, "\n").split("\n");
            for (i = 0; i < ls.length; i++) {
                let dy = 0.9 * i + 2.5;
                let ti = t.append("tspan")
                            .attr("x", "8px")
                            .attr("y", dy + "em");
                ti.text(ls[i]);
            }
        } else {
            d["text"] = "...";
        }
        // onblur is called on removeChild, make sure not to remove twice..
        f.on("blur", null);
        d.selectAll("foreignObject").remove();
        rem = false;
        return d["text"];
    })
}

// a foreignObject is needed, as the svg elements will not carry
// the html form..
function edit_text(d, t) {

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
        d.selectAll("foreignObject").remove();
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
            d.selectAll("foreignObject").remove();
            d3.event.preventDefault();
        }
    })
}

function create_noteit(color, text) {

    var n = draw_noteit(color);

    var h = n.append("g")
        .attr("class", "handle")
        .attr("width", "1em")
        .attr("height", "1em");
    h.append("text")
        .text("x")
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
    var ct = c.append("text").append("tspan")
        .text("...")
        .attr("x", "8px")
        .attr("y", "2.5em")
    ct.append("tspan").text(".")
    c.on("click", function() { edit_textarea(c, ct) });
    n.call(d3.drag().on("drag", function() {
// TODO the delta should have been calculated each time the mouse is pressed down, neither when adding the handler nor while dragging...
//        var dX = d3.event.x - n.attr("x");
//        var dY = d3.event.y - n.attr("y");
        n.attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
        n.raise();
    }));
//    noteits.push(n);
    return n;
};


