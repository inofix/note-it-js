import * as d3 from 'd3'
import Adhesive from './adhesive'
import InstantPhoto from './instantPhoto'
import NoteIt from './note-it'
import URI from './uri'

/**
 * The SketchBoard is the planning board used to put colored
 * sticking papers on.
 **/
class SketchBoard {
  /**
   * Create an empty SketchBoard
   **/
  constructor(svgSelector, geometry = [], uuid, gallery = null) {
    // the root element is an svg node with this name..
    this.svg = d3.select(svgSelector)

    // apply the definition for the beautiful shadow filters found
    // here: http://bl.ocks.org/cpbotha/5200394
    // filter chain comes from:
    // // https://github.com/wbzyl/d3-notes/blob/master/hello-drop-shadow.html
    // // cpbotha added explanatory comments
    // // read more about SVG filter effects here: http://www.w3.org/TR/SVG/filters.html

    // filters go in defs element
    var defs = this.svg.append('defs')

    // create filter with id #drop-shadow
    // height=130% so that the shadow is not clipped
    var filter = defs
      .append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '130%')

    // SourceAlpha refers to opacity of graphic that this filter will be applied to
    // convolve that with a Gaussian with standard deviation 3 and store result
    // in blur
    filter
      .append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3)
      .attr('result', 'blur')
    // translate output of Gaussian blur to the right and downwards with 2px
    // store result in offsetBlur
    filter
      .append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 3)
      .attr('dy', 3)
      .attr('result', 'offsetBlur')

    // overlay original SourceGraphic over translated blurred opacity by using
    // feMerge filter. Order of specifying inputs is important!
    var feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'offsetBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // the geometry of the whole thing
    if (geometry[1]) {
      this.svg.attr(
        'style',
        'width: ' + geometry[0] + '; height: ' + geometry[1] + ';'
      )
    }

    this.svg.style('background', '#aaa')

    // use UUID or some simplified ID
    if (uuid) {
      this.uuid = true
    } else {
      this.uuid = false
    }

    // svg group to contain all the adhesives on this board
    this.group = this.svg.append('g').attr('class', 'sketchboard')
    //TODO add a slider and some shortcuts too for keyboard fetishists like myself (I have no wheel on my trackpoint)..
    var g = this.group
    this.svg.call(
      d3.zoom().on('zoom', function() {
        g.attr('transform', d3.event.transform)
      })
    )

    // a map of all adhesives
    this.adhesives = new Map()

    // only used for batch importing adhesives (see createAdhesives)
    this.adhesiveQueue = new Map()

    // to hold a provided (controlled) array of image locations
    this.gallery = gallery

    // adhesives behave like paper and are placed with low precision
    this.randomRotate = true

    return this
  }

  /**
   * Create a new id for an element. Depending on the setting
   * use shorter or longer ids.
   **/
  getId(uuid) {
    if (typeof uuid === 'undefined') {
      uuid = this.uuid
    }
    if (uuid) {
      return this.getUuid()
    } else {
      return this.getUid()
    }
  }

  /**
   * Short ID version, see getId(uuid)
   **/
  getUid() {
    let a, b
    for (b = a = ''; a++ < 12; b += (8 ^ (Math.random() * 10)).toString(16));
    return b
  }

  /**
   * Use UUID. See https://gist.github.com/LeverOne/1308368 and getId(uuid)
   **/
  getUuid() {
    let a, b
    for (
      b = a = '';
      a++ < 36;
      b +=
        (a * 51) & 52
          ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16)
          : '-'
    );
    return b
  }

  /**
   * store the sketch board contents as a JSON string
   **/
  toJSON(indent = '  ', startIndent = '') {
    var json = startIndent + '{\n'
    for (let n of this.adhesives.values()) {
      let nj = n.toJSON(indent, startIndent + indent)
      if (typeof nj === 'string' && nj !== '') {
        json += n.toJSON(indent, startIndent + indent) + ',\n'
      }
    }
    if (json.length > 2) {
      json = json.substring(0, json.length - 2) + '\n' + startIndent + '}'
    } else {
      // clear the area also if the maps are empty
      json = ''
    }
    return json
  }

  /**
   * Parse the JSON string and create the content
   **/
  fromJSON(json) {
    let j = JSON.parse(json)

    this.adhesiveQueue = new Map()
    for (let k of Object.keys(j)) {
      this.adhesiveQueue.set(k, j[k])
    }
    this.createAdhesives()
  }

  /**
   * Create Adhesives and put them onto the board
   **/
  createAdhesives() {
    for (let k of this.adhesiveQueue.keys()) {
      this.createAdhesive(k)
    }
    this.adhesives.forEach(adhesive => {
      if (adhesive.parentObject === null) {
        // toggle twice:
        /// once to activate the handle
        adhesive.toggleHandleVisible()
        /// once to expand all
        adhesive.toggleHandleVisible()
      } else {
        adhesive.drawEdge(adhesive.parentObject)
      }
    })
  }

  /**
   * Create a certain Adhesive from the list or just get
   * the existing one..
   **/
  createAdhesive(adhesiveKey) {
    var o = this.adhesives.get(adhesiveKey)
    var q = this.adhesiveQueue.get(adhesiveKey)
    if (typeof o === 'object') {
      return o
    } else if (typeof q === 'object') {
      switch (q['class']) {
        case 'adhesive':
          return Adhesive.create(this, adhesiveKey)
        case 'instantphoto':
          return InstantPhoto.create(this, adhesiveKey)
        case 'noteit':
          return NoteIt.create(this, adhesiveKey)
        case 'uri':
          return URI.create(this, adhesiveKey)
        default:
          alert(
            "Could not create the '" +
              adhesiveKey +
              "' of type '" +
              q['class'] +
              "'"
          )
      }
    } else {
      alert("There is no '" + adhesiveKey + "' in the adhesiveQueue")
    }
  }

  /**
   * Create a totally new URI Adhesive
   * parameters are identic to the one of the URI class
   **/
  createNewURI(board, group, parentObject, id, color, geometry, position) {
    return new URI(board, group, parentObject, id, color, geometry, position)
  }

  /**
   * Create a totally new InstantPhoto Adhesive
   * parameters are identic to the one of the InstantPhoto class
   **/
  createNewInstantPhoto(
    board,
    group,
    parentObject,
    id,
    color,
    geometry,
    position
  ) {
    return new InstantPhoto(
      board,
      group,
      parentObject,
      id,
      color,
      geometry,
      position
    )
  }
}

export default SketchBoard
