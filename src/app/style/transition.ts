import { notCss } from './util'

export const transitionFragments = notCss({
  fast: <T extends string = string>(prop: T) => ` 0.15s ease ${prop} `,
  regular: <T extends string = string>(prop: T) => ` 0.25s ease ${prop} `,
  slow: <T extends string = string>(prop: T) => ` 0.45s ease ${prop} `,
  graceful: <T extends string = string>(prop: T) => ` 1.5s ease ${prop} `,
  debug: <T extends string = string>(prop: T) => ` 1.5s ease ${prop} `,
} as const)
