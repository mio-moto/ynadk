import { css, cx } from '@linaria/core'
import { type FC, type HTMLProps, forwardRef } from 'react'
import { fragments } from '../app/style/fragments'
import { style } from '../app/style/style'

export const buttonClass = css`
  @property --border-color {
    syntax: "<color>";
    inherits: false;
    initial-value: ${style.themeColors.line.default};
  }
  cursor: pointer;
  padding: 0 8px;
  border-radius: 0px;
  border: 3px solid;
  border-image: linear-gradient(to bottom, transparent 25%,transparent 25%,transparent 75%, var(--border-color) 75%);
  border-image-slice: 1;
  background-color: transparent;
  ${fragments.textStyle.button.regular}
  transition: ${fragments.transition.regular('--border-color')}, ${fragments.transition.fast('color')};

  color: ${style.themeColors.text.default};
  &:hover {
    --border-color: ${style.colors.ochre[200]};
  }
  &:disabled {
    cursor: unset;
    --border-color: ${style.themeColors.text.disabled};
    &:hover {
      --border-color: ${style.themeColors.background.default};
    }
  }

  &.selected {
    --border-color: ${style.colors.ochre[700]};
    color: ${style.colors.ochre[500]};
  }
`

export const Button: FC<
  HTMLProps<HTMLButtonElement> & { type?: 'submit' | 'button' | 'reset'; kind?: 'primary' | 'secondary' | 'regular'; selected?: boolean }
> = forwardRef(function Button({ className, type, kind, selected, ...props }, ref) {
  return <button type={type} ref={ref} {...props} className={cx(buttonClass, kind, selected && 'selected', className)} />
})
