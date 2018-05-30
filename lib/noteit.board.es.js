
class SketchBoard {

    constructor(svg_selector, geometry=[], uuid, dark=false) {

        this.svg = d3.select(svg_selector);
        if (geometry[1]) {
            this.svg.attr("style", "width: " + geometry[0] + "; height: " +
                                                    geometry[1] + ";");
        }
        this.dark = dark;
        if (dark) {
            this.svg.style("background", "#000000");
        }
        this.position = [ this.svg.node().getBoundingClientRect().left,
                            this.svg.node().getBoundingClientRect().top ]
        if (uuid) {
            this.uuid = true;
        } else {
            this.uuid = false;
        }
        this.group = this.svg.append("g").attr("class", "sketchboard");
        this.adhesives = new Map();
        return this;
    }

    get_id(uuid) {

        if (typeof uuid === 'undefined') {

            uuid = this.uuid;
        }

        if (uuid) {
            return this.get_uuid();
        } else {
            return this.get_uid();
        }
    }

    // short version
    get_uid() {
        let a, b;
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
        let a, b;
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

    toJSON(indent="  ", startindent="") {

        var json = startindent + "{\n";
        for (let n of this.adhesives.values()) {
            json += n.toJSON(indent, startindent + indent) + ",\n";
        }
        if (json.length > 2) {
            json = json.substring(0, json.length - 2) + "\n" +
                                        startindent + "}";
        } else {
            // clear the area also if the maps are empty
            json = "";
        }
        return json;
    }

    fromJSON(json) {

        let elementMap = new Map(JSON.parse(json));

        for (let [key, value] of elementMap) {
            alert(value);
//            let descriptionMap = new Map(JSON.parse(value));

//            createElement(descriptionMap, elementMap);
        }
    }

//    createElement(descriptionMap, elementMap) {

//        switch (descriptionMap["class"]) {
//            case "adhesive":
//            Adhesive.fromJSON(
//// TODO: this.group -> parent.group!
//            let o = new Adhesive(this, this.group,
//                        descriptionMap["color"],
//                        descriptionMap["geometry"],
//                        descriptionMap["position"]);
////            o.fromJSON
//            break;
//        }
//    }
}

class Adhesive {

    // TODO: If I declare this static, I can not access it via the class ..
    get CSS_CLASS() { return "adhesive"; }

