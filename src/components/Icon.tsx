import { css, cx } from '@linaria/core'
import { type CSSProperties, type FC, type HTMLProps, forwardRef, useMemo } from 'react'

const iconClass = css`
  --mask-image: none;
  --icon-size: 16px;
  mask-image: var(--mask-image);
  display: inline-block;
  width: var(--icon-size);
  height: var(--icon-size);
  flex-shrink: 0;

  background-repeat: no-repeat;
  mask-repeat: no-repeat;
  mask-size: contain;
  background-color: currentColor;

  &.size-xxs {
    --icon-size: 10px;
  }

  &.size-xs {
    --icon-size: 12px;
  }

  &.size-s {
    --icon-size: 20px;
  }

  &.size-m {
    --icon-size: 24px;
  }

  &.size-l {
    --icon-size: 32px;
  }

  &.size-xl {
    --icon-size: 48px;
  }

  &.size-xxl {
    --icon-size: 96px;
  }

  &.size-default {
    --icon-size: 16px;
  }
`

const sizeToClass: Record<IconSize, string> = {
  default: 'size-default',
  xxs: 'size-xxs',
  xs: 'size-xs',
  s: 'size-s',
  m: 'size-m',
  l: 'size-l',
  xl: 'size-xl',
  xxl: 'size-xxl',
} as const

export type IconSize = 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl' | 'default'

export const Icon: FC<Omit<HTMLProps<HTMLDivElement>, 'size'> & { icon?: string; size?: IconSize }> = forwardRef(function Icon(
  { icon, size = 'default' as keyof typeof sizeToClass, style, className, ...props },
  ref,
) {
  const combinedStyle = useMemo(
    () =>
      ({
        ...style,
        '--mask-image': `url(${icon})`,
      }) as CSSProperties,
    [style, icon],
  )
  return <div {...props} ref={ref} className={cx(iconClass, sizeToClass[size], className)} style={combinedStyle} />
})
