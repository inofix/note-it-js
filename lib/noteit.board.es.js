
class SketchBoard {
/**
 * The SketchBoard is the planning board used to put colored
 * sticking papers on.
 **/

    constructor(svgSelector, geometry=[], uuid, dark=false) {
    /*
     * Create an empty SketchBoard
     */
        // the root element is an svg node with this name..
        this.svg = d3.select(svgSelector);

        // the geometry of the whole thing
        if (geometry[1]) {
            this.svg.attr("style", "width: " + geometry[0] + "; height: " +
                                                    geometry[1] + ";");
        }

        // whether to have a black or white board as a basis
        this.dark = dark;
        if (dark) {
            this.svg.style("background", "#000000");
        }

        // store the actual position for reference
        this.position = [ this.svg.node().getBoundingClientRect().left,
                            this.svg.node().getBoundingClientRect().top ]

        // use UUID or some simplified ID
        if (uuid) {
            this.uuid = true;
        } else {
            this.uuid = false;
        }

        // svg group to contain all the adhesives on this board
        this.group = this.svg.append("g").attr("class", "sketchboard");
//TODO add a slider and some shortcuts too for keyboard fetishists like myself (I have no wheel on my trackpoint)..
        var g = this.group;
        this.group.call(d3.zoom().on("zoom", function() {
            g.attr("transform", "scale(" + d3.event.transform.k + ")");
        }));

        // a map of all adhesives
        this.adhesives = new Map();

        // only used for batch importing adhesives (see createAdhesives)
        this.adhesiveQueue = new Map();

        return this;
    }

    getId(uuid) {
    /*
     * Switch for the right method
     */

        if (typeof uuid === 'undefined') {
            uuid = this.uuid;
        }
        if (uuid) {
            return this.getUuid();
        } else {
            return this.getUid();
        }
    }

