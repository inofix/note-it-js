import * as d3 from "d3";

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
                                            window.location.host;
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

export default Gallery;
