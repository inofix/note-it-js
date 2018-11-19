import Adhesive from './adhesive'

/**
 * An adhesive to write notes on.
 **/
class NoteIt extends Adhesive {
  /** Class identifier to distinguish the adhesives. **/
  get CSS_CLASS() {
    return 'noteit'
  }

  /**
   * Create a NoteIt Adhesive
   **/
  constructor(
    board,
    group,
    parentObject,
    id = '',
    color = ['#f7ff72'],
    geometry = [10, 10],
    position = [2, 2]
  ) {
    super(board, group, parentObject, id, color, geometry, position)
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
    type,
    title,
    content
  ) {
    if (draggable) {
      this.enableDrag()
    }
    this.persistable = persistable
    this.persistableChildren = persistable
    if (this.parentObject !== null) {
      this.drawEdge(this.parentObject)
    }
    if (typeof type === 'string') {
      this.addType(type)
    }
    if (typeof title === 'string') {
      this.addTitle(title)
    }
    if (typeof content === 'string') {
      this.addContent(content)
    }
    this.addHandles(handles)
  }

  // TODO: I can not access the class ..
  addHandleNew(slot) {
    let h = this.addHandle(slot, 'New', '&')

    var p = this
    var g = this.childrenGroup
    var nX =
      this.group.node().getBoundingClientRect().left -
      this.parentGroup.node().getBoundingClientRect().left +
      this.geometry[0] * 2
    var nY =
      this.group.node().getBoundingClientRect().top -
      this.parentGroup.node().getBoundingClientRect().top +
      this.geometry[1] * 2
    h.on('click', function() {
      var n = new NoteIt(p.board, g, p, '', p.color.slice(), p.geometry, [
        nX,
        nY
      ])
      n.setFeatures(
        p.handles,
        p.draggable,
        p.persistableChildren,
        p.edgeVisible,
        p.type.node().textContent,
        'Title',
        '...'
      )
      p.childObjects.set(n.id, n)

      p.board.adhesives.set(n.id, n)
      g.raise()
      p.showHandleVisible()
    })
  }

  addHandleEdit() {
    let tl = this.geometry[0]
    let hl = tl - 1.2
    let til = this.geometry[0] - 1
    let cl = til
    let ch = this.geometry[1] - 3
    let h = this.addHandle(hl, 'Edit', '!')
    var n = this
    h.on('click', function() {
      if (typeof n.type !== 'undefined') {
        n.toggleTextEdit(n.type, [2, 0], [tl, 1])
      }
      if (typeof n.title !== 'undefined') {
        n.toggleTextEdit(n.title, [0.5, 1], [til, 1])
      }
      if (typeof n.content !== 'undefined') {
        n.toggleTextEdit(n.content, [0.5, 2], [cl, ch])
      }
    })
  }

  addTitle(title = 'Title') {
    let l = this.geometry[0] - 1

    this.title = this.group.append('g').attr('class', 'title')
    var nt = this.title
      .append('text')
      .attr('width', l + 'em')
      .attr('height', '1em')
      .attr('x', '0.5em')
      .attr('y', '2em')
      .style('font-weight', 'bold')
      .text(title)
  }

  addContent(content = '...') {
    var l = this.geometry[0] - 1
    var h = this.geometry[1] - 3

    this.content = this.group.append('g').attr('class', 'content')
    var nt = this.content
      .append('text')
      .attr('width', l + 'em')
      .attr('height', h + 'em')
      .attr('x', '0.5em')
      .attr('y', '3em')
    this.setMultilineText(this.content, [0.5, 2], content)
  }

  toJSON(indent = '', startIndent = '') {
    if (!this.persistable) {
      return ''
    }

    let dindent = startIndent + indent
    let json = super.toJSON(indent, startIndent)
    //        json = json.substring(0, json.length - 2);
    if (
      typeof this.title !== 'undefined' &&
      typeof this.title.node().textContent === 'string'
    ) {
      json +=
        ',\n' + dindent + '"title": "' + this.title.node().textContent + '"'
    }
    if (
      typeof this.content !== 'undefined' &&
      typeof this.content.select('text') !== 'undefined'
    ) {
      let t = ''
      let a = this.content.select('text').node().childNodes
      for (let i = 0; i < a.length; i++) {
        if (a[i].textContent) {
          t += a[i].textContent + '<br/>'
        }
      }
      json += ',\n' + dindent + '"content": "' + t + '"'
    }
    if (this.CSS_CLASS == 'noteit') {
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

      let a = new NoteIt(
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
        o['type'],
        o['title'],
        o['content']
      )
      if (typeof o['parentId'] !== 'undefined') {
        p.childObjects.set(key, a)
        p.childrenGroup.raise()
      }
      board.adhesives.set(key, a)
      a.translate(o['transform'])
      return a
    } else {
      alert("There is no '" + adhesiveKey + "' in the adhesiveQueue")
    }
  }
}

export default NoteIt
