import { css, cx } from '@linaria/core'
import type { FC, HTMLProps } from 'react'

const modalClass = css`
  align-self: center;
  justify-self: center;
  &::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }
`

export const Modal: FC<HTMLProps<HTMLDialogElement> & { closedby?: 'any' | 'none' | 'closerequest' }> = ({ className, ...props }) => {
  return <dialog className={cx(modalClass, className)} {...props} />
}
