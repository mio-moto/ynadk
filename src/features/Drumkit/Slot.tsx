import { type FC, type HTMLProps, type RefObject, useMemo } from 'react'
import type { DrumKitContext } from './DrumkitContext'
import { css, cx } from '@linaria/core'
import { fragments } from '../../app/style/fragments'
import { style } from '../../app/style/style'

const kitColors = [
  style.colors.aqua[200],
  style.colors.ochre[200],
  style.colors.lime[200],
  style.colors.raspberry[200],
  style.colors.navy[200],
  style.colors.anthracite[200],
] as const

const slotClass = css`
  display: flex;
  flex-direction: column;
  position: relative;
  --border-color: transparent;
  border: 3px solid;
  border-image: linear-gradient(to bottom, transparent 25%,transparent 25%,transparent 75%, var(--border-color) 75%);
  border-image-slice: 1;
  background-color: transparent;
  transition: ${fragments.transition.regular('--border-color')}, ${fragments.transition.fast('color')};

  &.highlighted {
    color: ${style.themeColors.text.important};
  }

  > .kit-type {
    white-space: pre;
    font-size: 12px;
    line-height: 90%;
  }

  > .file-number {
    line-height: 80%;
    margin-top: -4px;
    text-transform: uppercase;
    letter-spacing: -3px;
    white-space: pre;
  }

  &:before {
    position: absolute;
    display: block;
    width: calc(100% + 13.5px);
    height: calc(100% + 3px);
    left: -7.5px;
    content: " ";
    border-left: 1.5px solid transparent;
    border-bottom: 1.5px solid transparent;
  }

  &.bl:before {
    border-left-color: ${style.colors.ochre[700]};
  }

  &.kit-0:before {
    border-bottom-color: color-mix(in srgb, ${kitColors[0]}, 75% transparent);
  }
  &.kit-1:before {
    border-bottom-color: color-mix(in srgb, ${kitColors[1]}, 75% transparent);
  }
  &.kit-2:before {
    border-bottom-color: color-mix(in srgb, ${kitColors[2]}, 75% transparent);
  }
  &.kit-3:before {
    border-bottom-color: color-mix(in srgb, ${kitColors[3]}, 75% transparent);
  }
  &.kit-4:before {
    border-bottom-color: color-mix(in srgb, ${kitColors[4]}, 75% transparent);
  }
  &.kit-5:before {
    border-bottom-color: color-mix(in srgb, ${kitColors[5]}, 75% transparent);
  }

  &.selective {
    cursor: pointer;
    --border-color: ${style.themeColors.line.default};
    &:hover {
      --border-color: ${style.colors.ochre[700]}
    }
  }
`

export const Slot: FC<HTMLProps<HTMLDivElement> & { context: DrumKitContext; index: number; audio: RefObject<HTMLAudioElement | null> }> = ({
  context,
  index,
  className,
  audio,
  ...props
}) => {
  const {
    slots: { slots, assignFile },
    config: {
      current: { stride },
    },
    kits: { kit, count: kitCount },
    highlight: { highlight, setHighlight },
    selectedFile,
    setSelectedFile,
  } = context
  const { slot, hitsStride, kitIndex } = useMemo(
    () => ({
      slot: slots[index],
      hitsStride: index % stride === 0,
      kitIndex: stride === 0 ? -1 : Math.floor(index / stride) % kitColors.length,
    }),
    [slots, stride, index],
  )

  const kitName = useMemo(() => {
    let kitPos = index % stride
    const filler = kitCount > 0 ? ' ' : undefined
    for (const element of kit) {
      kitPos -= element.count
      if (kitPos < 0) {
        // edge case: an empty kit name is replaced with filler, otherwise the span will not take space

        return element.name || filler
      }
    }
    return filler
  }, [index, stride, kit, kitCount])

  return (
    <div
      className={cx(
        slotClass,
        hitsStride && 'bl',
        kitIndex >= 0 && `kit-${kitIndex}`,
        slot.file && slot.file.id === highlight && 'highlighted',
        selectedFile && 'selective',
        className,
      )}
      {...props}
      onClick={() => {
        if (selectedFile === undefined && slot.file && audio.current && slot.file.type === 'present') {
          const blob = new Blob([slot.file.bytes], { type: 'audio/wav' })
          audio.current.src = URL.createObjectURL(blob)
          audio.current.play()
          return
        }
        assignFile(selectedFile, index)
        setSelectedFile(undefined)
      }}
      onPointerEnter={() => {
        if (slot.file) {
          setHighlight(slot.file?.id)
        }
      }}
      onPointerLeave={() => {
        if (slot.file?.id === highlight) {
          setHighlight(undefined)
        }
      }}
    >
      {kitName && <span className="kit-type">{kitName}</span>}
      <span className="file-number">{slot.file?.index.toString().padStart(3, '0') ?? '-   -   -'}</span>
    </div>
  )
}
