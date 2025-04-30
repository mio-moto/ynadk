import { notCss } from './util'

/**
 * Specific `font-size` values to be directly referenced:
 * @example const myStyleClass = css`font-size: ${style.fontSize.m}`
 */
export const fontSizeValues = notCss({
  s: '20px',
  m: '24px',
  l: '30px',
  xl: '42px',
  xxl: '128px',
} as const)

/**
 * Specific `line-height` values to be directly referenced:
 * @example const myStyleClass = css`line-height: ${style.lineHeight.m}`
 */
export const lineHeightValues = notCss({
  xxs: '120%',
  xs: '110%',
  s: '110%',
  m: '110%',
  l: '100%',
  xl: '100%',
  xxl: '100%',
} as const)

/**
 * Specific `font-weight` values to be directly referenced:
 * @example const myStyleClass = css`font-weight: ${style.fontWeight.regular}`
 */
export const fontWeightValues = notCss({
  regular: 400,
} as const)

/**
 * Specific `font-stretch` values to be directly referenced
 * @example const myStyleClass = css`font-stretch: ${style.fontStretch.regular}`
 */
export const fontStretchValues = notCss({
  condensed: 'condensed',
  normal: 'normal',
  expanded: '125%',
} as const)