    getUid() {
    /*
     * short ID version
     */
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

    getUuid() {
    /*
     * Use UUID. See https://gist.github.com/LeverOne/1308368
     */
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

    toJSON(indent="  ", startIndent="") {
    /*
     * store the sketch board contents as a JSON string
     */
        var json = startIndent + "{\n";
        for (let n of this.adhesives.values()) {
            let nj = n.toJSON(indent, startIndent + indent);
            if (typeof nj === 'string' && nj !== '') {
                json += n.toJSON(indent, startIndent + indent) + ",\n";
            }
        }
        if (json.length > 2) {
            json = json.substring(0, json.length - 2) + "\n" +
                                        startIndent + "}";
        } else {
            // clear the area also if the maps are empty
            json = "";
        }
        return json;
    }

    fromJSON(json) {
    /*
     * Parse the JSON string and create the content
     */
        let j = JSON.parse(json);

        this.adhesiveQueue = new Map();
        for (let k of Object.keys(j)) {
            this.adhesiveQueue.set(k, j[k]);
        }
        this.createAdhesives();
    }

    createAdhesives() {
    /*
     * Create Adhesives an put them onto the board
     */
        for (let k of this.adhesiveQueue.keys()) {
//            alert("a: " + k)
            this.createAdhesive(k);
        }
    }

    createAdhesive(adhesiveKey) {
    /*
     * Create a certain Adhesive from the list or just get
     * the existing one..
     */
        var o = this.adhesives.get(adhesiveKey);
        var q = this.adhesiveQueue.get(adhesiveKey);
        if (typeof o === 'object') {
            return o;
        } else if (typeof q === 'object') {
            switch (q["class"]) {
                case "adhesive":
                    return Adhesive.create(this, adhesiveKey);
                case "noteit":
                    return NoteIt.create(this, adhesiveKey);
                default:
                    alert("Could not create the '" + adhesiveKey +
                            "' of type '" + q["class"] + "'");
            }
        } else {
            alert("There is no '" + adhesiveKey + "' in the adhesiveQueue");
        }
    }
}

class Adhesive {

    // TODO: If I declare this static, I can not access it via the class ..
    get CSS_CLASS() { return "adhesive"; }

    constructor(board, group, id="", color=["#f7ff72"], geometry=[10,10], position=[0,0]) {

        this.board = board;
        if (typeof id === "undefined" || id == '') {
            this.id = board.getId();
        } else {
            this.id = id;
        }
        this.parentGroup = group;
//        this.parentObject;
        this.group = group.append("g").attr("class", this.CSS_CLASS)
                        .attr("id", this.id);
        this.childrenGroup = this.group.append("g").attr("class", "children");
        this.childObjects = new Map();
        this.color = color;
        // note: the height/width via css above works in chrome
        // but for ff it must be set here...
        this.paper = this.group.append("rect")
                        .attr("width", geometry[0] + "em")
                        .attr("height", geometry[1] + "em");
        this.geometry = geometry;
        this.group.attr("transform", "translate(" + position[0] + "," + position[1] + ")");
        this.position = position;
        this.translatePosition = [0,0];
        let strokeColor = "#000000";
        if (board.dark) {
            strokeColor = "#ffffff";
        }
        this.paper.style("fill", color[0])
                .style("stroke", strokeColor)
                .style("stroke-width", "1px");
        // whether it can be persisted with toJSON
        this.persistable = true;
        this.persistableChildren = true;
        return this;
    }

    // set the basic features separatly from the constructor for more
    // control over super classes
    setFeatures(handles=["close", "new"], draggable=true, persistable=true, type) {

        if (draggable) {
            this.enableDrag();
        }
        this.persistable = persistable;
        this.persistableChildren = persistable;
        if (typeof type === 'string') {
            this.addType(type);
        }
        this.addHandles(handles);
    }

    translate(delta=[0,0]) {

        this.translatePosition = delta;
        if (this.draggable) {
            this.enableDrag();
        }
        this.group.raise().attr("transform", "translate(" + delta[0] +
                    "," + delta[1] + ")");
    }

    addType(type="Type") {

        let l = this.geometry[0] / 2;
        this.type = this.group.append("g").attr("class", "type");
        var nt = this.type.append("text")
                    .attr("x", "1.4em").attr("y", "1em")
                    .attr("width", l + "em").attr("height", "0.8em")
                    .style("font-size", "0.8em")
                    .attr("fill", "grey")
                    .text(type);
    }

    toggleTextEdit(textelement, position, geometry) {

        var foreign = textelement.select("foreignObject");
        if (foreign.size() > 0) {
            this.setMultilineText(textelement, position,
                                    foreign.node().textContent);
        } else {
            this.openTextinput(textelement, position, geometry);
        }
    }

    openTextinput(textelement, position, geometry) {
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
        d.on("blur", function () {
            d.text(d.node().value);
        });
    }

    setMultilineText(textelement, position, text) {

        var textnode = textelement.select("text");
        var foreign = textelement.select("foreignObject");
        textnode.text("");
        if (typeof foreign === 'undefined') {
            text = text.split("<br/>");
        } else {
            text = text.replace(/\r\n/g, "\n").split("\n");
            foreign.remove();
        }
        for (let i = 0; i < text.length; i++) {

                // calc the distance from to for the next tspan
                let tY = i + position[1] + 1;
                let tI = textnode.append("tspan")
                            .attr("x", position[0] + "em").attr("y", tY + "em");
                tI.text(text[i]);
        }
    }

    addHandles(handles) {

        // dispatch the handles to control the order..
        this.handles = handles;
        this.handleClose = false;
        this.handleNew = false;
        this.handleColor = false;
        this.handleEdit = false;
        this.handleVisible = false;
        this.handleLabel = false;
        for (var h of handles) {
            switch (h) {
                case "close":
                this.handleClose = true;
                break;
                case "new":
                this.handleNew = true;
                break;
                case "color":
                this.handleColor = true;
                break;
                case "edit":
                this.handleEdit = true;
                break;
                case "visible":
                this.handleVisible = true;
                break;
                case "label":
                this.handleLabel = true;
                break;
            }
        }
        if (this.handleColor) {
            this.addHandleColor();
        }
        if (this.handleEdit) {
            this.addHandleEdit();
        }
        if (this.handleClose) {
            this.addHandleClose();
        }
        if (this.handleVisible) {
            this.addHandleVisible();
        }
        if (this.handleNew) {
            this.addHandleNew();
        }
        if (this.handleLabel) {
            this.addHandleLabel();
        }
    }

    addHandle(slot, text) {

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
    addHandleNew() {

        let h = this.addHandle(3, "&");

        var p = this;
        var g = this.childrenGroup;
        var nX = this.group.node().getBoundingClientRect().left -
                    this.parentGroup.node().getBoundingClientRect().left +
                    this.position[0];
        var nY = this.group.node().getBoundingClientRect().top -
                    this.parentGroup.node().getBoundingClientRect().top +
                    this.position[1];
        h.on("click", function() {
            let n = new Adhesive(p.board, g, "", p.color.slice(),
                        p.geometry, [nX, nY]);
            n.setFeatures(p.handles, p.draggable, p.persistableChildren,
                        p.type.node().textContent);
            n.parentObject = p;
            p.childObjects.set(n.id, n);

            p.showHandleVisible();
            p.board.adhesives.set(n.id, n);
            g.raise();
        });
    }

    addHandleLabel() {

        let h = this.addHandle(4, "L");

        var p = this;
        var g = this.childrenGroup;
        var nX = this.group.node().getBoundingClientRect().left -
                    this.parentGroup.node().getBoundingClientRect().left +
                    this.position[0];
        var nY = this.group.node().getBoundingClientRect().top -
                    this.parentGroup.node().getBoundingClientRect().top +
                    this.position[1];
        h.on("click", function() {
            let n = new Adhesive(p.board, g, "",
                        ["#ff6666","#00ff00","#7788ff"],
                        [8,1], [nX, nY]);
//TODO: why is it not persistable? "false/true"
            n.setFeatures(["close","color","edit"], p.draggable, true, "Label");
            n.parentObject = p;
            p.childObjects.set(n.id, n);

            p.board.adhesives.set(n.id, n);
            g.raise();
        });
    }

    addHandleEdit() {

        let tl = this.geometry[0] / 2;
        let hl = tl - 2;
        let h = this.addHandle(hl, "!");
        var n = this;
        h.on("click", function() {
            n.toggleTextEdit(n.type, [1.2,0], [tl,1])
        });
    }

    addHandleVisible() {

        let h = this.addHandle(2, "+");
        this.childrenGroup.style("visibility", "visible");
        h.text("\u2013");
        this.showHandleVisible();
    }

    showHandleVisible() {
// TODO resolve hardcoded slot for the ID.. see TODO above for details
        let h = this.group.select("#handle" + 2);
        let n = this;
        if (this.childObjects.size > 0) {
            h.style("fill", "black");
            h.on("click", function() {

                n.toggleHandleVisible();
            });

        } else {
            h.style("fill", "lightgrey");
            h.on("click", null);
        }
    }

    toggleHandleVisible(text) {

// TODO resolve hardcoded slot for the ID.. see TODO above for details
        let h = this.group.select("#handle" + 2).select("text");
        if (typeof text === 'undefined') {

            text = h.node().textContent;
        }

        if (text == '\u2013') {
            this.childrenGroup.style("visibility", "hidden");
            h.text("+");
        } else {
            this.childrenGroup.style("visibility", "visible");
            h.text("\u2013");
        }
        this.showHandleVisible();
        for (let [key, value] of this.childObjects) {

            value.toggleHandleVisible(text);
        }
    }

//.style("visibility", function (d) {
//    return d.children.size === 1 ? "hidden" : "visible";
//  })

    addHandleColor() {

        let l = 2;
        l = l + "px";
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

    addHandleClose() {

        var n = this;

        let h = this.addHandle(1, "x");
        h.on("click", function() { n.snuffit() });
    }

    enableDrag() {

        this.draggable = true;
        var n = this.group;

        var nX = this.group.node().getBoundingClientRect().left - this.parentGroup.node().getBoundingClientRect().left + this.position[0] + this.translatePosition[0];
        var nY = this.group.node().getBoundingClientRect().top - this.parentGroup.node().getBoundingClientRect().top + this.position[1] + this.translatePosition[1];

        this.group.call(d3.drag().on("drag", function() {

            nX += d3.event.dx;
            nY += d3.event.dy;
            n.raise().attr("transform", "translate(" + nX + "," + nY + ")");
        }));
    }

    snuffit() {

        this.board.adhesives.delete(this.id);
        for (let c of this.childObjects.values()) {
            c.snuffit();
        }
        if (typeof this.parentObject !== 'undefined' &&
                    typeof this.parentObject.childObjects !== 'undefined') {
            this.parentObject.childObjects.delete(this.id);
            this.parentObject.showHandleVisible();
        }
        this.group.remove();
    }

    toJSON(indent="", startIndent="") {

        if (! this.persistable) {
            return "";
        }

        let json = startIndent + '"' + this.id + '": {\n';
        let dindent = startIndent + indent;
        json += dindent + '"class": "' + this.CSS_CLASS + '",\n';
        if (typeof this.parentObject === 'object') {

            json += dindent + '"parentId": "' + this.parentObject.id + '",\n';
        }
// either parent or children should do it..
//        let a = Array.from(this.childObjects.keys());
//        if (a.length > 0) {
//            json += '"childrenIds": ' + a + ', ';
//        }
        let c = "";
        for (let i=0; i<this.color.length; i++) {
            c += '"' + this.color[i] + '",';
        }
        let h = "";
        for (let i=0; i<this.handles.length; i++) {
            h += '"' + this.handles[i] + '",';
        }
        let t = this.group.attr("transform").replace("translate(", "")
                    .replace(")", "").split(",");
        this.translatePosition = [ parseInt(t[0]), parseInt(t[1]) ];
        json += dindent + '"color": [' + c.substring(0, c.length - 1) + '],\n' +
                dindent + '"geometry": [' + this.geometry + '],\n' +
                dindent + '"position": [' + this.position + '],\n' +
                dindent + '"transform": [' + this.translatePosition + '],\n' +
                dindent + '"handles": [' + h.substring(0, h.length - 1) +
                '],\n' +
                dindent + '"type": "' + this.type.node().textContent + '"';
        if (this.CSS_CLASS == "adhesive") {
            json += '\n' + startIndent + '}';
        }
        return json;
// board, group handles, draggable
    }

    static create(board, key) {

        let o = board.adhesiveQueue.get(key);
        if (typeof o === 'object') {
            board.adhesiveQueue.delete(key);
            let group = board.group;
            if (typeof o["parentId"] !== 'undefined') {
                var p = board.createAdhesive(o["parentId"]);
                group = p.childrenGroup;
            }
            let a = new Adhesive(board, group, key, o["color"],
                                    o["geometry"], o["position"]);
            a.setFeatures(o["handles"], o["draggable"], o["persistable"],
                                    o["type"]);
/// TODO: make the constructor using "parent object" instead of "parent group"
            if (typeof o["parentId"] !== 'undefined') {
                a.parentObject = p;
                p.childObjects.set(key, a);
                p.childrenGroup.raise();
            }
            board.adhesives.set(key, a);
            a.translate(o["transform"]);
            return a;
        } else {
            alert("There is no '" + adhesiveKey + "' in the adhesiveQueue");
        }
    }
}

// class Label extends Adhesive {
// }

class NoteIt extends Adhesive {

    get CSS_CLASS() { return "noteit"; }

    constructor(board, group, id="", color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        super(board, group, id, color, geometry, position);
        return this;
    }

    // set the basic features separatly from the constructor for more
    // control over super classes
    setFeatures(handles=["close", "new"], draggable=true, persistable=true,
                                                    type, title, content) {
        if (draggable) {
            this.enableDrag();
        }
        this.persistable = persistable;
        this.persistableChildren = persistable;
        if (typeof type === 'string') {
            this.addType(type);
        }
        if (typeof title === 'string') {
            this.addTitle(title);
        }
        if (typeof content === 'string') {
            this.addContent(content);
        }
        this.addHandles(handles);
    }

    // TODO: I can not access the class ..
    addHandleNew() {

        let h = this.addHandle(3, "&");

        var p = this;
        var g = this.childrenGroup;
        var nX = this.group.node().getBoundingClientRect().left -
                    this.parentGroup.node().getBoundingClientRect().left +
                    this.geometry[0] * 2;
        var nY = this.group.node().getBoundingClientRect().top -
                    this.parentGroup.node().getBoundingClientRect().top +
                    this.geometry[1] * 2;
        h.on("click", function() {
            var n = new NoteIt(p.board, g, "", p.color.slice(),
                                p.geometry, [nX,nY]);
            n.setFeatures(p.handles, p.draggable, p.persistableChildren,
                                p.type.node().textContent, "Title", "...");
            n.parentObject = p;
            p.childObjects.set(n.id, n);
            p.board.adhesives.set(n.id, n);
            g.raise();
            p.showHandleVisible();
        });
    }

    addHandleEdit() {

        let tl = this.geometry[0] / 2;
        let hl = tl - 2;
        let til = this.geometry[0] - 1;
        let cl = til;
        let ch = this.geometry[1] - 3;
        let h = this.addHandle(hl, "!");
        var n = this;
        h.on("click", function() {
            if (typeof n.type !== 'undefined') {
                n.toggleTextEdit(n.type, [1.2,0], [tl,1]);
            }
            if (typeof n.title !== 'undefined') {
                n.toggleTextEdit(n.title, [0.5,1], [til,1]);
            }
            if (typeof n.content !== 'undefined') {
                n.toggleTextEdit(n.content, [0.5,2], [cl,ch]);
            }
        });
    }

    addTitle(title="Title") {

        let l = this.geometry[0] - 1;

        this.title = this.group.append("g").attr("class", "title");
        var nt = this.title.append("text")
                    .attr("width", l + "em").attr("height", "1em")
                    .attr("x", "0.5em").attr("y", "2em")
                    .style("font-weight", "bold")
                    .text(title);
    }

    addContent(content="...") {

        var l = this.geometry[0] - 1;
        var h = this.geometry[1] - 3;

        this.content = this.group.append("g").attr("class", "content");
        var nt = this.content.append("text")
                    .attr("width", l + "em").attr("height", h + "em")
                    .attr("x", "0.5em").attr("y", "3em");
        this.setMultilineText(nt, [0.5,2], content);
    }

    toJSON(indent="", startIndent="") {

        if (! this.persistable) {
            return "";
        }

        let dindent = startIndent + indent;
        let json = super.toJSON(indent, startIndent);
//        json = json.substring(0, json.length - 2);
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
        if (this.CSS_CLASS == "noteit") {
            json += "\n" + startIndent + "}";
        }
        return json;
    }

    static create(board, key) {

        let o = board.adhesiveQueue.get(key);
        if (typeof o === 'object') {
            board.adhesiveQueue.delete(key);
            let group = board.group;
            if (typeof o["parentId"] !== 'undefined') {
                var p = board.createAdhesive(o["parentId"]);
                group = p.childrenGroup;
            }

            let a = new NoteIt(board, group, key, o["color"],
                                    o["geometry"], o["position"]);
            a.setFeatures(o["handles"], o["draggable"], o["persistable"],
                            o["type"], o["title"], o["content"]);
/// TODO: make the constructor using "parent object" instead of "parent group"
            if (typeof o["parentId"] !== 'undefined') {
                a.parentObject = p;
                p.childObjects.set(key, a);
                p.childrenGroup.raise();
            }
            board.adhesives.set(key, a);
            a.translate(o["transform"]);
            return a;
        } else {
            alert("There is no '" + adhesiveKey + "' in the adhesiveQueue");
        }
    }
}

class Stack {

    constructor(board, group, type="Type", color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        this.parentGroup = group;
        this.group = group.append("g").attr("class", "stack");
        new Adhesive(board, group, "stack1", color, geometry, [ position[0] + 4, position[1] + 4]);
        new Adhesive(board, group, "stack0", color, geometry, [ position[0] + 2, position[1] + 2]);
        let n = new NoteIt(board, group, "stack", color, geometry, [position[0], position[1]]);
        n.addType("Type");
        n.handles = ["close", "new", "color", "edit", "visible", "label"];
        n.draggable = true;
        n.persistable = true;
        n.persistableChildren = true;
        n.addHandleNew();
        n.addHandleVisible();
        n.addHandleColor();
        n.childrenGroup.raise();
        board.adhesives.set(n.id, n);
        return this;
    }
}

