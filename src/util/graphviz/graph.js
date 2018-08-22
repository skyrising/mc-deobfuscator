// @flow
import cp from 'child_process'
import {indent, attrsToStr, attrToString} from './util'
import Node from './node'
import Edge from './edge'
import type {
  GraphType, GraphAttributes, GlobalGraphAttributes,
  NodeAttributes, GlobalNodeAttributes,
  EdgeAttributes, GlobalEdgeAttributes,
  RenderOptions
} from './types'

export default class Graph {
  name: string;
  type: GraphType;
  parent: ?Graph;
  attributes: GraphAttributes;
  nodes: Array<Node>;
  nodeAttributes: ?GlobalNodeAttributes;
  connectedNodes: Set<string>;
  edges: Array<Edge>;
  edgeAttributes: ?GlobalEdgeAttributes;
  subgraphs: Array<Graph>;
  subgraphAttributes: ?GlobalGraphAttributes;

  constructor (attrs: GraphAttributes = {}, parent?: Graph) {
    this.type = 'graph'
    this.parent = parent
    this.nodes = []
    this.edges = []
    this.subgraphs = []
    this.name = attrs.name || (parent ? parent.getSubgraphId() : 'g')
    delete attrs.name
    this.attributes = attrs
    if (!parent) this.connectedNodes = new Set()
  }

  node (attrs: NodeAttributes = {}): Node {
    const name = attrs.name || this.getNodeId()
    delete attrs.name
    const node = new Node(name, attrs, this)
    this.nodes.push(node)
    return node
  }

  getNodeId (): string {
    return this.parent ? this.parent.getNodeId() : 'n' + this.nodes.length
  }

  edge (from: Node|string, to: Node|string, attrs?: EdgeAttributes): Edge {
    const edge = new Edge(from, to, attrs, this)
    let g = this
    while (g.parent) g = g.parent
    g.connectedNodes.add(from.name || from, to.name || to)
    this.edges.push(edge)
    return edge
  }

  subgraph (attrs?: GraphAttributes): Graph {
    const graph = new Graph({...attrs, type: this.type}, this)
    this.subgraphs.push(graph)
    return graph
  }

  getSubgraphId (): string {
    return this.parent ? this.parent.getSubgraphId() : 'g' + this.subgraphs.length
  }

  killOrphans () {
    this.nodes = this.nodes.filter(node => this.isNodeOrphaned(node))
    for (const subgraph of this.subgraphs) subgraph.killOrphans()
  }

  isNodeOrphaned (node: Node|string) {
    if (this.parent) return this.parent.isNodeOrphaned(node)
    return this.connectedNodes.has(node.name || node)
  }

  toString () {
    let dot = `${this.parent ? 'subgraph' : this.type} ${this.name} {\n`
    for (const key in this.attributes) {
      if (key === 'type') continue
      dot += indent(`${attrToString(key, this.attributes[key])};`) + '\n'
    }
    if (this.nodeAttributes) dot += indent(`node[${attrsToStr(this.nodeAttributes)}];`)
    if (this.edgeAttributes) dot += indent(`edge[${attrsToStr(this.edgeAttributes)}];`)
    if (this.subgraphAttributes) dot += indent(`graph[${attrsToStr(this.subgraphAttributes)}];`)
    for (const graph of this.subgraphs) dot += indent(graph.toString())
    for (const node of this.nodes) dot += indent(node.toString())
    for (const edge of this.edges) dot += indent(edge.toString())
    return dot + '}\n'
  }

  async render (options?: RenderOptions = {}): Promise<Buffer> {
    const {layout, type} = {layout: (this.attributes || {}).layout || 'dot', type: 'svg', ...options}
    return new Promise((resolve, reject) => {
      const args = ['-T', type]
      const p = cp.spawn(layout, args)
      const out: Array<Buffer> = []
      p.stdout.on('data', data => out.push(data))
      p.on('exit', code => {
        if (code) return reject(code)
        resolve(Buffer.concat(out))
      })
      p.stdin.write(this.toString())
      p.stdin.end()
    })
  }
}
