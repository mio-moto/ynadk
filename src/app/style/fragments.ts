import { textStyleFragments } from './textStyle'
import { transitionFragments } from './transition'
import { notCss } from './util'

export const fragments = notCss({
  textStyle: textStyleFragments,
  transition: transitionFragments,
} as const)
