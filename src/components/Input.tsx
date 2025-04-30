import { css, cx } from '@linaria/core'
import type { FC, HTMLProps } from 'react'
import { fragments } from '../app/style/fragments'
import { style } from '../app/style/style'

const inputClass = css`
  @property --border-color {
    syntax: "<color>";
    initial-value: ${style.themeColors.line.default};
  }
  border: 3px solid;
  border-image: linear-gradient(to bottom, transparent 25%,transparent 25%,transparent 75%, var(--border-color) 75%);
  border-image-slice: 1;
  background-color: transparent;
  padding: 0 8px;

  transition: ${fragments.transition.regular('--border-color')};

  &:hover {
    --border-color: ${style.colors.ochre[200]};
  }

  &:focus,  &.with-value {
    outline: none;
    --border-color: ${style.colors.ochre[700]};
    color: ${style.colors.ochre[500]};
  }
`

export const Input: FC<HTMLProps<HTMLInputElement>> = ({ className, value, ...props }) => (
  <input {...props} value={value} className={cx(inputClass, value && 'with-value', className)} />
)
