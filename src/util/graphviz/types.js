// @flow
export type ClusterMode = 'local' | 'global' | 'none';
export type Direction = 'forward' | 'back' | 'both' | 'none';
export type Point = string;
export type OutputMode = 'breadthfirst' | 'nodesfirst' | 'edgesfirst';
export type PackMode = 'node' | 'clust' | 'graph' | string;
export type PageDir = 'BL' | 'BR' | 'TL' | 'TR' | 'RB' | 'RT' | 'LB' | 'LT';
export type RankType = 'same' | 'min' | 'source' | 'max' | 'sink';
export type RankDir = 'TB' | 'LR' | 'BT' | 'RL';
export type Shape = string;
export type SmoothType = 'none' | 'avg_dist' | 'graph_dist' | 'power_dist' | 'rng' | 'spring' | 'triangle';
export type ArrowType = 'normal' | 'inv' | 'dot' | 'invdot' | 'odot' | 'invodot' | 'none'
  | 'tee' | 'empty' | 'invempty' | 'diamond' | 'odiamond' | 'ediamond'
  | 'crow' | 'box' | 'obox' | 'open' | 'halfopen' | 'vee'
export type Layout = 'circo' | 'dot' | 'fdp' | 'neato' | 'osage' | 'patchwork' | 'sfdp' | 'twopi';
export type OutputType = 'bmp' | 'canon' | 'cmap' | 'cmapx' | 'cmapx_np' | 'dot' | 'dot_json'
  | 'eps' | 'fig' | 'gd' | 'gd2' | 'gif' | 'gtk' | 'gv' | 'ico' | 'imap' | 'imap_np' | 'ismap'
  | 'jpe' | 'jpeg' | 'jpg' | 'json' | 'json0' | 'mp' | 'pdf' | 'pic' | 'plain' | 'plain-ext'
  | 'png' | 'pov' | 'ps' | 'ps2' | 'svg' | 'svgz' | 'tif' | 'tiff' | 'tk' | 'vml' | 'vmlz'
  | 'vrml' | 'wbmp' | 'x11' | 'xdot' | 'xdot1.2' | 'xdot1.4' | 'xdot_json' | 'xlib'

export type GraphType = 'graph' | 'digraph'

export type GlobalGraphAttributes = {|
  Damping?: number;
  K?: number;
  URL?: string;
  _background?: string;
  bb?: string;
  bgcolor?: string;
  center?: boolean;
  charset?: string;
  clusterrank?: ClusterMode;
  color?: string;
  colorscheme?: string;
  comment?: string;
  compound?: boolean;
  concentrate?: boolean;
  defaultdist?: number;
  dimen?: number;
  diredgeconstraints?: string | boolean;
  dpi?: number;
  epsilon?: number;
  esep?: number | Point;
  fillcolor?: string;
  fontcolor?: string;
  fontname?: string;
  fontnames?: string;
  fontpath?: string;
  fontsize?: number;
  forcelabels?: boolean;
  gradientangle?: number;
  href?: string;
  id?: string;
  imagepath?: string;
  inputscale?: number;
  label?: string;
  label_scheme?: number;
  labeljust?: 'l' | 'c' | 'r';
  labelloc?: 't' | 'b';
  landscape?: boolean;
  layer?: string;
  layerlistsep?: string;
  layers?: string;
  layerselect?: string;
  layersep?: string;
  layout?: Layout;
  levels?: number;
  levelsgap?: number;
  lheight?: number;
  lp?: Point;
  lwidth?: number;
  margin?: number | Point;
  maxiter?: number;
  mclimit?: number;
  mindist?: number;
  mode?: string;
  model?: string;
  mosek?: boolean;
  newrank?: boolean;
  nodesep?: number;
  nojustify?: boolean;
  normalize?: number | boolean;
  notranslate?: boolean;
  nslimit?: number;
  ordering?: string;
  orientation?: string;
  outputorder?: OutputMode;
  overlap?: string | boolean;
  overlap_scaling?: number;
  overlap_shrink?: boolean;
  pack?: boolean | number;
  packmode?: PackMode;
  pad?: number | Point;
  page?: number | Point;
  pagedir?: PageDir;
  pencolor?: string;
  penwidth?: number;
  peripheries?: number;
  quadtree?: 'normal' | 'fast' | 'none' | boolean;
  quantum?: number;
  rank?: RankType;
  rankdir?: RankDir;
  ranksep?: number | string;
  ratio?: number | string;
  remincross?: boolean;
  repulsiveforce?: number;
  resolution?: number;
  root?: string;
  rotate?: number;
  rotation?: number;
  scale?: number | Point;
  searchsize?: number;
  sep?: number | Point;
  showboxes?: number;
  size?: number | Point;
  smoothing?: SmoothType;
  sortv?: number;
  splines?: boolean | string;
  start?: string;
  style?: string;
  stylesheet?: string;
  target?: string;
  tooltip?: string;
  truecolor?: boolean;
  viewPort?: string;
  voro_margin?: number;
  xdotversion?: string;
|}

