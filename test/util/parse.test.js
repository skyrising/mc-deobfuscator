import test from 'ava'
import * as parse from '../../util/parse'

test('parseClassSignature', t => {
  const cases = [
    'Ljava/lang/Object;Liv<Lme;>;',
    '<C::Lbod;>Ljava/lang/Object;Lbmp<TC;>;',
    '<T:Ljava/lang/Object;>Ljava/lang/Object;Ljava/lang/Iterable<Lwo<TT;>;>;'
  ]
  for (const c of cases) {
    const [cs, rest] = parse.parseClassSignature(c)
    t.falsy(rest)
    t.snapshot(cs)
  }
})
