// @flow
import type {GraphAttributes} from './types'
import Graph from './graph'

export function graph (attrs: GraphAttributes): Graph {
  return new Graph({...attrs, type: 'graph'})
}

export function digraph (attrs: GraphAttributes): Graph {
  return new Graph({...attrs, type: 'digraph'})
}
