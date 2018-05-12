
class SketchBoard {

    constructor(svg_selector, geometry=[], uuid=false, dark=false) {

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
        if (uuid) {

            this.get_id = function() { this.get_uuid(); }
        } else {

            this.get_id = function() { this.get_uid(); }
        }
//        this.adhesives = [];
        return this;
    }

    append_group(group) {

        return this.svg.append("g").attr("class", group);
    }

    // short version
    get_uid() {
        for(
            b=a='';
            a++<12;
            b+=(
                8^Math.random() * 10
            ).toString(16)
        );
        return b;
    }

    // see https://gist.github.com/LeverOne/1308368
    get_uuid() {
        for(
            b=a='';
            a++<36;
            b+=a*51&52?(
                a^15?
                    8^Math.random() *
                    (a^20?16:4):4
                ).toString(16):'-'
        );
        return b;
    }
}

class Adhesive {

    // TODO: If I declare this static, I can not access it via the class ..
    get CSS_CLASS() { return "adhesive"; }

    constructor(group, color=["#f7ff72"], geometry=[10,10], position=[0,0]) {

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
        this.paper.style("fill", color[0])
                .style("stroke", stroke_color)
                .style("stroke-width", "1px");
        return this;
    }

    // set the basic features separatly from the constructor for more
    // control over super classes
    set_features(handles=["close", "new"], hierarchical=true, draggable=true, type) {

        if (draggable) {
            this.enable_drag();
        }
        if (typeof type === 'string') {
            this.add_type(type);
        }
        this.add_handles(handles);
    }

    add_type(type="Type") {

        let l = this.geometry[0] / 2;
        this.type = this.group.append("g").attr("class", "type")
                    .append("foreignObject")
                    .attr("x", "1em").attr("y", 0)
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

    add_handles(handles) {

        // dispatch the handles to control the order..
        this.handles = handles;
        this.handle_close = false;
        this.handle_new = false;
        this.handle_color = false;
        for (var h of handles) {
            switch (h) {
                case "close":
                this.handle_close = true;
                break;
                case "new":
                this.handle_new = true;
                break;
                case "color":
                this.handle_color = true;
                break;
            }
        }
        if (this.handle_color) {
            this.add_handle_color();
        }
        if (this.handle_close) {
            this.add_handle_close();
        }
        if (this.handle_new) {
            this.add_handle_new();
        }
    }

    add_handle(slot, text) {

        let l = this.geometry[0] - slot;
        let h = this.group.append("g").attr("class", "handle")
                    .attr("width", "1em").attr("height", "1em");
        return h.append("text").text(text).attr("x", l + "em").attr("y", "1em");
    }

    // just a helper:
    // TODO: I can not access the class ..
    add_handle_new() {

        let h = this.add_handle(2, "&");

        var g = this.group;
        var c = this.color;
        var ge = this.geometry;
        var ha = this.handles;
        var nX = this.group.node().getBoundingClientRect().left - this.parent_group.node().getBoundingClientRect().left + this.geometry[0] * 2;
        var nY = this.group.node().getBoundingClientRect().top - this.parent_group.node().getBoundingClientRect().top + this.geometry[1] * 2;

        h.on("click", function() {
            new Adhesive(g, c, ge, [nX, nY], ha, true);
        });
    }

    add_handle_color() {

//        let l = this.geometry[0] / 2 + 1;
        let l = 2;

        var c = this.color;
        var p = this.paper;

        var h = this.group.append("g").attr("class", "handle");
        var gd = h.append("defs").append("linearGradient")
                    .attr("id", "colorhandlegradient")
                    .attr("x1", "0%").attr("y1", "0%")
                    .attr("x2", "100%").attr("y2", "100%");
        var c0 = gd.append("stop").attr("offset", "0%")
                    .style("stop-color", c[1]);
        var c1 = gd.append("stop").attr("offset", "100%")
                    .style("stop-color", c[2]);
        h.append("rect").attr("x", l).attr("y", 2)
                    .attr("rx", "0.25em").attr("ry", "0.25em")
                    .attr("width", "1em").attr("height", "1em")
                    .attr("fill", "url(#colorhandlegradient)");

        h.on("click", function() {
            var cur = c.shift();
            c.push(cur);
            p.style("fill", c[0]);
            c0.style("stop-color", c[1]);
            c1.style("stop-color", c[2]);
        });
    }

    add_handle_close() {

        var g = this.group;

        let h = this.add_handle(1, "x");
        h.on("click", function() { g.remove() });
    }

    enable_drag() {

        this.draggable = true;
        var n = this.group;

        var nX = this.group.node().getBoundingClientRect().left - this.parent_group.node().getBoundingClientRect().left + this.geometry[0] * 2;
        var nY = this.group.node().getBoundingClientRect().top - this.parent_group.node().getBoundingClientRect().top + this.geometry[1] * 2;

        this.group.call(d3.drag().on("drag", function() {

            nX += d3.event.dx;
            nY += d3.event.dy;
            n.raise().attr("transform", "translate(" + nX + "," + nY + ")");
        }));
    }
}

// class Label extends Adhesive {
// }

class NoteIt extends Adhesive {

