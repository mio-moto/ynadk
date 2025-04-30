import { css } from '@linaria/core'
import { type FC, useRef } from 'react'
import { Button } from './components/Button'
import { useDrumKit } from './features/Drumkit/DrumkitContext'
import { DrumKitFiles } from './features/Drumkit/DrumkitFiles'
import { KitOrder } from './features/Drumkit/KitOrder'
import { UserSettings } from './features/Drumkit/UserSettings'
import { SampleTable } from './features/Drumkit/SampleTable'
import { renderAudioKit } from './features/Drumkit/audioRenderer'

type UUID = ReturnType<typeof window.crypto.randomUUID>
const appClass = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  > .main {
    display: flex;
    flex-direction: column;
    justify-content:  center;
    align-items: center;
    gap: 24px;

    > .panels {
      display: flex;
      gap: 48px;



      > .center {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 24px;


        > .render {
          flex: 1;
          justify-self: stretch;
          align-self: stretch;
        }
    }
  }
}
`

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const octaves = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B']

const emptySlots: { file: UUID | undefined; hint: string }[] = []
for (let i = 0; i < notes.length * octaves.length; i += 1) {
  emptySlots.push({ file: undefined, hint: '' })
}

export const App: FC = () => {
  const context = useDrumKit()
  const {
    config: { kitName },
  } = context
  const audioRef = useRef<HTMLAudioElement>(null)

  return (
    <div className={appClass}>
      <audio style={{ display: 'none' }} ref={audioRef} />
      <main className="main">
        <h1>YNADK</h1>
        <div className="panels">
          <KitOrder context={context} />
          <div className="center">
            <UserSettings context={context} />
            <SampleTable context={context} />

            <Button
              className="render"
              onClick={() => {
                const result = renderAudioKit(context)
                const buffer = result.toBuffer()
                const content = new Blob([buffer], { type: 'audio/wav' })
                const encodedUri = window.URL.createObjectURL(content)
                const link = document.createElement('a')
                link.setAttribute('href', encodedUri)
                const name = kitName.length > 0 ? kitName : 'kit'
                link.setAttribute('download', `${name}.wav`)
                link.click()
                link.remove()
              }}
            >
              render
            </Button>
          </div>
          <DrumKitFiles context={context} />
        </div>
      </main>
    </div>
  )
}
