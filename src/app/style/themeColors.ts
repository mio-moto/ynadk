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
    important: colors.teal[400],
    secondary: colors.ochre[400],
    link: colors.aqua[100],
  }),
  background: notCss({
    default: '#141414',
    defaultHover: colors.anthracite[900],
  }),
} as const)
