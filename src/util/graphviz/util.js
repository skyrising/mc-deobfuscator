// @flow

export function indent (str: string, indent: string = '  '): string {
  return indent + str.split('\n').map(line => indent + line).join('\n').trim() + '\n'
}

export function attrToString (key: string, value: any): string {
  return key + '=' + JSON.stringify(value)
}

export function attrsToStr (attrs: Object): string {
  return Object.keys(attrs).map(k => attrToString(k, attrs[k])).join(',')
}
