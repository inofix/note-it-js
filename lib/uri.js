import Adhesive from './adhesive'

/**
 * A oneliner adhesive to organize URIs.
 **/
class URI extends Adhesive {
  /** Class identifier to distinguish the adhesives. **/
  get CSS_CLASS() {
    return 'uri'
  }

  /**
   * Create an URI Adhesive.
   **/
  constructor(
    board,
    group,
    parentObject,
    id = '',
    color = ['#ccccff'],
    geometry = [20, 1.2],
    position = [2, 2]
  ) {
    super(board, group, parentObject, id, color, geometry, position)
    this.uri = null
  }

  /**
   * Set the basic features separatly from the constructor for more
   * control over super classes.
   **/
  setFeatures(
    handles = ['close', 'new'],
    draggable = true,
    persistable = true,
    edgeVisible = true,
    uri
  ) {
    if (draggable) {
      this.enableDrag()
    }
    this.persistable = persistable
    this.persistableChildren = persistable
    if (typeof uri === 'string') {
      this.addUri(uri)
    }
    this.addHandles(handles)
    this.edgeVisible = edgeVisible
    if (this.parentObject !== null) {
      this.drawEdge(this.parentObject)
    }
  }

  addUri(uri = '') {
    this.uri = this.group.append('g').attr('class', 'theuri')
    this.setUri(this.uri, uri)
  }

  setUri(textelement, uri = null) {
    var uA = null
    var name = ''
    if (uri != null) {
      uA = uri.split(';')
      if (uA.length > 1) {
        name = uA[0]
        uri = uA[1]
      } else {
        uri = uA[0]
      }
    }
    var minL = '12'
    if (name.length == 0) {
      name = uri
    }
    if (name.length + 1 > minL) {
      minL = name.length + 1
    }
    var uriA = uri.split(':')
    let tn = this.uri.select('text')
    tn.remove()
    if (uriA.length > 1) {
      if (uriA[1].startsWith('//') || uriA[0] == 'mailto' || uriA[0] == 'tel') {
        let a = this.uri
          .append('svg:a')
          .attr('class', 'anchor')
          .attr('href', uri)
        a.append('text')
          .attr('x', '2em')
          .attr('y', '1em')
          .attr('width', minL)
          .attr('height', '0.8em')
          .style('font-size', '0.8em')
          .attr('fill', 'blue')
          .text(name)
      } else {
        minL += uri.length + 1
        this.uri
          .append('text')
          .attr('x', '2em')
          .attr('y', '1em')
          .attr('width', minL)
          .attr('height', '0.8em')
          .style('font-size', '0.8em')
          .attr('fill', 'red')
          .text(name)
      }
    } else {
      this.uri
        .append('text')
        .attr('x', '2em')
        .attr('y', '1em')
        .attr('width', minL)
        .attr('height', '0.8em')
        .style('font-size', '0.8em')
        .attr('fill', 'red')
        .text(name)
    }
  }

  openTextInput(textelement, position, geometry) {
    var textnode = textelement.select('text')
    var t = textnode.text()
    if (textelement.selectAll('.anchor').size() > 0) {
      let tt = textelement.select('.anchor').attr('href')
      if (tt !== t) {
        t += ';' + tt
      }
    }
    //TODO: use style of original text element (via CSS)..
    var foreign = textelement
      .append('foreignObject')
      .attr('x', position[0] + 'em')
      .attr('y', position[1] + 'em')
      .attr('width', geometry[0] + 'em')
      .attr('height', geometry[1] + 'em')
    var d = foreign
      .append('xhtml:textarea')
      .attr('cols', geometry[0])
      .attr('rows', geometry[1])
      .attr(
        'style',
        'background: ' + this.color[0] + "; font: 1em 'Open Sans', sans-serif"
      )
      .text(t)

    textnode.text('')
    d.on('blur', function() {
      d.text(d.node().value)
    })
  }

  toggleUriEdit(textelement, position, geometry) {
    var foreign = textelement.selectAll('foreignObject')
    if (foreign.size() > 0) {
      this.setUri(textelement, foreign.node().textContent)
      foreign.remove()
    } else {
      this.openTextInput(textelement, position, geometry)
    }
  }

  addHandleEdit() {
    let tl = this.geometry[0]
    let hl = tl - 1.2
    let h = this.addHandle(hl, 'Edit', '!')
    var n = this
    h.on('click', function() {
      n.toggleUriEdit(n.uri, [2, 0], [tl, 1])
    })
  }

  toJSON(indent = '', startIndent = '') {
    if (!this.persistable) {
      return ''
    }

    let dindent = startIndent + indent
    let json = super.toJSON(indent, startIndent)
    let uri = this.uri.select('text').text()
    if (this.uri.selectAll('.anchor').size() > 0) {
      let t = this.uri.select('.anchor').attr('href')
      if (t !== uri) {
        uri += '; ' + t
      }
    }
    json += ',\n' + dindent + '"uri": "' + uri + '"'
    if (this.CSS_CLASS == 'uri') {
      json += '\n' + startIndent + '}'
    }
    return json
  }

  static create(board, key) {
    let o = board.adhesiveQueue.get(key)
    if (typeof o === 'object') {
      board.adhesiveQueue.delete(key)
      let group = board.group
      var p = null
      if (typeof o['parentId'] !== 'undefined') {
        p = board.createAdhesive(o['parentId'])
        group = p.childrenGroup
      }

      let a = new URI(
        board,
        group,
        p,
        key,
        o['color'],
        o['geometry'],
        o['position']
      )
      a.setFeatures(
        o['handles'],
        o['draggable'],
        o['persistable'],
        o['edgeVisible'],
        o['uri']
      )
      if (typeof o['parentId'] !== 'undefined') {
        p.childObjects.set(key, a)
        p.childrenGroup.raise()
      }
      board.adhesives.set(key, a)
      a.translate(o['transform'])
      return a
    } else {
      alert("There is no '" + key + "' in the adhesiveQueue")
    }
  }
}

export default URI
