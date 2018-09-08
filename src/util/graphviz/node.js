// @flow
import { attrsToStr } from './util'
import type Graph from './graph'
import type { NodeAttributes } from './types'

export default class Node {
  name: string;
  attributes: NodeAttributes;
  parent: ?Graph;

  constructor (name: string, attrs: NodeAttributes = {}, parent?: Graph) {
    this.name = name
    this.attributes = attrs
    this.parent = parent
  }

  toString () {
    const attrs = Object.values(this.attributes).length ? '[' + attrsToStr(this.attributes) + ']' : ''
    return this.name + attrs + ';'
  }
}
