import * as d3 from 'd3'

/**
 * The main element on the board. It can be used as a simple adhesive
 * or as a base class for more complex forms of adhesives.
 **/
class Adhesive {
  /** Class identifier to distinguish the adhesives. **/
  // TODO: If I declare this static, I can not access it via the class ..
  get CSS_CLASS() {
    return 'adhesive'
  }

  /**
   * Create an Adhesive
   **/
  constructor(
    board,
    group,
    parentObject,
    id = '',
    color = ['#f7ff72'],
    geometry = [10, 10],
    position = [0, 0]
  ) {
    // unset all handles - they will be set later on demand..
    this.handleClose = false
    this.handleNew = false
    this.handleColor = false
    this.handleEdit = false
    this.handleVisible = false
    this.handleLabel = false
    this.handleURI = false
    this.handlePhoto = false

    this.board = board
    if (typeof id === 'undefined' || id == '') {
      this.id = board.getId()
    } else {
      this.id = id
    }
    this.parentGroup = group
    this.parentObject = parentObject
    this.group = group
      .append('g')
      .attr('class', this.CSS_CLASS)
      .attr('id', this.id)
    this.childrenGroup = this.group.append('g').attr('class', 'children')
    this.childObjects = new Map()
    this.color = color
    // note: the height/width via css above works in chrome
    // but for ff it must be set here...
    this.paper = this.group
      .append('rect')
      .attr('class', 'adhesive')
      .attr('width', geometry[0] + 'em')
      .attr('height', geometry[1] + 'em')
    this.geometry = geometry
    this.geometryPx = [
      this.paper.node().getBoundingClientRect().right -
        this.paper.node().getBoundingClientRect().left,
      this.paper.node().getBoundingClientRect().bottom -
        this.paper.node().getBoundingClientRect().top
    ]
    this.group.attr(
      'transform',
      'translate(' + position[0] + ',' + position[1] + ')'
    )
    this.position = position
    this.translatePosition = position
    this.positionOnBoard = [
      this.paper.node().getBoundingClientRect().left -
        this.board.svg.node().getBoundingClientRect().left,
      this.paper.node().getBoundingClientRect().top -
        this.board.svg.node().getBoundingClientRect().top
    ]
    this.paper.style('filter', 'url(#drop-shadow)')
    this.paper.style('fill', color[0]).style('stroke-width', '0px')
    // now draw a line between child and parent..
    this.parentEdge = null
    this.edgeVisible = true
    // whether it can be persisted with toJSON
    this.persistable = true
    this.persistableChildren = true
    this.randomRotate = this.board.randomRotate
    return this
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
    type
  ) {
    if (draggable) {
      this.enableDrag()
    }
    this.persistable = persistable
    this.persistableChildren = persistable
    if (typeof type === 'string') {
      this.addType(type)
    }
    this.addHandles(handles)
    this.edgeVisible = edgeVisible
    if (this.parentObject !== null) {
      this.drawEdge(this.parentObject)
    }
  }

  /**
   * Displace an object on the board. See d3js.
   **/
  translate(delta = [0, 0]) {
    this.translatePosition = delta
    if (this.draggable) {
      this.enableDrag()
    }
    this.move(delta)
    //        this.group.raise().attr("transform", "translate(" + delta[0] +
    //                    "," + delta[1] + ")");
  }

  /**
   * Displace an object on the board. See translate(delta)
   **/
  move(delta = [0, 0]) {
    var r = 0
    if (this.randomRotate) {
      r = 2 * Math.random() - 1
    }
    this.group
      .raise()
      .attr(
        'transform',
        'translate(' + delta[0] + ',' + delta[1] + '), rotate(' + r + ')'
      )
  }

  /**
   * Connect two objects by a line.
   **/
  drawEdge(adhesive) {
    if (this.edgeVisible) {
      let p1 = [0.5 * this.geometryPx[0], 0]
      let p2 = [
        0.5 * adhesive.geometryPx[0] - this.translatePosition[0],
        adhesive.geometryPx[1] - this.translatePosition[1]
      ]
      if (this.parentEdge !== null) {
        this.parentEdge.remove()
      }
      this.parentEdge = this.group
        .append('line')
        .attr('x1', p1[0])
        .attr('x2', p2[0])
        .attr('y1', p1[1])
        .attr('y2', p2[1])
        .attr('fill', 'none')
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
      this.parentEdge.lower()
      this.parentEdge.style('filter', 'url(#drop-shadow)')
    }
  }

