import * as d3 from 'd3'
import { Gallery, SketchBoard, Stack } from './lib'

// self invoking function to keep the window js scope clean
;(function() {
  // the gallery controls the available images
  var gallery = new Gallery(
    ['example-images/lfs-logo.png', 'example-images/meditate-tiny.jpg'],
    false
  )

  gallery.displayImageList('#sketchboardimages')

  // the board is the main container to organize the adhesives on
  var board = new SketchBoard('#sketchboard', undefined, undefined, gallery)

  // a stack is an entry point containing an adhesive to creating the
  // rest of the elements from..
  var rstack = new Stack(
    board,
    board.group,
    'Note',
    ['#f7ff72', '#ff72e3', '#6ee0ff', '#ffa800', '#a9a9ff', '#b3ff7b'],
    [14, 14]
  )

  // the back(-end) is where the JSON representation goes - it can be
  // used to later restore the board
  var back = d3.select('#sketchboardjson')
  let a = back
    .append('textarea')
    .attr('rows', 10)
    .attr('cols', 80)
  a.on('keyup', function() {
    let t = d3.select('#sketchboardjson').select('textarea')
    t.attr('value', t.node().textContent)
  })
  back
    .append('input')
    .attr('type', 'button')
    .attr('value', 'To JSON')
    .on('click', function() {
      let t = d3.select('#sketchboardjson').select('textarea')
      t.text(board.toJSON('  '))
      t.property('value', t.node().textContent)
    })
  back
    .append('input')
    .attr('type', 'button')
    .attr('value', 'From JSON')
    .on('click', function() {
      board.fromJSON(
        d3
          .select('#sketchboardjson')
          .select('textarea')
          .node().value
      )
    })

  // the general interface and navigation
  var navIsActiveClass = 'Site--navActive'
  var $nav = document.querySelector('.Site-navigation')
  var $body = document.querySelector('body')
  $nav.addEventListener('click', function() {
    $body.classList.contains(navIsActiveClass)
      ? $body.classList.remove(navIsActiveClass)
      : $body.classList.add(navIsActiveClass)
  })
})()
