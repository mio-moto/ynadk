import { css, cx } from '@linaria/core'
import type { FC, HTMLProps } from 'react'
import { fragments } from '../../app/style/fragments'
import { style } from '../../app/style/style'
import DropIcon from '../../assets/icons/place-item.svg'
import { Icon } from '../../components/Icon'

const dropOverlayClass = css`
  pointer-events: none;
  isolation: isolate;
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;

  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  opacity: 0;

  transition: ${fragments.transition.slow('opacity')};

  background-color: color-mix(in srgb, ${style.themeColors.background.default}, 25% transparent);

  &.is-dropping {
    opacity: 1;
  }

  > .content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    padding: 36px;
    gap: 48px;
    background-color: color-mix(in srgb, ${style.themeColors.background.defaultHover}, 50% transparent);
  }
`

export const DroppingOverlay: FC<HTMLProps<HTMLDivElement> & { isDropping: boolean }> = ({ isDropping, className, ...props }) => {
  return (
    <div className={cx(dropOverlayClass, isDropping && 'is-dropping', className)} {...props}>
      <div className="content">
        <Icon icon={DropIcon} size="xxl" />
        <span>Drop your files and add them to the file-list</span>
      </div>
    </div>
  )
}