  /**
   * Add a text field for type.
   **/
  addType(type = 'Type') {
    let l = this.geometry[0] / 2
    this.type = this.group.append('g').attr('class', 'type')
    this.type
      .append('text')
      .attr('x', '2em')
      .attr('y', '1em')
      .attr('width', l + 'em')
      .attr('height', '0.8em')
      .style('font-size', '0.8em')
      .attr('fill', 'grey')
      .text(type)
  }

  /**
   * Alterate between text edit and display.
   **/
  toggleTextEdit(textelement, position, geometry) {
    var foreign = textelement.select('foreignObject')
    if (foreign.size() > 0) {
      this.setMultilineText(textelement, position, foreign.node().textContent)
    } else {
      this.openTextInput(textelement, position, geometry)
    }
  }

  /**
   * Edit a textfield.
   **/
  openTextInput(textelement, position, geometry) {
    var textnode = textelement.select('text')
    var t = ''
    let a = textnode.node().childNodes
    for (let i = 0; i < a.length; i++) {
      if (a[i].textContent) {
        t += a[i].textContent + '\n'
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

  /**
   * Display text on multiple lines.
   **/
  setMultilineText(textelement, position, text) {
    var textnode = textelement.select('text')
    var foreign = textelement.selectAll('foreignObject')
    textnode.text('')
    if (foreign.size() > 0) {
      text = text
        .replace(/<br\/>/g, '\n')
        .replace(/\r\n/g, '\n')
        .split('\n')
      foreign.remove()
    } else {
      text = text.split('<br/>')
    }
    for (let i = 0; i < text.length; i++) {
      // calc the distance to the next tspan
      let tY = i + position[1] + 1
      let tI = textnode
        .append('tspan')
        .attr('x', position[0] + 'em')
        .attr('y', tY + 'em')
      tI.text(text[i])
    }
  }

  /**
   * Enable the handles on the adhesive.
   **/
  addHandles(handles) {
    this.handles = handles
    var slot = 0
    for (var i = 0; i < handles.length; i++) {
      switch (handles[i]) {
        case 'close':
          this.handleClose = true
          slot += 0.8
          this.addHandleClose(slot)
          break
        case 'new':
          this.handleNew = true
          slot += 0.8
          this.addHandleNew(slot)
          break
        case 'color':
          this.handleColor = true
          this.addHandleColor()
          break
        case 'edit':
          this.handleEdit = true
          this.addHandleEdit()
          break
        case 'visible':
          this.handleVisible = true
          slot += 0.8
          this.addHandleVisible(slot)
          break
        case 'label':
          this.handleLabel = true
          slot += 0.8
          this.addHandleLabel(slot)
          break
        case 'photo':
          this.handlePhoto = true
          slot += 0.8
          this.addHandlePhoto(slot)
          break
        case 'uri':
          this.handleURI = true
          slot += 0.8
          this.addHandleURI(slot)
          break
        case '':
          slot += 0.8
          break
      }
    }
  }

  /**
   * Enable a certain handle on the adhesive.
   **/
  addHandle(slot, name, text) {
    let l = this.geometry[0] - slot
    let h = this.group
      .append('g')
      .attr('class', 'handle')
      .attr('id', 'handle' + name)
      .attr('tabindex', 0)

    h.append('title').text(name)

    return h
      .append('text')
      .text(text)
      .attr('x', l + 'em')
      .attr('y', '0.9em')
  }

  // just a helper:
  // TODO: I can not access the class ..
  /**
   * Add a handle that creates a clone of the current adhesive
   * as a child element to the current adhesive.
   **/
  addHandleNew(slot) {
    let h = this.addHandle(slot, 'New', '&')

    var p = this
    var g = this.childrenGroup
    var nX =
      this.group.node().getBoundingClientRect().left -
      this.parentGroup.node().getBoundingClientRect().left +
      this.position[0]
    var nY =
      this.group.node().getBoundingClientRect().top -
      this.parentGroup.node().getBoundingClientRect().top +
      this.position[1]
    h.on('click', function() {
      let n = new Adhesive(p.board, g, p, '', p.color.slice(), p.geometry, [
        nX,
        nY
      ])
      n.setFeatures(
        p.handles,
        p.draggable,
        p.persistableChildren,
        p.edgeVisible,
        p.type.node().textContent
      )
      p.childObjects.set(n.id, n)

      p.showHandleVisible()
      p.board.adhesives.set(n.id, n)
      g.raise()
    })
  }

  /**
   * Add a handle that creates an URI displaying adhesive.
   **/
  addHandleURI(slot) {
    let h = this.addHandle(slot, 'URI', 'U')

    var p = this
    var g = this.childrenGroup
    var nX =
      this.group.node().getBoundingClientRect().left -
      this.parentGroup.node().getBoundingClientRect().left +
      this.position[0]
    var nY =
      this.group.node().getBoundingClientRect().top -
      this.parentGroup.node().getBoundingClientRect().top +
      this.position[1]

    h.on('click', function() {
      let n = p.board.createNewURI(p.board, g, p, '', ['#ddddff'], undefined, [
        nX,
        nY
      ])
      n.setFeatures(
        ['close', 'label', 'edit'],
        p.draggable,
        true,
        false,
        'URI Name;scheme:path'
      )
      p.childObjects.set(n.id, n)
      p.board.adhesives.set(n.id, n)
      g.raise()
    })
  }

  /**
   * Add a handle that creates an image holding adhesive.
   **/
  addHandlePhoto(slot) {
    let h = this.addHandle(slot, 'Photo', 'P')

    var p = this
    var g = this.childrenGroup
    // var nX =
    //   this.group.node().getBoundingClientRect().left -
    //   this.parentGroup.node().getBoundingClientRect().left +
    //   this.position[0]
    // var nY =
    //   this.group.node().getBoundingClientRect().top -
    //   this.parentGroup.node().getBoundingClientRect().top +
    //   this.position[1]
    h.on('click', function() {
      let n = p.board.createNewInstantPhoto(p.board, g, p, '')
      n.setFeatures(
        ['close', 'label', 'edit'],
        p.draggable,
        true,
        false,
        'Photo'
      )
      p.childObjects.set(n.id, n)

      p.board.adhesives.set(n.id, n)
      g.raise()
    })
  }

  /**
   * Add a handle that creates a small adhesive which can be used to
   * label the current adhesive.
   **/
  addHandleLabel(slot) {
    let h = this.addHandle(slot, 'Label', 'L')

    var p = this
    var g = this.childrenGroup
    var nX =
      this.group.node().getBoundingClientRect().left -
      this.parentGroup.node().getBoundingClientRect().left +
      this.position[0]
    var nY =
      this.group.node().getBoundingClientRect().top -
      this.parentGroup.node().getBoundingClientRect().top +
      this.position[1]
    h.on('click', function() {
      let n = new Adhesive(
        p.board,
        g,
        p,
        '',
        ['#ff6666', '#00ff00', '#7788ff'],
        [8, 1],
        [nX, nY]
      )
      //TODO: why is it not persistable? "false/true"
      n.setFeatures(
        ['close', 'color', 'edit'],
        p.draggable,
        true,
        false,
        'Label'
      )
      p.childObjects.set(n.id, n)

      p.board.adhesives.set(n.id, n)
      g.raise()
    })
  }

  /**
   * Add a handle that allows text editing.
   **/
  addHandleEdit() {
    let tl = this.geometry[0]
    let hl = tl - 1.2
    let h = this.addHandle(hl, 'Edit', '!')
    var n = this
    h.on('click', function() {
      n.toggleTextEdit(n.type, [2, 0], [tl, 1])
    })
  }

  /**
   * Add a handle that shows and hides the child elements.
   **/
  addHandleVisible(slot) {
    let h = this.addHandle(slot, 'Visible', '+')
    this.childrenGroup.style('visibility', 'visible')
    h.text('\u2013')
    this.showHandleVisible()
  }

  /**
   * Enable/disable the visibility handle.
   **/
  showHandleVisible() {
    let h = this.group.select('#handleVisible')
    let n = this
    if (this.childObjects.size > 0) {
      h.style('fill', 'black')
      h.on('click', function() {
        n.toggleHandleVisible()
      })
    } else {
      h.style('fill', 'lightgrey')
      h.on('click', null)
    }
  }

  /**
   * Alternate between show and hide of the child elements.
   **/
  toggleHandleVisible(text) {
    let h = this.group.select('#handleVisible').select('text')
    if (typeof text === 'undefined') {
      text = h.node().textContent
    }

    if (text == '\u2013') {
      this.childrenGroup.style('visibility', 'hidden')
      h.text('+')
    } else {
      this.childrenGroup.style('visibility', 'visible')
      h.text('\u2013')
    }
    this.showHandleVisible()

    this.childObjects.forEach(child => {
      if (child.handleVisible) {
        child.toggleHandleVisible(text)
      }
    })
  }

  //.style("visibility", function (d) {
  //    return d.children.size === 1 ? "hidden" : "visible";
  //  })

  /**
   * Add a handle to choose the adhesives background color.
   **/
  addHandleColor() {
    let l = 2
    l = l + 'px'
    //        let l = 2;

    var c = this.color
    var p = this.paper

    var h = this.group
      .append('g')
      .attr('class', 'handle')
      .attr('id', 'handleColor')
    var gd = h
      .append('defs')
      .append('linearGradient')
      .attr('id', 'gradient' + this.id)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')
    var c0 = gd
      .append('stop')
      .attr('offset', '0%')
      .style('stop-color', c[1])
    var c1 = gd
      .append('stop')
      .attr('offset', '100%')
      .style('stop-color', c[2])

    h.append('title').text('Color')

    h.append('rect')
      .attr('x', l)
      .attr('y', 2)
      .attr('rx', '0.2em')
      .attr('ry', '0.2em')
      .attr('width', '0.8em')
      .attr('height', '0.8em')
      .attr('fill', 'url(#gradient' + this.id + ')')

    h.on('click', function() {
      var cur = c.shift()
      c.push(cur)
      p.style('fill', c[0])
      c0.style('stop-color', c[1])
      c1.style('stop-color', c[2])
    })
  }

  /**
   * Add a handle that closes the current adhesive.
   **/
  addHandleClose(slot) {
    var n = this

    let h = this.addHandle(slot, 'Close', 'x')
    h.on('click', function() {
      n.snuffit()
    })
  }

  /**
   * Allow the element to be moveable on the board.
   **/
  enableDrag() {
    this.draggable = true
    var n = this

    var nX = this.translatePosition[0]
    var nY = this.translatePosition[1]

    this.group.attr('class', 'dragable')

    this.group.call(
      d3.drag().on('drag', function() {
        nX += d3.event.dx
        nY += d3.event.dy
        n.translatePosition = [nX, nY]
        if (n.parentObject !== null) {
          n.drawEdge(n.parentObject)
        }
        n.move([nX, nY])
        //            g.raise().attr("transform", "translate(" + nX + "," + nY + ")");
      })
    )
  }

  /**
   * Remove the current adhesive completely from the board, with all
   * its children.
   **/
  snuffit() {
    this.board.adhesives.delete(this.id)
    for (let c of this.childObjects.values()) {
      c.snuffit()
    }
    if (
      this.parentObject !== null &&
      typeof this.parentObject.childObjects !== 'undefined'
    ) {
      this.parentObject.childObjects.delete(this.id)
      this.parentObject.showHandleVisible()
    }
    this.group.remove()
  }

  /**
   * Translate the current adhesives content into JSON form.
   **/
  toJSON(indent = '', startIndent = '') {
    if (!this.persistable) {
      return ''
    }

    let json = startIndent + '"' + this.id + '": {\n'
    let dindent = startIndent + indent
    json += dindent + '"class": "' + this.CSS_CLASS + '",\n'
    if (this.parentObject !== null) {
      json += dindent + '"parentId": "' + this.parentObject.id + '",\n'
    }
    // either parent or children should do it..
    //        let a = Array.from(this.childObjects.keys());
    //        if (a.length > 0) {
    //            json += '"childrenIds": ' + a + ', ';
    //        }
    let c = ''
    for (let i = 0; i < this.color.length; i++) {
      c += '"' + this.color[i] + '",'
    }
    let h = ''
    for (let i = 0; i < this.handles.length; i++) {
      h += '"' + this.handles[i] + '",'
    }
    let t = this.group
      .attr('transform')
      .replace('translate(', '')
      .replace(')', '')
      .split(',')
    this.translatePosition = [parseInt(t[0]), parseInt(t[1])]
    json +=
      dindent +
      '"color": [' +
      c.substring(0, c.length - 1) +
      '],\n' +
      dindent +
      '"geometry": [' +
      this.geometry +
      '],\n' +
      dindent +
      '"position": [' +
      this.position +
      '],\n' +
      dindent +
      '"transform": [' +
      this.translatePosition +
      '],\n' +
      dindent +
      '"edgeVisible": ' +
      this.edgeVisible +
      ',\n' +
      //                dindent + '"draggable": ' + this.draggable + ',\n' +
      dindent +
      '"handles": [' +
      h.substring(0, h.length - 1) +
      ']'
    if (typeof this.type !== 'undefined') {
      json += ',\n' + dindent + '"type": "' + this.type.node().textContent + '"'
    }
    if (this.CSS_CLASS == 'adhesive') {
      json += '\n' + startIndent + '}'
    }
    return json
    // board, group handles, draggable
  }

  /**
   * Statically create a new adhesive.
   **/
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
      let a = new Adhesive(
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
        o['type']
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

export default Adhesive
