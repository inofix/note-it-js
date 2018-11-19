import test from 'ava'
import SketchBoard from '../lib/sketchboard'

test.before(t => {
  const s = document.createElement('div')
  s.setAttribute('id', 'sketchboard')
  document.body.appendChild(s)
})

test('it creates a sketchboard with an id from a DOM selector', t => {
  const board = new SketchBoard('#sketchboard')
  const uid = board.getUid()
  t.truthy(uid)
})
