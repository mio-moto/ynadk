import { css, cx } from '@linaria/core'
import { type FC, type HTMLProps, useRef, useState } from 'react'
import { style } from '../../app/style/style'
import { type DrumKitContext, notes, octaves } from './DrumkitContext'
import { Slot } from './Slot'

const sampleTableClass = css`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-column-gap: 8px;
  grid-row-gap: 4px;
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
    slots: { slots },
    selection: { selectedFiles },
  } = context

  const [pointerLoc, setPointerLoc] = useState<number>()

  const audioRef = useRef<HTMLAudioElement>(null)
  return (
    <div className={cx(sampleTableClass, selectedFiles.length > 0 && 'selective', className)} {...props}>
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
            const preview = pointerLoc === undefined ? undefined : selectedFiles[idx - pointerLoc]
            if (idx >= 128) {
              return undefined
            }
            return (
              <Slot
                key={slot.name}
                index={idx}
                context={context}
                audio={audioRef}
                onPointerEnter={() => pointerLoc !== idx && selectedFiles.length > 0 && setPointerLoc(idx)}
                onPointerLeave={() => pointerLoc !== undefined && selectedFiles.length > 0 && setPointerLoc(undefined)}
                preview={preview}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