    constructor(board, group, color=["#f7ff72"], geometry=[10,10], position=[0,0]) {

        this.board = board;
        this.id = board.get_id();
        this.parent_group = group;
        this.parent_object;
        this.group = group.append("g").attr("class", this.CSS_CLASS)
                        .attr("id", this.id);
        this.children_group = this.group.append("g").attr("class", "children");
        this.child_objects = new Map();
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
    set_features(handles=["close", "new"], draggable=true, type) {

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
        this.type = this.group.append("g").attr("class", "type");
        // placeholder in case the string below ('nt') is empty
        var rt = this.type.append("rect")
                    .attr("fill", "#ffffff").attr("fill-opacity", "0")
                    .attr("width", l + "em").attr("height", "0.8em")
                    .attr("x", "1em").attr("y", "1em");
        var nt = this.type.append("text")
                    .attr("x", "1em").attr("y", "1em")
                    .attr("width", l + "em").attr("height", "0.8em")
                    .style("font-size", "0.8em")
                    .attr("fill", "grey")
                    .text(type);
        var n = this;
        // add the event to both nodes, as sometimes the text is small,
        // sometimes big...
//TODO: I'd prefer "focus/blur" here. Collision with "drag"?
//        nt.on("drag", null);
        rt.on("mouseover", function() { n.open_textinput(n.type, [1,0], [l,1])});
        nt.on("mouseover", function() { n.open_textinput(n.type, [1,0], [l,1])});
    }

    // multi workaround:
    // workaround the contenteditable issues in chrome and the raise problems
    // in firefox... svg does not support contenteditable (only globally),
    // foreignObject makes problems with z-index/raise() and finally
    // contentediable in div's break newline support in js?!!
    // (note to myself: that is exactly why I always prefered
    // backend to web development..)
    open_textinput(textelement, position, geometry) {
        var textnode = textelement.select("text");
        var t = "";
        let a = textnode.node().childNodes;
        for (let i = 0; i < a.length; i++) {
            if (a[i].textContent) {
                t += a[i].textContent + "\n";
            }
        }
//TODO: use style of original text element (via CSS)..
        var foreign = textelement.append("foreignObject")
                .attr("x", position[0] + "em").attr("y", position[1] + "em")
                .attr("width", geometry[0] + "em")
                .attr("height", geometry[1] + "em");
        var d = foreign.append("xhtml:textarea")
                .attr("cols", geometry[0]).attr("rows", geometry[1])
                .attr("style", "background: " + this.color[0] +
                    "; font: 1em 'Open Sans', sans-serif")
                .text(t);

        textnode.text("");
//        d.on("click", function() { d.node().focus();});
//TODO: I'd prefer "focus/blur" here. Collision with "drag"?
        d.on("mouseout", function() {

            textnode.text("");
            let tt = d.node().value;
            tt = tt.replace(/\r\n/g, "\n").split("\n");
            for (let i = 0; i < tt.length; i++) {

                // calc the distance from to for the next tspan
                let tY = i + position[1] + 1;
                let tI = textnode.append("tspan")
                            .attr("x", "8px").attr("y", tY + "em");
                tI.text(tt[i]);
            }
            foreign.remove();
         });
    }

    add_handles(handles) {

        // dispatch the handles to control the order..
        this.handles = handles;
        this.handle_close = false;
        this.handle_new = false;
        this.handle_color = false;
        this.handle_visible = false;
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
                case "visible":
                this.handle_visible = true;
                break;
            }
        }
        if (this.handle_color) {
            this.add_handle_color();
        }
        if (this.handle_close) {
            this.add_handle_close();
        }
        if (this.handle_visible) {
            this.add_handle_visible();
        }
        if (this.handle_new) {
            this.add_handle_new();
        }
    }

    add_handle(slot, text) {

        let l = this.geometry[0] - slot;
        let h = this.group.append("g").attr("class", "handle")
// TODO resolve workaround: find a better way than to use the slot for the ID..
// it is probably time for a class Handle()
                    .attr("id", "handle" + slot)
                    .attr("width", "1em").attr("height", "1em");
        return h.append("text").text(text).attr("x", l + "em").attr("y", "1em");
    }

    // just a helper:
    // TODO: I can not access the class ..
    add_handle_new() {

        let h = this.add_handle(3, "&");

        var p = this;
        var g = this.children_group;
        var nX = this.group.node().getBoundingClientRect().left - this.parent_group.node().getBoundingClientRect().left + this.geometry[0] * 2;
        var nY = this.group.node().getBoundingClientRect().top - this.parent_group.node().getBoundingClientRect().top + this.geometry[1] * 2;

        h.on("click", function() {
            let n = new Adhesive(p.board, g, p.color.slice(), p.geometry, [nX, nY]);
            n.set_features(p.handles, p.draggable, p.type.node().textContent);
            n.parent_object = p;
            p.child_objects.set(n.id, n);
            p.show_handle_visible();
            p.board.adhesives.set(n.id, n);
            g.raise();
        });
    }

    add_handle_visible() {

        let h = this.add_handle(2, "+");
        this.children_group.style("visibility", "visible");
        h.text("--");
        this.show_handle_visible();
    }

    show_handle_visible() {
// TODO resolve hardcoded slot for the ID.. see TODO above for details
        let h = this.group.select("#handle" + 2);
        let n = this;
        if (this.child_objects.size > 0) {
            h.style("fill", "black");
            h.on("click", function() {

                n.toggle_handle_visible();
            });

        } else {
            h.style("fill", "lightgrey");
            h.on("click", null);
        }
    }

