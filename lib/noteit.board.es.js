
class SketchBoard {

    constructor(svg_selector, geometry=[], dark=false) {

        this.svg = d3.select(svg_selector);
        if (geometry[1]) {
            this.svg.attr("style", "width: " + geometry[0] + "; height: " + geometry[1] + ";");
        }
        this.dark = dark;
        if (dark) {
            this.svg.style("background", "#000000");
        }
        this.position = [ this.svg.node().getBoundingClientRect().left,
                            this.svg.node().getBoundingClientRect().top ]
//        this.adhesives = [];
        return this;
    }

    append_group(group) {

        return this.svg.append("g").attr("class", group);
    }
}

class Adhesive {

    // TODO: If I declare this static, I can not access it via the class ..
    get CSS_CLASS() { return "adhesive"; }

    constructor(group, color="#f7ff72", geometry=[10,10], position=[0,0], handles=[]) {

        this.parent_group = group;
        this.group = group.append("g").attr("class", this.CSS_CLASS);
        this.color = color;
        // note: the height/width via css above works in chrome
        // but for ff it must be set here...
        this.paper = this.group.append("rect")
                        .attr("width", geometry[0] + "em")
                        .attr("height", geometry[1] + "em");
        this.geometry = geometry;
        this.group.attr("transform", "translate(" + position[0] + "," + position[1] + ")");
        this.position = position;
        let stroke_color = "#000000";
        if (board.dark) {
            stroke_color = "#ffffff";
        }
        this.paper.style("fill", color)
                .style("stroke", stroke_color)
                .style("stroke-width", "1px");
        this.handles = handles;
        for (var h of handles) {
            switch (h) {
                case "close":
                this.add_handle_close();
                break;
                case "new":
                this.add_handle_new();
                break;
            }
        }
        return this;
    }

    add_type(type="Type") {

        let l = this.geometry[0] / 2;
        this.type = this.group.append("g").attr("class", "type")
                    .append("foreignObject")
                    .attr("x", 2).attr("y", 0)
                    .attr("width", l + "em").attr("height", "1em")
                    .append("xhtml:div")
                    .attr("style", "width: " + l + "em; height: 1em;")
                    .attr("contentEditable", "true")
                    .style("font-size", "0.8em")
                    .style("color", "grey")
                    .text(type);
        // TODO: Works without in FF but not in Chromium (..)?!
        this.type.on("mouseover", () => this.focus());
    }

    add_handle(slot, text) {

        let l = this.geometry[0] - slot;
        let h = this.group.append("g").attr("class", "handle")
                    .attr("width", "1em").attr("height", "1em");
        return h.append("text").text(text).attr("x", l + "em").attr("y", "1em");
    }

    // TODO: I can not access the class ..
    add_handle_new() {

        let h = this.add_handle(2, "+");

        var g = this.group;
        var c = this.color;
        var ge = this.geometry;
        var ha = this.handles;
        var nX = this.group.node().getBoundingClientRect().left;
        var nY = this.group.node().getBoundingClientRect().top;

        h.on("click", function() {
            new Adhesive(g, c, ge, [nX, nY], ha);
        });
    }

    add_handle_close() {

        var g = this.group;

        let h = this.add_handle(1, "x");
        h.on("click", function() { g.remove() });
    }
}

class NoteIt extends Adhesive {

    get CSS_CLASS() { return "noteit"; }

    constructor(group, type="Type", color="#f7ff72", geometry=[10,10], position=[2,2], handles=["close", "new"]) {
        super(group, color, geometry, position, handles);
        this.type = type;
        this.add_type(type);
    }

    // TODO: I can not access the class ..
    add_handle_new() {

        let h = this.add_handle(2, "+");

        var g = this.group;
        var t = this.type;
        var c = this.color;
        var ge = this.geometry;
        var nX = this.group.node().getBoundingClientRect().left;
        var nY = this.group.node().getBoundingClientRect().top;

        h.on("click", function() {
            new NoteIt(g, t, c, ge, [nX,nY]);
        });
    }
}

class Stack {

    constructor(group, type="Type", color="#f7ff72", geometry=[10,10], position=[2,2]) {
        this.parent_group = group;
        this.group = group.append("g").attr("class", "stack");
        new Adhesive(group, color, geometry, [ position[0] + 4, position[1] + 4]);
        new Adhesive(group, color, geometry, [ position[0] + 2, position[1] + 2]);
        let n = new NoteIt(group, type, color, geometry, [position[0], position[1]], ["new"]);
    }
}


var board = new SketchBoard("#sketchboard");
var rstack = new Stack(board.append_group("mamma"), "Type", "#f7ff72", [16,16]);
//var rstock = create_stock("Pink", "#ff6ee2", 16, 4, 4);
//var bstock = create_stock("Cyan", "#6ee0ff", 16, 8, 24);
//var ystock = create_stock("Yellow", undefined, 16, 12, 44);

