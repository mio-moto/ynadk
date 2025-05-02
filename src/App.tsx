import { css } from '@linaria/core'
import { type FC, useRef, useState } from 'react'
import { fragments } from './app/style/fragments'
import { style } from './app/style/style'
import { Button } from './components/Button'
import { useDrumKit } from './features/Drumkit/DrumkitContext'
import { DrumKitFiles } from './features/Drumkit/DrumkitFiles'
import { KitOrder } from './features/Drumkit/KitOrder'
import { SampleTable } from './features/Drumkit/SampleTable'
import { UserSettings } from './features/Drumkit/UserSettings'
import { renderAudioKit } from './features/Drumkit/audioRenderer'
import { UserGuide } from './features/UserGuide'

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

    > .title {
      position: relative;
      margin: 0;
      > .user-guide {
        cursor: pointer;
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        top: 0;
        right: -30px;
        height: 30px;
        width: 30px;
        transform: translate(50%, 50%);
        border: 2px solid ${style.themeColors.line.default};
        transition: ${fragments.transition.regular('background-color')};

        &:hover {
          background-color: ${style.themeColors.background.defaultHover};
        }
      }
    }

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

  const [forceUserGuide, setForceUserGuide] = useState(false)

  return (
    <div className={appClass}>
      <UserGuide forceOpen={forceUserGuide} onClose={() => setForceUserGuide(false)} />
      <audio style={{ display: 'none' }} ref={audioRef} />
      <main className="main">
        <h1 className="title">
          YNADK{' '}
          <div className="user-guide" onClick={() => setForceUserGuide(true)}>
            ?
          </div>
        </h1>
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