    toggle_handle_visible(text) {

// TODO resolve hardcoded slot for the ID.. see TODO above for details
        let h = this.group.select("#handle" + 2).select("text");
        if (typeof text === 'undefined') {

            text = h.node().textContent;
        }

        if (text == '--') {
            this.children_group.style("visibility", "hidden");
            h.text("+");
        } else {
            this.children_group.style("visibility", "visible");
            h.text("--");
        }
        this.show_handle_visible();
        for (let [key, value] of this.child_objects) {

            value.toggle_handle_visible(text);
        }
    }

//.style("visibility", function (d) {
//    return d.children.size === 1 ? "hidden" : "visible";
//  })

    add_handle_color() {

        let l = this.geometry[0] / 2 + 1;
        l = l + "em";
//        let l = 2;

        var c = this.color;
        var p = this.paper;

        var h = this.group.append("g").attr("class", "handle");
        var gd = h.append("defs").append("linearGradient")
                    .attr("id", "gradient" + this.id)
                    .attr("x1", "0%").attr("y1", "0%")
                    .attr("x2", "100%").attr("y2", "100%");
        var c0 = gd.append("stop").attr("offset", "0%")
                    .style("stop-color", c[1]);
        var c1 = gd.append("stop").attr("offset", "100%")
                    .style("stop-color", c[2]);
        h.append("rect").attr("x", l).attr("y", 2)
                    .attr("rx", "0.2em").attr("ry", "0.2em")
                    .attr("width", "0.8em").attr("height", "0.8em")
                    .attr("fill", "url(#gradient" + this.id + ")");

        h.on("click", function() {
            var cur = c.shift();
            c.push(cur);
            p.style("fill", c[0]);
            c0.style("stop-color", c[1]);
            c1.style("stop-color", c[2]);
        });
    }

    add_handle_close() {

        var n = this;

        let h = this.add_handle(1, "x");
        h.on("click", function() { n.snuffit() });
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

    snuffit() {

        this.group.remove();
        this.board.adhesives.delete(this.id);
        this.parent_object.child_objects.delete(this.id);
    }

    toJSON(indent="", startindent="") {

        let json = startindent + '"' + this.id + '": {\n';
        let dindent = startindent + indent;
        json += dindent + '"class": "' + this.CSS_CLASS + '",\n';
        if (typeof this.parent_object === 'object') {

            json += dindent + '"parentId": "' + this.parent_object.id + '",\n';
        }
// either parent or children should do it..
//        let a = Array.from(this.child_objects.keys());
//        if (a.length > 0) {
//            json += '"childrenIds": ' + a + ', ';
//        }
        json += dindent + '"color": [' + this.color + '],\n' +
                dindent + '"geometry": [' + this.geometry + '],\n' +
                dindent + '"position": [' + this.position + '],\n' +
                dindent + '"type": "' + this.type.node().textContent + '"\n'
                startindent + '}';
        return json;
// board, group handles, draggable
    }
}

// class Label extends Adhesive {
// }

class NoteIt extends Adhesive {

    get CSS_CLASS() { return "noteit"; }

    constructor(board, group, color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        super(board, group, color, geometry, position);
        return this;
    }

    // set the basic features separatly from the constructor for more
    // control over super classes
    set_features(handles=["close", "new"], draggable=true, type, title, content) {
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
        this.add_handles(handles);
    }

    // TODO: I can not access the class ..
    add_handle_new() {

        let h = this.add_handle(3, "&");

        var p = this;
        var g = this.children_group;
        var nX = this.group.node().getBoundingClientRect().left - this.parent_group.node().getBoundingClientRect().left + this.geometry[0] * 2;
        var nY = this.group.node().getBoundingClientRect().top - this.parent_group.node().getBoundingClientRect().top + this.geometry[1] * 2;

        h.on("click", function() {
            var n = new NoteIt(p.board, g, p.color.slice(), p.geometry, [nX,nY]);
            n.set_features(p.handles, p.draggable, p.type.node().textContent, "Title", "...");
            n.parent_object = p;
            p.child_objects.set(n.id, n);
            p.show_handle_visible();
            p.board.adhesives.set(n.id, n);
            g.raise();
        });
    }

