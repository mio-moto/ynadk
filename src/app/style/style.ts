import { css } from '@linaria/core'
import { colorTheme, colors } from './colors'
import { fragments } from './fragments'
import { notCss } from './util'
import './font.css'
import { fontName } from './fonts'
import { themeColors } from './themeColors'

export const style = notCss({
  colors,
  themeColors,
})

export const globalStyle = css`
  :global() {
    :root {
      ${colorTheme}

      font-family: "${fontName}", system-ui, Avenir, Helvetica, Arial, sans-serif;
      font-weight: 400;
      font-size: 24px;
      font-variant-numeric: tabular-nums lining-nums;
      text-transform: full-width;

      color-scheme: light dark;
      color: ${style.themeColors.text.default};
      background-color: ${style.themeColors.background.default};

      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;

      interpolate-size: allow-keywords;
      cursor: default;
      user-select: none;

      &:focus {
        outline: none;
      }
    }

    * {
      margin: 0;
      font-family: "${fontName}", system-ui, Avenir, Helvetica, Arial, sans-serif;
      font-weight: 400;
      font-size: 24px;

      
      &:focus {
        outline: none;
      }
    }

    body {
      margin: 0;
      display: flex;
      place-items: center;
      min-width: 320px;
      min-height: 100vh;
    }

    a {
      color: ${style.colors.aqua.primary};
      transition: ${fragments.transition.fast('color')};
      &:hover {
        color: ${style.colors.aqua[700]};
      }

      
    }

    h1 {
      ${fragments.textStyle.heading.xxl}
    }
    h2 {
      ${fragments.textStyle.heading.xl};
    }
    h3 {
      ${fragments.textStyle.heading.l};
    }
    h4 {
      ${fragments.textStyle.heading.m};
    }

    #root {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  }
`
