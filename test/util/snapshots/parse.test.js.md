# Snapshot report for `test/util/parse.test.js`

The actual snapshot is saved in `parse.test.js.snap`.

Generated by [AVA](https://ava.li).

## parseClassSignature

> Snapshot 1

    {
      formalTypeParameters: undefined,
      superClassSignature: {
        package: 'java/lang',
        simple: [
          {
            identifier: 'Object',
            type: 'SimpleClassTypeSignature',
          },
        ],
        type: 'ClassTypeSignature',
      },
      superInterfaceSignatures: [
        {
          simple: [
            {
              identifier: 'iv',
              type: 'SimpleClassTypeSignature',
              typeArguments: {
                type: 'TypeArguments',
                value: [
                  {
                    type: 'TypeAgument',
                    value: {
                      simple: [
                        {
                          identifier: 'me',
                          type: 'SimpleClassTypeSignature',
                        },
                      ],
                      type: 'ClassTypeSignature',
                    },
                  },
                ],
              },
            },
          ],
          type: 'ClassTypeSignature',
        },
      ],
      type: 'ClassSignature',
    }

> Snapshot 2

    {
      formalTypeParameters: {
        type: 'FormalTypeParameters',
        value: [
          {
            classBound: undefined,
            identifier: 'C',
            interfacesBound: [
              {
                simple: [
                  {
                    identifier: 'bod',
                    type: 'SimpleClassTypeSignature',
                  },
                ],
                type: 'ClassTypeSignature',
              },
            ],
            type: 'FormalTypeParameter',
          },
        ],
      },
      superClassSignature: {
        package: 'java/lang',
        simple: [
          {
            identifier: 'Object',
            type: 'SimpleClassTypeSignature',
          },
        ],
        type: 'ClassTypeSignature',
      },
      superInterfaceSignatures: [
        {
          simple: [
            {
              identifier: 'bmp',
              type: 'SimpleClassTypeSignature',
              typeArguments: {
                type: 'TypeArguments',
                value: [
                  {
                    type: 'TypeAgument',
                    value: {
                      identifier: 'C',
                      type: 'TypeVariable',
                    },
                  },
                ],
              },
            },
          ],
          type: 'ClassTypeSignature',
        },
      ],
      type: 'ClassSignature',
    }

> Snapshot 3

    {
      formalTypeParameters: {
        type: 'FormalTypeParameters',
        value: [
          {
            classBound: {
              package: 'java/lang',
              simple: [
                {
                  identifier: 'Object',
                  type: 'SimpleClassTypeSignature',
                },
              ],
              type: 'ClassTypeSignature',
            },
            identifier: 'T',
            interfacesBound: [],
            type: 'FormalTypeParameter',
          },
        ],
      },
      superClassSignature: {
        package: 'java/lang',
        simple: [
          {
            identifier: 'Object',
            type: 'SimpleClassTypeSignature',
          },
        ],
        type: 'ClassTypeSignature',
      },
      superInterfaceSignatures: [
        {
          package: 'java/lang',
          simple: [
            {
              identifier: 'Iterable',
              type: 'SimpleClassTypeSignature',
              typeArguments: {
                type: 'TypeArguments',
                value: [
                  {
                    type: 'TypeAgument',
                    value: {
                      simple: [
                        {
                          identifier: 'wo',
                          type: 'SimpleClassTypeSignature',
                          typeArguments: {
                            type: 'TypeArguments',
                            value: [
                              {
                                type: 'TypeAgument',
                                value: {
                                  identifier: 'T',
                                  type: 'TypeVariable',
                                },
                              },
                            ],
                          },
                        },
                      ],
                      type: 'ClassTypeSignature',
                    },
                  },
                ],
              },
            },
          ],
          type: 'ClassTypeSignature',
        },
      ],
      type: 'ClassSignature',
    }
