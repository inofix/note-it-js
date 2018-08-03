
/**
 * The SketchBoard is the planning board used to put colored
 * sticking papers on.
 **/
class SketchBoard {

   /**
    * Create an empty SketchBoard
    **/
    constructor(svgSelector, geometry=[], uuid, dark=false, gallery=null) {
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

        // to hold a provided (controlled) array of image locations
        this.gallery = gallery;

        return this;
    }

   /**
    * Create a new id for an element. Depending on the setting
    * use shorter or longer ids.
    **/
    getId(uuid) {

        if (typeof uuid === 'undefined') {
            uuid = this.uuid;
        }
        if (uuid) {
            return this.getUuid();
        } else {
            return this.getUid();
        }
    }

   /**
    * Short ID version, see getId(uuid)
    **/
    getUid() {
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

   /**
    * Use UUID. See https://gist.github.com/LeverOne/1308368 and getId(uuid)
    **/
    getUuid() {
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

   /**
    * store the sketch board contents as a JSON string
    **/
    toJSON(indent="  ", startIndent="") {
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

   /**
    * Parse the JSON string and create the content
    **/
    fromJSON(json) {
        let j = JSON.parse(json);

        this.adhesiveQueue = new Map();
        for (let k of Object.keys(j)) {
            this.adhesiveQueue.set(k, j[k]);
        }
        this.createAdhesives();
    }

   /**
    * Create Adhesives an put them onto the board
    **/
    createAdhesives() {
        for (let k of this.adhesiveQueue.keys()) {
            this.createAdhesive(k);
        }
        for (let [key, value] of this.adhesives) {
            if (value.parentObject === null) {
                // toggle twice:
                /// once to activate the handle
                value.toggleHandleVisible();
                /// once to expand all
                value.toggleHandleVisible();
            } else {
                value.drawEdge(value.parentObject);
            }
        }
    }

   /**
    * Create a certain Adhesive from the list or just get
    * the existing one..
    **/
    createAdhesive(adhesiveKey) {
        var o = this.adhesives.get(adhesiveKey);
        var q = this.adhesiveQueue.get(adhesiveKey);
        if (typeof o === 'object') {
            return o;
        } else if (typeof q === 'object') {
            switch (q["class"]) {
                case "adhesive":
                    return Adhesive.create(this, adhesiveKey);
                case "instantphoto":
                    return InstantPhoto.create(this, adhesiveKey);
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

/**
 * The gallary organizes the images to be displayed.
 **/
class Gallery {

   /**
    * Construct a new Gallery with the attributes
    *  images          array of image location strings
    *  allowRemote     whether to allow images from other vHosts (false)
    **/
    constructor(images=[], allowRemote=false) {
        this.allowRemote = allowRemote;
        this.hosturl = window.location.protocol + "//" +
                                            window.location.hostname;
        let j = window.location.pathname.lastIndexOf("/");
        this.baseurl = this.hosturl + window.location.pathname.substring(0, j);

        this.images = [];

        for (var i=0; i < images.length; i++) {
            this.addImage(images[i]);
        }
        this.size = this.images.length;
    }

   /**
    * Add an image to the list
    **/
    addImage(url) {
        if (this.allowRemote) {
            if (url.startsWith("file://") ||
                url.startsWith("http://") ||
                url.startsWith("https://")) {
                this.images.push(url);
            } else {
                alert("This installation is configured to allow remote URLs. Please use absolute URLs for all image locations.");
            }
        } else {
            if (url.startsWith("/")) {
                this.images.push(this.hosturl + url);
            } else if (url.startsWith(this.hosturl)) {
                this.images.push(url);
            } else if (url.includes(":")) {
                alert("Can not load image: " + url +
                                "images must be on the same vHost.");
            } else {
                this.images.push(this.baseurl + "/" + url);
            }
        }
    }

   /**
    * Get an image by index from the list.
    **/
    getImage(index) {
        if (index < this.size && index >= 0) {
            return this.images[index];
        } else {
            return "";
        }
    }

   /**
    * Show a html list of the images at the specified location.
    **/
    displayImageList(svgSelector) {
        var g = d3.select(svgSelector);
        g.append("xhtml:p").text("Note: if you want to restore the JSON configuration on an other installation, download the following images too:");
        var o = g.append("xhtml:ol");
        for (var image of this.images) {
            o.append("xhtml:li").append("xhtml:a")
                .attr("href", image).text(image);
        }
    }
}

/**
 * The main element on the board. It can be used as a simple adhesive
 * or as a base class for more complex forms of adhesives.
 **/
class Adhesive {

    /** Class identifier to distinguish the adhesives. **/
    // TODO: If I declare this static, I can not access it via the class ..
    get CSS_CLASS() { return "adhesive"; }

   /**
    * Create an Adhesive
    **/
    constructor(board, group, parentObject, id="", color=["#f7ff72"], geometry=[10,10], position=[0,0]) {

        // unset all handles - they will be set later on demand..
        this.handleClose = false;
        this.handleNew = false;
        this.handleColor = false;
        this.handleEdit = false;
        this.handleVisible = false;
        this.handleLabel = false;
        this.handleURI = false;
        this.handlePhoto = false;

        this.board = board;
        if (typeof id === "undefined" || id == '') {
            this.id = board.getId();
        } else {
            this.id = id;
        }
        this.parentGroup = group;
        this.parentObject = parentObject;
        this.group = group.append("g").attr("class", this.CSS_CLASS)
                        .attr("id", this.id);
        this.childrenGroup = this.group.append("g").attr("class", "children");
        this.childObjects = new Map();
        this.color = color;
        // note: the height/width via css above works in chrome
        // but for ff it must be set here...
        let gXn = geometry[0] + 0.2;
        let gYn = geometry[1] + 0.4;
        this.group.append("rect")
                        .attr("fill", "#000000")
                        .style("opacity", "0.4")
                        .attr("width", gXn + "em")
                        .attr("height", gYn + "em");
        this.paper = this.group.append("rect")
                        .attr("width", geometry[0] + "em")
                        .attr("height", geometry[1] + "em");
        this.geometry = geometry;
        this.geometryPx = [ this.paper.node().getBoundingClientRect().right -
                            this.paper.node().getBoundingClientRect().left,
                            this.paper.node().getBoundingClientRect().bottom -
                            this.paper.node().getBoundingClientRect().top];
        this.group.attr("transform", "translate(" + position[0] + "," + position[1] + ")");
        this.position = position;
        this.translatePosition = position;
        this.positionOnBoard = [this.paper.node().getBoundingClientRect().left -
                        this.board.svg.node().getBoundingClientRect().left,
                        this.paper.node().getBoundingClientRect().top -
                        this.board.svg.node().getBoundingClientRect().top];
        let strokeColor = "#000000";
        if (board.dark) {
            strokeColor = "#ffffff";
        }
        this.paper.style("fill", color[0])
                .style("stroke", strokeColor)
                .style("stroke-width", "1px");
        // now draw a line between child and parent..
        this.parentEdge = null;
        this.edgeVisible = true;
        // whether it can be persisted with toJSON
        this.persistable = true;
        this.persistableChildren = true;
        this.randomRotate = true;
        return this;
    }

   /**
    * Set the basic features separatly from the constructor for more
    * control over super classes.
    **/
    setFeatures(handles=["close", "new"], draggable=true, persistable=true,
                                                edgeVisible=true, type) {

        if (draggable) {
            this.enableDrag();
        }
        this.persistable = persistable;
        this.persistableChildren = persistable;
        if (typeof type === 'string') {
            this.addType(type);
        }
        this.addHandles(handles);
        this.edgeVisible = edgeVisible;
        if (this.parentObject !== null) {
            this.drawEdge(this.parentObject);
        }
    }

   /**
    * Displace an object on the board. See d3js.
    **/
    translate(delta=[0,0]) {

        this.translatePosition = delta;
        if (this.draggable) {
            this.enableDrag();
        }
        this.move(delta);
//        this.group.raise().attr("transform", "translate(" + delta[0] +
//                    "," + delta[1] + ")");
    }

   /**
    * Displace an object on the board. See translate(delta)
    **/
    move(delta=[0,0]) {
        var r = 0;
        if (this.randomRotate) {
            r = 2 * Math.random() - 1;
        }
        this.group.raise().attr("transform", "translate(" + delta[0] +
                    "," + delta[1] + "), rotate(" + r + ")");
    }

   /**
    * Connect two objects by a line.
    **/
    drawEdge(adhesive) {
        if (this.edgeVisible) {
            let p1 = [ 0.5 * this.geometryPx[0], 0 ];
            let p2 = [ 0.5 * adhesive.geometryPx[0] - this.translatePosition[0],
                        adhesive.geometryPx[1] - this.translatePosition[1] ];
            if (this.parentEdge !== null) {
                this.parentEdge.remove();
            }
            this.parentEdge = this.group.append("line")
                    .attr("x1", p1[0])
                    .attr("x2", p2[0])
                    .attr("y1", p1[1])
                    .attr("y2", p2[1])
                    .attr("fill", "none").attr("stroke", "blue")
                    .attr("stroke-width", 2);
            this.parentEdge.lower();
        }
    }

   /**
    * Add a text field for type.
    **/
    addType(type="Type") {

        let l = this.geometry[0] / 2;
        this.type = this.group.append("g").attr("class", "type");
        this.type.append("text")
                    .attr("x", "2em").attr("y", "1em")
                    .attr("width", l + "em").attr("height", "0.8em")
                    .style("font-size", "0.8em")
                    .attr("fill", "grey")
                    .text(type);
    }

   /**
    * Alterate between text edit and display.
    **/
    toggleTextEdit(textelement, position, geometry) {

        var foreign = textelement.select("foreignObject");
        if (foreign.size() > 0) {
            this.setMultilineText(textelement, position,
                                    foreign.node().textContent);
        } else {
            this.openTextInput(textelement, position, geometry);
        }
    }

   /**
    * Edit a textfield.
    **/
    openTextInput(textelement, position, geometry) {
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

   /**
    * Display text on multiple lines.
    **/
    setMultilineText(textelement, position, text) {

        var textnode = textelement.select("text");
        var foreign = textelement.selectAll("foreignObject");
        textnode.text("");
        if (foreign.size() > 0) {
            text = text.replace(/<br\/>/g, "\n").replace(/\r\n/g, "\n")
                    .split("\n");
            foreign.remove();
        } else {
            text = text.split("<br/>");
        }
        for (let i = 0; i < text.length; i++) {

                // calc the distance to the next tspan
                let tY = i + position[1] + 1;
                let tI = textnode.append("tspan")
                            .attr("x", position[0] + "em").attr("y", tY + "em");
                tI.text(text[i]);
        }
    }

   /**
    * Enable the handles on the adhesive.
    **/
    addHandles(handles) {

        this.handles = handles;
        var slot = 0;
        for (var i = 0; i < handles.length; i++) {
            switch (handles[i]) {
                case "close":
                this.handleClose = true;
                slot += 0.8;
                this.addHandleClose(slot);
                break;
                case "new":
                this.handleNew = true;
                slot += 0.8;
                this.addHandleNew(slot);
                break;
                case "color":
                this.handleColor = true;
                this.addHandleColor();
                break;
                case "edit":
                this.handleEdit = true;
                this.addHandleEdit();
                break;
                case "visible":
                this.handleVisible = true;
                slot += 0.8;
                this.addHandleVisible(slot);
                break;
                case "label":
                this.handleLabel = true;
                slot += 0.8;
                this.addHandleLabel(slot);
                break;
                case "photo":
                this.handlePhoto = true;
                slot += 0.8;
                this.addHandlePhoto(slot);
                break;
                case "uri":
                this.handleURI = true;
                slot += 0.8;
                this.addHandleURI(slot);
                break;
                case "":
                slot += 0.8;
                break;
            }
        }
    }

   /**
    * Enable a certain handle on the adhesive.
    **/
    addHandle(slot, name, text) {

        let l = this.geometry[0] - slot;
        let h = this.group.append("g").attr("class", "handle")
                    .attr("id", "handle" + name)
                    .attr("width", "1em").attr("height", "1em");
        return h.append("text").text(text).attr("x", l + "em").attr("y", "0.9em");
    }

    // just a helper:
    // TODO: I can not access the class ..
   /**
    * Add a handle that creates a clone of the current adhesive
    * as a child element to the current adhesive.
    **/
    addHandleNew(slot) {

        let h = this.addHandle(slot, "New", "&");

        var p = this;
        var g = this.childrenGroup;
        var nX = this.group.node().getBoundingClientRect().left -
                    this.parentGroup.node().getBoundingClientRect().left +
                    this.position[0];
        var nY = this.group.node().getBoundingClientRect().top -
                    this.parentGroup.node().getBoundingClientRect().top +
                    this.position[1];
        h.on("click", function() {
            let n = new Adhesive(p.board, g, p, "", p.color.slice(),
                        p.geometry, [nX, nY]);
            n.setFeatures(p.handles, p.draggable, p.persistableChildren,
                        p.edgeVisible, p.type.node().textContent);
            p.childObjects.set(n.id, n);

            p.showHandleVisible();
            p.board.adhesives.set(n.id, n);
            g.raise();
        });
    }

   /**
    * Add a handle that creates an URI displaying adhesive.
    **/
    addHandleURI(slot) {

        let h = this.addHandle(slot, "URI", "U");

        var p = this;
        var g = this.childrenGroup;
        var nX = this.group.node().getBoundingClientRect().left -
                    this.parentGroup.node().getBoundingClientRect().left +
                    this.position[0];
        var nY = this.group.node().getBoundingClientRect().top -
                    this.parentGroup.node().getBoundingClientRect().top +
                    this.position[1];
        h.on("click", function() {
            let n = new URI(p.board, g, p, "",
                        ["#ddddff"], undefined, [nX, nY]);
            n.setFeatures(["close","label","edit"], p.draggable, true, false, "URI Name;scheme:path");
            p.childObjects.set(n.id, n);

            p.board.adhesives.set(n.id, n);
            g.raise();
        });
    }

   /**
    * Add a handle that creates an image holding adhesive.
    **/
    addHandlePhoto(slot) {

        let h = this.addHandle(slot, "Photo", "P");

        var p = this;
        var g = this.childrenGroup;
        var nX = this.group.node().getBoundingClientRect().left -
                    this.parentGroup.node().getBoundingClientRect().left +
                    this.position[0];
        var nY = this.group.node().getBoundingClientRect().top -
                    this.parentGroup.node().getBoundingClientRect().top +
                    this.position[1];
        h.on("click", function() {
            let n = new InstantPhoto(p.board, g, p, "");
            n.setFeatures(["close", "label", "edit"],
                                p.draggable, true, false, "Photo");
            p.childObjects.set(n.id, n);

            p.board.adhesives.set(n.id, n);
            g.raise();
        });
    }

   /**
    * Add a handle that creates a small adhesive which can be used to
    * label the current adhesive.
    **/
    addHandleLabel(slot) {

        let h = this.addHandle(slot, "Label", "L");

        var p = this;
        var g = this.childrenGroup;
        var nX = this.group.node().getBoundingClientRect().left -
                    this.parentGroup.node().getBoundingClientRect().left +
                    this.position[0];
        var nY = this.group.node().getBoundingClientRect().top -
                    this.parentGroup.node().getBoundingClientRect().top +
                    this.position[1];
        h.on("click", function() {
            let n = new Adhesive(p.board, g, p, "",
                        ["#ff6666","#00ff00","#7788ff"],
                        [8,1], [nX, nY]);
//TODO: why is it not persistable? "false/true"
            n.setFeatures(["close","color","edit"], p.draggable, true,
                                                false, "Label");
            p.childObjects.set(n.id, n);

            p.board.adhesives.set(n.id, n);
            g.raise();
        });
    }

   /**
    * Add a handle that allows text editing.
    **/
    addHandleEdit() {

        let tl = this.geometry[0];
        let hl = tl - 1.2;
        let h = this.addHandle(hl, "Edit", "!");
        var n = this;
        h.on("click", function() {
            n.toggleTextEdit(n.type, [2,0], [tl,1]);
        });
    }

   /**
    * Add a handle that shows and hides the child elements.
    **/
    addHandleVisible(slot) {

        let h = this.addHandle(slot, "Visible", "+");
        this.childrenGroup.style("visibility", "visible");
        h.text("\u2013");
        this.showHandleVisible();
    }

   /**
    * Enable/disable the visibility handle.
    **/
    showHandleVisible() {
        let h = this.group.select("#handleVisible");
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

   /**
    * Alternate between show and hide of the child elements.
    **/
    toggleHandleVisible(text) {

        let h = this.group.select("#handleVisible").select("text");
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

            if (value.handleVisible) {
                value.toggleHandleVisible(text);
            }
        }
    }

//.style("visibility", function (d) {
//    return d.children.size === 1 ? "hidden" : "visible";
//  })

   /**
    * Add a handle to choose the adhesives background color.
    **/
    addHandleColor() {

        let l = 2;
        l = l + "px";
//        let l = 2;

        var c = this.color;
        var p = this.paper;

        var h = this.group.append("g").attr("class", "handle")
                    .attr("id", "handleColor");
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

   /**
    * Add a handle that closes the current adhesive.
    **/
    addHandleClose(slot) {

        var n = this;

        let h = this.addHandle(slot, "Close", "x");
        h.on("click", function() { n.snuffit() });
    }

   /**
    * Allow the element to be moveable on the board.
    **/
    enableDrag() {

        this.draggable = true;
        var n = this;
        var g = this.group;

        var nX = this.translatePosition[0];
        var nY = this.translatePosition[1];

        this.group.call(d3.drag().on("drag", function() {

            nX += d3.event.dx;
            nY += d3.event.dy;
            n.translatePosition = [nX, nY];
            if (n.parentObject !== null) {
                n.drawEdge(n.parentObject);
            }
            n.move([nX,nY]);
//            g.raise().attr("transform", "translate(" + nX + "," + nY + ")");
        }));
    }

   /**
    * Remove the current adhesive completely from the board, with all
    * its children.
    **/
    snuffit() {

        this.board.adhesives.delete(this.id);
        for (let c of this.childObjects.values()) {
            c.snuffit();
        }
        if (this.parentObject !== null &&
                    typeof this.parentObject.childObjects !== 'undefined') {
            this.parentObject.childObjects.delete(this.id);
            this.parentObject.showHandleVisible();
        }
        this.group.remove();
    }

   /**
    * Translate the current adhesives content into JSON form.
    **/
    toJSON(indent="", startIndent="") {

        if (! this.persistable) {
            return "";
        }

        let json = startIndent + '"' + this.id + '": {\n';
        let dindent = startIndent + indent;
        json += dindent + '"class": "' + this.CSS_CLASS + '",\n';
        if (this.parentObject !== null) {

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
                dindent + '"edgeVisible": ' + this.edgeVisible + ',\n' +
//                dindent + '"draggable": ' + this.draggable + ',\n' +
                dindent + '"handles": [' + h.substring(0, h.length - 1) +
                '],\n' +
                dindent + '"type": "' + this.type.node().textContent + '"';
        if (this.CSS_CLASS == "adhesive") {
            json += '\n' + startIndent + '}';
        }
        return json;
// board, group handles, draggable
    }

   /**
    * Statically create a new adhesive.
    **/
    static create(board, key) {

        let o = board.adhesiveQueue.get(key);
        if (typeof o === 'object') {
            board.adhesiveQueue.delete(key);
            let group = board.group;
            var p = null;
            if (typeof o["parentId"] !== 'undefined') {
                p = board.createAdhesive(o["parentId"]);
                group = p.childrenGroup;
            }
            let a = new Adhesive(board, group, p, key, o["color"],
                                    o["geometry"], o["position"]);
            a.setFeatures(o["handles"], o["draggable"], o["persistable"],
                                    o["edgeVisible"], o["type"]);
            if (typeof o["parentId"] !== 'undefined') {
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

/**
 * A oneliner adhesive to organize URIs.
 **/
class URI extends Adhesive {

   /** Class identifier to distinguish the adhesives. **/
    get CSS_CLASS() { return "uri"; }

   /**
    * Create an URI Adhesive.
    **/
    constructor(board, group, parentObject, id="", color=["#ccccff"],
                                    geometry=[20,1.2], position=[2,2]) {
        super(board, group, parentObject, id, color, geometry, position);
        this.uri = null;
    }

   /**
    * Set the basic features separatly from the constructor for more
    * control over super classes.
    **/
    setFeatures(handles=["close", "new"], draggable=true, persistable=true,
                                        edgeVisible=true, uri) {
        if (draggable) {
            this.enableDrag();
        }
        this.persistable = persistable;
        this.persistableChildren = persistable;
        if (typeof uri === 'string') {
            this.addUri(uri);
        }
        this.addHandles(handles);
        this.edgeVisible = edgeVisible;
        if (this.parentObject !== null) {
            this.drawEdge(this.parentObject);
        }
    }

    addUri(uri="") {
        this.uri = this.group.append("g").attr("class", "theuri");
        this.setUri(this.uri, uri);
    }

    setUri(textelement, uri=null) {
        var uA = null;
        var name = "";
        if (uri != null) {
            uA = uri.split(";");
            if (uA.length > 1) {
                name = uA[0];
                uri = uA[1];
            } else {
                uri = uA[0];
            }
        }
        var minL = "12";
        if (name.length == 0) {
            name = uri;
        }
        if (name.length + 1 > minL) {
            minL = name.length + 1;
        }
        var uriA = uri.split(":");
        let tn = this.uri.select("text");
        tn.remove();
        if (uriA.length > 1) {
            if (uriA[1].startsWith("//") || uriA[0] == "mailto" ||
                            uriA[0] == "tel") {
                let a = this.uri.append("svg:a")
                    .attr("class", "anchor")
                    .attr("href", uri);
                a.append("text")
                    .attr("x", "2em").attr("y", "1em")
                    .attr("width", minL).attr("height", "0.8em")
                    .style("font-size", "0.8em")
                    .attr("fill", "blue")
                    .text(name);
            } else {
                minL += uri.length + 1;
                this.uri.append("text")
                    .attr("x", "2em").attr("y", "1em")
                    .attr("width", minL).attr("height", "0.8em")
                    .style("font-size", "0.8em")
                    .attr("fill", "red")
                    .text(name);
            }
        } else {
            this.uri.append("text")
                .attr("x", "2em").attr("y", "1em")
                .attr("width", minL).attr("height", "0.8em")
                .style("font-size", "0.8em")
                .attr("fill", "red")
                .text(name);
        }
    }

    openTextInput(textelement, position, geometry) {
        var textnode = textelement.select("text");
        var t = textnode.text();
        if (textelement.selectAll(".anchor").size() > 0) {
            let tt = textelement.select(".anchor").attr("href");
            if (tt !== t) {
                t += ";" + tt;
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

    toggleUriEdit(textelement, position, geometry) {

        var foreign = textelement.selectAll("foreignObject");
        if (foreign.size() > 0) {
            this.setUri(textelement, foreign.node().textContent);
            foreign.remove();
        } else {
            this.openTextInput(textelement, position, geometry);
        }
    }

    addHandleEdit() {

        let tl = this.geometry[0];
        let hl = tl - 1.2;
        let h = this.addHandle(hl, "Edit", "!");
        var n = this;
        h.on("click", function() {
            n.toggleUriEdit(n.uri, [2,0], [tl,1]);
        });
    }

    toJSON(indent="", startIndent="") {

        if (! this.persistable) {
            return "";
        }

        let dindent = startIndent + indent;
        let json = super.toJSON(indent, startIndent);
        json += ',\n' + dindent + '"uri=": ' + this.uri;
        if (this.CSS_CLASS == "uri") {
            json += '\n' + startIndent + '}';
        }
        return json;
    }
}

/**
 * A sticky container to hold images and to be attached
 * to the board.
 **/
class InstantPhoto extends Adhesive {

   /** Class identifier to distinguish the adhesives. **/
    get CSS_CLASS() { return "instantphoto"; }

   /**
    * Create an InstantPhoto Adhesive
    **/
    constructor(board, group, parentObject, id="", color=["#fafafa"], geometry=[16,16], position=[2,2]) {
        super(board, group, parentObject, id, color, geometry, position);
        this.gallery = board.gallery;
        // crate a frame (5% top/right/left; 20% bottom)
        this.pictureHeight = geometry[0] * .75;
        this.pictureWidth = geometry[1] * .88;
        let pictureHeightRect = this.pictureHeight + .1;
        let pictureWidthRect = this.pictureWidth + .1;
        let pictureFrameSize = geometry[0] * .06;
        this.canvas = this.group.append("g");
        this.canvas.append("rect")
                .attr("width", pictureWidthRect + "em")
                .attr("height", pictureHeightRect + "em")
                .attr("x", pictureFrameSize + "em")
                .attr("y", pictureFrameSize + "em")
                .attr("stroke", "#555555").attr("fill", "#888888");
        this.imageIndex = -1;
        this.image = this.canvas.append("svg:image")
                .attr("xlink:href", "")
                .attr("width", this.pictureWidth + "em")
                .attr("height", this.pictureHeight + "em")
                .attr("x", pictureFrameSize + "em")
                .attr("y", pictureFrameSize + "em");
        return this;
    }

//        let url = this.gallery.getImage(index);

   /**
    * Set the basic features separatly from the constructor for more
    * control over super classes.
    **/
    setFeatures(handles=["close", "label", "uri"], draggable=true,
            persistable=true, edgeVisible=false, type, imageIndex=-1) {
        super.setFeatures(handles, draggable, persistable, edgeVisible, type);
        this.imageIndex = imageIndex;
        this.setImage();
    }

    setImage() {
        this.image.attr("xlink:href", this.gallery.getImage(this.imageIndex));
    }

    setImageSelect() {
        var fontSize = 2;
        var width = this.pictureWidth / fontSize;
        var widthP = width + 0.1;
        var height = this.pictureHeight / fontSize;
//        var halfHeight = this.pictureHeight / fontSize / 2;
        var a = this;
        this.canvas.selectAll("text").remove();
        if (this.imageIndex > 0) {
            this.canvas.append("text")
                .attr("width", fontSize + "em")
                .attr("height", fontSize + "em")
                .attr("x", ".5em")
                .attr("y", height + "em")
                .attr("font-size", fontSize + "em")
                .attr("fill", "white")
                .text("<");
            let h = this.canvas.append("text")
                .attr("width", fontSize + "em")
                .attr("height", fontSize + "em")
                .attr("x", ".6em")
                .attr("y", height + "em")
                .attr("font-size", fontSize + "em")
                .attr("fill", "black")
                .text("<");
            h.on("click", function() {
                a.imageIndex -= 1;
                a.setImage();
                a.setImageSelect();
            });
        }
        if (this.imageIndex < this.gallery.size - 1) {
            this.canvas.append("text")
                .attr("width", fontSize + "em")
                .attr("height", fontSize + "em")
                .attr("x", widthP + "em")
                .attr("y", height + "em")
                .attr("font-size", fontSize + "em")
                .attr("fill", "black")
                .text(">");
            let h = this.canvas.append("text")
                .attr("width", fontSize + "em")
                .attr("height", fontSize + "em")
                .attr("x", width + "em")
                .attr("y", height + "em")
                .attr("font-size", fontSize + "em")
                .attr("fill", "white")
                .text(">");
            h.on("click", function() {
                a.imageIndex += 1;
                a.setImage();
                a.setImageSelect();
            });
        }
    }

    togglePhotoEdit() {

        var t = this.canvas.selectAll("text");
        if (t.size > 0) {
            t.remove();
            this.setImage();
        } else {
            this.setImageSelect();
        }
    }

    addHandleEdit() {

        this.setImageSelect();
        let tl = this.geometry[0];
        let hl = tl - 1.2;
        let til = this.geometry[0] - 1;
        let cl = til;
        let ch = this.geometry[1] - 3;
        let h = this.addHandle(hl, "Edit", "!");
        var n = this;
        h.on("click", function() {
            if (typeof n.type !== 'undefined') {
                n.toggleTextEdit(n.type, [2,0], [tl,1]);
            }
//            if (typeof n.image !== 'undefined') {
//                n.togglePhotoEdit();
//            }
        });
    }

    toJSON(indent="", startIndent="") {

        if (! this.persistable) {
            return "";
        }

        let dindent = startIndent + indent;
        let json = super.toJSON(indent, startIndent);
        json += ',\n' + dindent + '"imageIndex": ' + this.imageIndex;
        if (this.CSS_CLASS == "instantphoto") {
            json += '\n' + startIndent + '}';
        }
        return json;
    }

    static create(board, key) {

        let o = board.adhesiveQueue.get(key);
        if (typeof o === 'object') {
            board.adhesiveQueue.delete(key);
            let group = board.group;
            var p = null;
            if (typeof o["parentId"] !== 'undefined') {
                p = board.createAdhesive(o["parentId"]);
                group = p.childrenGroup;
            }

            let a = new InstantPhoto(board, group, p, key, o["color"],
                                    o["geometry"], o["position"]);
            a.setFeatures(o["handles"], o["draggable"], o["persistable"],
                                o["edgeVisible"], o["type"], o["imageIndex"]);
            if (typeof o["parentId"] !== 'undefined') {
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

/**
 * An adhesive to write notes on.
 **/
class NoteIt extends Adhesive {

   /** Class identifier to distinguish the adhesives. **/
    get CSS_CLASS() { return "noteit"; }

   /**
    * Create a NoteIt Adhesive
    **/
    constructor(board, group, parentObject, id="", color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        super(board, group, parentObject, id, color, geometry, position);
        return this;
    }

   /**
    * Set the basic features separatly from the constructor for more
    * control over super classes.
    **/
    setFeatures(handles=["close", "new"], draggable=true, persistable=true,
                                    edgeVisible=true, type, title, content) {
        if (draggable) {
            this.enableDrag();
        }
        this.persistable = persistable;
        this.persistableChildren = persistable;
        if (this.parentObject !== null) {
            this.drawEdge(this.parentObject);
        }
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
    addHandleNew(slot) {

        let h = this.addHandle(slot, "New", "&");

        var p = this;
        var g = this.childrenGroup;
        var nX = this.group.node().getBoundingClientRect().left -
                    this.parentGroup.node().getBoundingClientRect().left +
                    this.geometry[0] * 2;
        var nY = this.group.node().getBoundingClientRect().top -
                    this.parentGroup.node().getBoundingClientRect().top +
                    this.geometry[1] * 2;
        h.on("click", function() {
            var n = new NoteIt(p.board, g, p, "", p.color.slice(),
                                p.geometry, [nX,nY]);
            n.setFeatures(p.handles, p.draggable, p.persistableChildren,
                   p.edgeVisible, p.type.node().textContent, "Title", "...");
            p.childObjects.set(n.id, n);

            p.board.adhesives.set(n.id, n);
            g.raise();
            p.showHandleVisible();
        });
    }

    addHandleEdit() {

        let tl = this.geometry[0];
        let hl = tl - 1.2;
        let til = this.geometry[0] - 1;
        let cl = til;
        let ch = this.geometry[1] - 3;
        let h = this.addHandle(hl, "Edit", "!");
        var n = this;
        h.on("click", function() {
            if (typeof n.type !== 'undefined') {
                n.toggleTextEdit(n.type, [2,0], [tl,1]);
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
        this.setMultilineText(this.content, [0.5,2], content);
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
            var p = null;
            if (typeof o["parentId"] !== 'undefined') {
                p = board.createAdhesive(o["parentId"]);
                group = p.childrenGroup;
            }

            let a = new NoteIt(board, group, p, key, o["color"],
                                    o["geometry"], o["position"]);
            a.setFeatures(o["handles"], o["draggable"], o["persistable"],
                    o["edgeVisible"], o["type"], o["title"], o["content"]);
            if (typeof o["parentId"] !== 'undefined') {
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

/**
 * A stack of adhesives such that single adhesives can be
 * created from.
 **/
class Stack {

    constructor(board, group, type="Type", color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        this.parentGroup = group;
        this.group = group.append("g").attr("class", "stack");
        new Adhesive(board, group, null, "stack1", color, geometry, [ position[0] + 4, position[1] + 4]);
        new Adhesive(board, group, null, "stack0", color, geometry, [ position[0] + 2, position[1] + 2]);
        let n = new NoteIt(board, group, null, "stack", color, geometry, [position[0], position[1]]);
        n.addType("Type");
        n.handles = ["close", "visible", "new", "color", "edit", "label", "uri", "photo"];
        n.draggable = true;
        n.persistable = true;
        n.persistableChildren = true;
        n.addHandleNew(2.4);
        n.addHandleVisible(1.6);
        n.addHandleColor();
        n.childrenGroup.raise();
        board.adhesives.set(n.id, n);
        return this;
    }
}

