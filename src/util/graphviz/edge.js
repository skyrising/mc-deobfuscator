// @flow
import {attrsToStr} from './util'
import type Node from './node'
import type Graph from './graph'
import type {EdgeAttributes} from './types'

export default class Edge {
  from: Node|string;
  to: Node|string;
  attributes: EdgeAttributes;
  parent: Graph;

  constructor (from: Node|string, to: Node|string, attributes: EdgeAttributes = {}, parent: Graph) {
    this.from = from
    this.to = to
    this.attributes = attributes
    this.parent = parent
  }

  toString () {
    const from = typeof this.from === 'string' ? this.from : this.from.name
    const to = typeof this.to === 'string' ? this.to : this.to.name
    const attrs = Object.values(this.attributes).length ? '[' + attrsToStr(this.attributes) + ']' : ''
    return `${from} ${this.parent.type === 'digraph' ? '->' : '--'} ${to}${attrs};`
  }
}
