// @flow

export const ACC_PUBLIC = 0x0001
export const ACC_PRIVATE = 0x0002
export const ACC_PROTECTED = 0x0004
export const ACC_STATIC = 0x0008
export const ACC_FINAL = 0x0010
export const ACC_SUPER = 0x0020
export const ACC_SYNCHRONIZED = 0x0020
export const ACC_VOLATILE = 0x0040
export const ACC_BRIDGE = 0x0040
export const ACC_VARARGS = 0x0080
export const ACC_TRANSIENT = 0x0080
export const ACC_NATIVE = 0x0100
export const ACC_INTERFACE = 0x0200
export const ACC_ABSTRACT = 0x0400
export const ACC_STRICT = 0x0800
export const ACC_SYNTHETIC = 0x1000
export const ACC_ANNOTATION = 0x2000
export const ACC_ENUM = 0x4000
export const ACC_MODULE = 0x8000

export function decodeClassAccessFlags (acc: number): ClassAccessFlags {
  return {
    public: Boolean(acc & ACC_PUBLIC),
    final: Boolean(acc & ACC_FINAL),
    super: Boolean(acc & ACC_SUPER),
    interface: Boolean(acc & ACC_INTERFACE),
    abstract: Boolean(acc & ACC_ABSTRACT),
    synthetic: Boolean(acc & ACC_SYNTHETIC),
    annotation: Boolean(acc & ACC_ANNOTATION),
    enum: Boolean(acc & ACC_ENUM),
    module: Boolean(acc & ACC_MODULE)
  }
}

export function decodeFieldAccessFlags (acc: number): FieldAccessFlags {
  return {
    public: Boolean(acc & ACC_PUBLIC),
    private: Boolean(acc & ACC_PRIVATE),
    protected: Boolean(acc & ACC_PROTECTED),
    static: Boolean(acc & ACC_STATIC),
    final: Boolean(acc & ACC_FINAL),
    volatile: Boolean(acc & ACC_VOLATILE),
    transient: Boolean(acc & ACC_TRANSIENT),
    synthetic: Boolean(acc & ACC_SYNTHETIC),
    enum: Boolean(acc & ACC_ENUM)
  }
}

export function decodeMethodAccessFlags (acc: number): MethodAccessFlags {
  return {
    public: Boolean(acc & ACC_PUBLIC),
    private: Boolean(acc & ACC_PRIVATE),
    protected: Boolean(acc & ACC_PROTECTED),
    static: Boolean(acc & ACC_STATIC),
    final: Boolean(acc & ACC_FINAL),
    synchronized: Boolean(acc & ACC_SYNCHRONIZED),
    bridge: Boolean(acc & ACC_BRIDGE),
    varargs: Boolean(acc & ACC_VARARGS),
    native: Boolean(acc & ACC_NATIVE),
    abstract: Boolean(acc & ACC_ABSTRACT),
    strict: Boolean(acc & ACC_STRICT),
    synthetic: Boolean(acc & ACC_SYNTHETIC)
  }
}