    add_title(title="Title") {

        let l = this.geometry[0] - 1;

        this.title = this.group.append("g").attr("class", "title");
        // placeholder in case the string below ('nt') is empty
        var rt = this.title.append("rect")
                    .attr("fill", "#ffffff").attr("fill-opacity", "0")
                    .attr("width", l / 2 + "em").attr("height", "1em")
                    .attr("x", "0.5em").attr("y", "2em");
        var nt = this.title.append("text")
                    .attr("width", l + "em").attr("height", "1em")
                    .attr("x", "0.5em").attr("y", "2em")
                    .style("font-weight", "bold")
                    .text(title);
        var n = this;
        // add the event to both nodes, as sometimes the text is small,
        // sometimes big...
//TODO: I'd prefer "focus/blur" here. Collision with "drag"?
//        nt.on("drag", null);
        rt.on("mouseover", function() { n.open_textinput(n.title, [0.5,1], [l,1])});
        nt.on("mouseover", function() { n.open_textinput(n.title, [0.5,1], [l,1])});
    }

    add_content(content="...") {

        var l = this.geometry[0] - 1;
        var h = this.geometry[1] - 3;

        this.content = this.group.append("g").attr("class", "content");
        // placeholder in case the string below ('nt') is empty
        var rt = this.content.append("rect")
                    .attr("fill", "#ffffff").attr("fill-opacity", "0")
                    .attr("x", "0.5em").attr("y", "2em")
                    .attr("width", l / 2 + "em").attr("height", h + "em");
        var nt = this.content.append("text")
                    .attr("width", l + "em").attr("height", h + "em")
                    .attr("x", "0.5em").attr("y", "3em")
                    .text(content);
        var n = this;
        // add the event to both nodes, as sometimes the text is small,
        // sometimes big...
//TODO: I'd prefer "focus/blur" here. Collision with "drag"?
//        nt.on("drag", null);
        rt.on("mouseover", function() { n.open_textinput(n.content, [0.5,2], [l, h])});
        nt.on("mouseover", function() { n.open_textinput(n.content, [0.5,2], [l, h])});
    }

    toJSON(indent="", startindent="") {

        let dindent = startindent + indent;
        let json = super.toJSON(indent, startindent);
        json = json.substring(0, json.length - 1);
        if (typeof this.title !== 'undefined' &&
                typeof this.title.node().textContent === 'string') {
            json += ',\n' + dindent + '"title": "' +
                                this.title.node().textContent + '"';
        }
        if (typeof this.content !== 'undefined' &&
                typeof this.content.select("text") !== 'undefined') {
            let t = "";
            let a = this.content.select("text").node().childNodes;
            for (let i = 0; i < a.length; i++) {
                if (a[i].textContent) {
                    t += a[i].textContent + "<br/>";
                }
            }
            json += ',\n' + dindent + '"content": "' + t + '"';
        }
        json += "\n" + startindent + "}";
        return json;
    }
}

class Stack {

    constructor(board, group, type="Type", color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        this.parent_group = group;
        this.group = group.append("g").attr("class", "stack");
        new Adhesive(board, group, color, geometry, [ position[0] + 4, position[1] + 4]);
        new Adhesive(board, group, color, geometry, [ position[0] + 2, position[1] + 2]);
        let n = new NoteIt(board, group, color, geometry, [position[0], position[1]]);
        n.add_type("Type");
        n.handles = ["close", "new", "color", "visible"];
        n.draggable = true;
        n.add_handle_new();
        n.add_handle_visible();
        n.add_handle_color();
        n.children_group.raise();
        board.adhesives.set(n.id, n);
        return this;
    }
}

var board = new SketchBoard("#sketchboard");
var rstack = new Stack(board, board.group, "Type", ["#f7ff72", "#ff6ee2", "#6ee0ff"], [14,14]);

var back = d3.select("#sketchboardjson");
back.append("input").attr("type", "button")
            .attr("value", "Save").on("click", function() {
    d3.select("#sketchboardjson").select("textarea").text(board.toJSON("  "));
});
back.append("input").attr("type", "button")
            .attr("value", "Load").on("click", function() {
    board.fromJSON(d3.select("#sketchboardjson").select("textarea").node().textContent);
});