    get CSS_CLASS() { return "noteit"; }

    constructor(group, color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        super(group, color, geometry, position);
        return this;
    }

    // set the basic features separatly from the constructor for more
    // control over super classes
    set_features(handles=["close", "new"], hierarchical=true, draggable=true, type, title, content) {
        if (draggable) {
            this.enable_drag();
        }
        if (typeof type === 'string') {
            this.add_type(type);
        }
        if (typeof title === 'string') {
            this.add_title();
        }
        if (typeof content === 'string') {
            this.add_content();
        }
        // sets whether to add spawned nodes to this or the parent group
        this.hierarchical = hierarchical;
        this.add_handles(handles);
    }

    // TODO: I can not access the class ..
    add_handle_new() {

        let h = this.add_handle(2, "&");

        var g;
        var hier = this.hierarchical;
        if (typeof this.children === 'undefined') {
            if (hier) {
                g = this.group.append("g").attr("class", "children");
                this.children = g;
            } else {
                g = this.parent_group;
            }
        } else {
            g = this.children;
        }
        var c = this.color;
        var ge = this.geometry;
        var nX = this.group.node().getBoundingClientRect().left - this.parent_group.node().getBoundingClientRect().left + this.geometry[0] * 2;
        var nY = this.group.node().getBoundingClientRect().top - this.parent_group.node().getBoundingClientRect().top + this.geometry[1] * 2;
        var t = this.type;
        var ha = this.handles;

        h.on("click", function() {
            var n = new NoteIt(g, c, ge, [nX,nY]);
            n.set_features(ha, hier, true, t.node().textContent, "Title", "...");
        });
    }

    add_title(title="Title") {

        let l = this.geometry[0] - 1;

        var t = this.group.append("g").attr("class", "title");
        var nt = t.append("foreignObject")
                    .attr("x", "6").attr("y", "16")
                    .attr("width", l + "em").attr("height", "1em")
                    .append("xhtml:div")
                    .attr("style", "width: " + l + "em; height: 1em;")
                    .attr("contentEditable", "true")
                    .style("font-weight", "bold")
                    .append("span")
                    .text(title);
        // TODO: Works without in FF but not in Chromium (..)?!
        nt.on("mouseover", function() { this.focus(); });
    }

    add_content(content="...") {

        let l = this.geometry[0] - 1;
        let h = this.geometry[1] - 3;

        var t = this.group.append("g").attr("class", "content");
        var nt = t.append("foreignObject")
                    .attr("x", "6").attr("y", "36")
                    .attr("width", l + "em").attr("height", h + "em")
                    .append("xhtml:div")
                    .attr("style", "width: " + l + "em; height: " + h + "em;")
                    .attr("contentEditable", "true")
                    .append("span")
                    .text(content);
        // TODO: Works without in FF but not in Chromium (..)?!
        nt.on("mouseover", function() { this.focus(); });
    }
}

class Stack {

    constructor(group, type="Type", color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        this.parent_group = group;
        this.group = group.append("g").attr("class", "stack");
        new Adhesive(group, color, geometry, [ position[0] + 4, position[1] + 4]);
        new Adhesive(group, color, geometry, [ position[0] + 2, position[1] + 2]);
        let n = new NoteIt(group, color, geometry, [position[0], position[1]]);
        n.add_type("Type");
        n.handles = ["close", "new", "color"];
        n.draggable = true;
        n.add_handle_new();
        n.add_handle_color();
        return this;
    }
}

var board = new SketchBoard("#sketchboard");
var rstack = new Stack(board.append_group("mamma"), "Type", ["#f7ff72", "#ff6ee2", "#6ee0ff"], [16,16]);
//var rstock = create_stock("Pink", "#ff6ee2", 16, 4, 4);
//var bstock = create_stock("Cyan", "#6ee0ff", 16, 8, 24);
//var ystock = create_stock("Yellow", undefined, 16, 12, 44);

