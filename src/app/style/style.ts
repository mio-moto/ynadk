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

      font-family: "${fontName}";

      ${fragments.textStyle.body.m.regular};
      line-height: normal;
      
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
      font-synthesis: style small-caps weight;
      font-family: "${fontName}";
      ${fragments.textStyle.body.m.regular};
      line-height: normal;

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
      color: ${style.themeColors.text.link};
      transition: ${fragments.transition.fast('color')};
      &:hover {
        color: ${style.colors.aqua[500]};
      }

      &:visited {
        color: ${style.colors.aqua[600]};
        &:hover {
          color: ${style.colors.aqua[700]};
        }
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
