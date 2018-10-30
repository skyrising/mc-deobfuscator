// @flow

export function h (item: any): number {
  if (!item) return h(typeof item)
  if (typeof item === 'number' || typeof item === 'boolean') return Math.abs(Math.floor(+item))
  if (typeof item === 'string') {
    let hash = 324
    for (let i = 0; i < item.length; i++) hash = (31 * hash + item.charCodeAt(i)) | 0
    return hash
  }
  if (Array.isArray(item)) {
    let hash = 2347
    for (const x of item) hash = (31 * hash + h(x)) | 0
    return hash
  }
  if (typeof item === 'object') {
    let hash = 9876
    for (const k of Object.keys(item)) {
      hash = (31 * hash + h(k)) | 0
      hash = (31 * hash + h(item[k])) | 0
    }
    return hash
  }
  return 541
}

export function hsig <T> (sig: string, alt?: T): string|T {
  switch (sig[0]) {
    case 'L': return sig.startsWith('Ljava') ? sig : (alt || '')
    case '[': return '[' + String(hsig(sig.slice(1), alt))
  }
  return sig
}

export function h2 (hash: number, item: any): number {
  return (hash * 31 + h(item)) | 0
}

export const BASE26_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

export function base26 (n: number): string {
  if (n === 0 || typeof n !== 'number') return 'a'
  let s = ''
  n = Math.abs(Math.floor(n))
  while (n > 0) {
    s = BASE26_ALPHABET[n % 26] + s
    n = Math.floor(n / 26)
  }
  return s
}
