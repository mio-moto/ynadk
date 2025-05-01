import { useRef, type FC, type HTMLProps } from 'react'
import { type DrumKitContext, notes, octaves } from './DrumkitContext'
import { css, cx } from '@linaria/core'
import { style } from '../../app/style/style'
import { fragments } from '../../app/style/fragments'

const kitColors = [
  style.colors.aqua[200],
  style.colors.ochre[200],
  style.colors.lime[200],
  style.colors.raspberry[200],
  style.colors.navy[200],
  style.colors.anthracite[200],
] as const

const sampleTableClass = css`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-column-gap: 8px;
  grid-row-gap: 4px;
  > .row > .note {
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
      color: ${style.colors.lime[500]};
    }

    > .kit-type {
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
  }
  &.selective > .row > .note { 
    cursor: pointer;
    --border-color: ${style.themeColors.line.default};
    &:hover {
      --border-color: ${style.colors.ochre[700]}
    }
  }
  > .row {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;


    > .inactive {
      color: ${style.themeColors.text.disabled};
    }
  }     
`

export const SampleTable: FC<HTMLProps<HTMLDivElement> & { context: DrumKitContext }> = ({ context, className, ...props }) => {
  const {
    slots: { slots, assignFile },
    kits,
    highlight: { highlight, setHighlight },
    selectedFile,
    setSelectedFile,
  } = context

  const audioRef = useRef<HTMLAudioElement>(null)
  return (
    <div className={cx(sampleTableClass, selectedFile && 'selective', className)} {...props}>
      <audio className="audio-player" ref={audioRef} />

      <div className="row">
        <div />
        <div>C</div>
        <div>C#</div>
        <div>D</div>
        <div>D#</div>
        <div>E</div>
        <div>F</div>
        <div>F#</div>
        <div>G</div>
        <div>G#</div>
        <div>A</div>
        <div>A#</div>
        <div>B</div>
      </div>

      {octaves.map((octave, y) => (
        <div className="row" key={octave}>
          <div>0{octave}</div>
          {notes.map((_, x) => {
            const idx = y * notes.length + x
            const slot = slots[idx]
            const hitsStride = idx % kits.count === 0
            const kitIndex = Math.floor(idx / kits.count) % kitColors.length
            if(idx >= 128) {
              return undefined;
            }
            return (
              <div
                key={slot.name}
                className={cx('note', 'inactive', hitsStride && 'bl', `kit-${kitIndex}`, slot.file && slot.file.id === highlight && 'highlighted')}
                onClick={() => {
                  if (selectedFile === undefined && slot.file && audioRef.current) {
                    const blob = new Blob([slot.file.bytes], { type: 'audio/wav' })
                    audioRef.current.src = URL.createObjectURL(blob)
                    audioRef.current.play()
                    return
                  }
                  assignFile(selectedFile, idx)
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
                {(() => {
                  let kitPos = idx % kits.count
                  for (const element of kits.kit) {
                    kitPos -= element.count
                    if (kitPos < 0) {
                      return <span className="kit-type">{element.name || '---'}</span>
                    }
                  }
                  return undefined
                })()}
                <span className="file-number">{slot.file?.index.toString().padStart(3, '0') ?? '-   -   -'}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
