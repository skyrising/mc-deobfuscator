import * as PKG from '../../../../../../ClassNames'

export function method (methodInfo: MethodInfo) {
  const { code, info } = methodInfo
  if (methodInfo.obfName === '<init>') {
    for (const c of code.constants) {
      console.error(c)
      if (!c.line.next || c.line.next.op !== 'new') continue
      const rendererCls = c.line.next.className
      const entityCls = info.class[c.value]
      console.error('Entity renderer:', rendererCls, 'for', entityCls)
      info.class[rendererCls].depends = () => {
        const bestEntityName = entityCls.bestName
        if (bestEntityName === entityCls.obfName) return
        const simpleName = bestEntityName.slice(bestEntityName.lastIndexOf('.') + 1).replace(/\$/g, '')
        return PKG.RENDER_ENTITY + '.' + simpleName + 'Renderer'
      }
    }
  }
}
