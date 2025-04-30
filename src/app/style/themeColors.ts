import { colors } from './colors'
import { notCss } from './util'

export const themeColors = notCss({
  line: notCss({
    default: colors.anthracite[500],
    focus: colors.teal[500],
  } as const),
  text: notCss({
    default: colors.anthracite[100],
    disabled: colors.anthracite[500],
  }),
  background: notCss({
    default: '#141414',
    defaultHover: colors.anthracite[900],
  }),
} as const)
