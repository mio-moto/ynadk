import { notCss } from './util'

export const anthracite = notCss({
  900: '#2e383c',
  800: '#3f4e52',
  700: '#4d6167',
  600: '#5c767d',
  500: '#68858e',
  400: '#80979f',
  300: '#97aab0',
  200: '#b6c2c6',
  primary: '#d4dadc',
  100: '#d4dadc',
  50: '#f0f0f0',
} as const)

/** Primary color */
export const teal = notCss({
  900: '#126871',
  800: '#1d8b9e',
  700: '#229fb7',
  600: '#29b4d2',
  500: '#2ec5e6',
  primary: '#2ec5e6',
  400: '#3bceeb',
  300: '#59d7f0',
  200: '#87e3f6',
  100: '#b6eefa',
  50: '#e2f8fd',
} as const)

/** Complementary color */
export const ochre = notCss({
  900: '#bd3e23',
  800: '#d74a2b',
  700: '#e6502e',
  primary: '#e6502e',
  600: '#f45733',
  500: '#ff5d38',
  400: '#fe7553',
  300: '#fe8e71',
  200: '#fdad99',
  100: '#fecdc1',
  50: '#faeae9',
} as const)

/** Analogue color 1 */
export const lime = notCss({
  900: '#007d45',
  800: '#009e5c',
  700: '#00b069',
  600: '#00c478',
  500: '#00d585',
  400: '#00de97',
  300: '#2ee6ac',
  primary: '#2ee6ac',
  200: '#84edc4',
  100: '#b8f4db',
  50: '#e2fbf1',
} as const)

/** Analogue color 2 */
export const aqua = notCss({
  900: '#3047c6',
  800: '#2e68e6',
  primary: '#2e68e6',
  700: '#2c7bf8',
  600: '#288eff',
  500: '#1d9dff',
  400: '#3cacff',
  300: '#62bcff',
  200: '#92cfff',
  100: '#bde1ff',
  50: '#e4f3ff',
} as const)

/** Triadic color 1 */
export const navy = notCss({
  900: '#000dc9',
  800: '#001cd1',
  700: '#2722d7',
  600: '#422adf',
  500: '#502ee6',
  primary: '#502ee6',
  400: '#7250ea',
  300: '#8f70ee',
  200: '#b19af2',
  100: '#d0c3f7',
  50: '#ede6fc',
} as const)

/** Triadic color 2 */
export const raspberry = notCss({
  900: '#770094',
  800: '#99009c',
  700: '#ab00a1',
  600: '#bf00a5',
  500: '#ce00a8',
  400: '#de00b8',
  300: '#e62ec4',
  primary: '#e62ec4',
  200: '#ef7bd4',
  100: '#f6b2e5',
  50: '#fce1f4',
} as const)

export const colors = notCss({
  anthracite,
  teal,
  ochre,
  lime,
  aqua,
  navy,
  raspberry,
} as const)

type ColorKeys = Exclude<keyof typeof teal, 'toString'>

const createCssColor = <T extends string = string>(colorTable: { [k in ColorKeys]: string }, colorName: T) =>
  `--${colorName}-900: ${colorTable[900]};
--${colorName}-800: ${colorTable[800]};
--${colorName}-700: ${colorTable[700]};
--${colorName}-600: ${colorTable[600]};
--${colorName}-500: ${colorTable[500]};
--${colorName}-400: ${colorTable[400]};
--${colorName}-300: ${colorTable[300]};
--${colorName}-200: ${colorTable[200]};
--${colorName}-100: ${colorTable[100]};
--${colorName}-50: ${colorTable[50]};
--${colorName}-primary: ${colorTable.primary};
` as const

export const colorTheme = `
${createCssColor(anthracite, 'anthracite')}
${createCssColor(teal, 'teal')}
${createCssColor(ochre, 'ochre')}
${createCssColor(lime, 'lime')}
${createCssColor(aqua, 'aqua')}
${createCssColor(navy, 'navy')}
${createCssColor(raspberry, 'raspberry')}
` as const
