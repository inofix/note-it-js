import Adhesive from './adhesive';

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

export default InstantPhoto;