export type GraphAttributes = {
  name?: string;
  type?: GraphType;
  ...GlobalGraphAttributes;
}

export type GlobalNodeAttributes = {|
  URL?: string;
  area?: number;
  color?: string;
  colorscheme?: string;
  comment?: string;
  distortion?: number;
  fillcolor?: string;
  fixedsize?: boolean | string;
  fontcolor?: string;
  fontname?: string;
  fontsize?: number;
  gradientangle?: number;
  group?: string;
  height?: number;
  href?: string;
  id?: string;
  image?: string;
  imagepos?: string;
  imagescale?: boolean | string;
  label?: string;
  labelloc?: 't' | 'c' | 'b';
  layer?: string;
  margin?: number | Point;
  nojustify?: boolean | number;
  ordering?: string;
  orientation?: number;
  penwidth?: number;
  peripheries?: number;
  pin?: boolean;
  pos?: Point | string;
  rects?: string;
  regular?: boolean;
  root?: boolean;
  samplepoints?: number;
  shape?: Shape;
  shapefile?: string;
  showboxes?: number;
  sides?: number;
  skew?: number;
  sortv?: number;
  style?: string;
  target?: string;
  tooltip?: string;
  vertices?: string;
  width?: number;
  xlabel?: string;
  xlp?: Point;
  z?: number;
|}

export type NodeAttributes = {
  name?: string;
  ...GlobalNodeAttributes;
}

export type GlobalEdgeAttributes = {|
  URL?: string;
  arrowhead?: ArrowType;
  arrowsize?: number;
  arrottail?: ArrowType;
  color?: string;
  colorscheme?: string;
  comment?: string;
  constraint?: boolean;
  decorate?: boolean;
  dir?: Direction;
  edgeURL?: string;
  edgehref?: string;
  edgetarget?: string;
  edgetooltip?: string;
  fillcolor?: string;
  fontcolor?: string;
  fontname?: string;
  fontcolor?: string;
  fontname?: string;
  fontsize?: number;
  headURL?: string;
  head_lp?: Point;
  headclip?: boolean;
  headhref?: string;
  headlabel?: string;
  headport?: string;
  headtarget?: string;
  headtooltip?: string;
  href?: string;
  id?: string;
  label?: string;
  labelURL?: string;
  labelangle?: number;
  labeldistance?: number;
  labelfloat?: boolean;
  labelfontcolor?: string;
  labelfontname?: string;
  labelfontsize?: number;
  labelhref?: string;
  labeltarget?: string;
  labeltooltip?: string;
  layer?: string;
  len?: number;
  lhead?: string;
  lp?: Point;
  ltail?: string;
  minlen?: number;
  nojustify?: boolean;
  penwidth?: number;
  pos?: Point | string;
  samehead?: string;
  sametail?: string;
  showboxes?: string;
  style?: string;
  tailURL?: string;
  tail_lp?: Point;
  tailclip?: boolean;
  tailhref?: string;
  taillabel?: string;
  tailport?: string;
  tailtarget?: string;
  tailtooltip?: string;
  target?: string;
  tooltip?: string;
  weight?: number;
  xlabel?: string;
  xlp?: Point;
|}

export type EdgeAttributes = {
  label?: string;
  ...GlobalEdgeAttributes;
}

export type RenderOptions = {
  layout?: Layout;
  type?: OutputType;
}
