/**
 * Do not use this object for css expansion strings, this object have properties that you should use instead.
 */
type NotCss<T> = T & { toString: () => never }

export const notCss = <T>(object: T): NotCss<T> => {
  return {
    ...object,
    toString: () => {
      throw new Error('Cannot expanded into CSS.')
    },
  }
}
