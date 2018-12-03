// @flow

export function h (item: any): bigint {
  if (!item) return h(typeof item)
  if (typeof item === 'bigint') return item
  if (typeof item === 'number' || typeof item === 'boolean') return BigInt(Math.abs(Math.floor(item)))
  if (typeof item === 'string') {
    let hash = BigInt(324)
    for (let i = 0; i < item.length; i++) hash = BigInt(31) * hash + BigInt(item.charCodeAt(i))
    return hash
  }
  if (Array.isArray(item)) {
    let hash = BigInt(2347)
    for (const x of item) hash = BigInt(31) * hash + h(x)
    return hash
  }
  if (typeof item === 'object') {
    let hash = BigInt(9876)
    for (const k of Object.keys(item)) {
      hash = BigInt(31) * hash + h(k)
      hash = BigInt(31) * hash + h(item[k])
    }
    return hash
  }
  return BigInt(541)
}

export function hsig <T> (sig: string, alt?: T): string|T {
  switch (sig[0]) {
    case 'L': return sig.startsWith('Ljava') ? sig : (alt || '')
    case '[': return '[' + String(hsig(sig.slice(1), alt))
  }
  return sig
}

export function h2 (hash: bigint, item: any): bigint {
  return hash * BigInt(31) + h(item)
}

export const BASE26_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

export function base26 (n: bigint): string {
  if (n === 0 || typeof n !== 'bigint') return 'a'
  let s = ''
  n = n < 0 ? -n : n
  while (n > 0) {
    s = BASE26_ALPHABET[n % BigInt(26)] + s
    n = n / BigInt(26)
  }
  return s
}

export function compress (hash: bigint, maxSize: bigint) {
  let state = BigInt(0)
  while (hash) {
    state ^= hash % maxSize
    hash /= maxSize
  }
  return state
}
