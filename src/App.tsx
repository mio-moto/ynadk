import { css } from '@linaria/core'
import { type FC, useRef, useState } from 'react'
import { fragments } from './app/style/fragments'
import { style } from './app/style/style'
import { Button } from './components/Button'
import { DroppingOverlay } from './features/Drumkit/DropOverlay'
import { useDrumKit } from './features/Drumkit/DrumkitContext'
import { DrumKitFiles } from './features/Drumkit/DrumkitFiles'
import { KitOrder } from './features/Drumkit/KitOrder'
import { SampleTable } from './features/Drumkit/SampleTable'
import { UserSettings } from './features/Drumkit/UserSettings'

import { RenderToast } from './features/Drumkit/RenderToast'
import { UserGuide } from './features/UserGuide'

type UUID = ReturnType<typeof window.crypto.randomUUID>
const appClass = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;

  > .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content:  center;
    align-items: stretch;
    gap: 24px;

    > .heading {
      display: flex;
      align-items: center;
      justify-content: center;
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
    }

    > .panels {
      flex: 1;
      display: flex;
      gap: 48px;


      > * {
        flex: 1;
      }
      > .center {
        flex: 0;
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

        > .importer {
          align-self: stretch;
          display: flex;
          gap: 24px;
          > .file-selector {
            display: none;
          }
          > .export, .import {
            flex: 1;
          }
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
    slots: { slots },
    fileDropping: { isDropping },
  } = context
  const audioRef = useRef<HTMLAudioElement>(null)
  const inputfileRef = useRef<HTMLInputElement>(null)

  const [forceUserGuide, setForceUserGuide] = useState(false)

  return (
    <div className={appClass}>
      <UserGuide forceOpen={forceUserGuide} onClose={() => setForceUserGuide(false)} />
      <audio style={{ display: 'none' }} ref={audioRef} />
      <main className="main">
        <div className="heading">
          <h1 className="title">
            YNADK
            <div className="user-guide" onClick={() => setForceUserGuide(true)}>
              ?
            </div>
          </h1>
        </div>
        <div className="panels">
          <KitOrder context={context} />
          <div className="center">
            <UserSettings context={context} />
            <SampleTable context={context} />

            <Button
              className="render"
              disabled={!slots.some((x) => x.file?.type === 'present')}
              onClick={() => {
                context.kitRenderer.createNewTask(context.slots.slots, context.config.current)
              }}
            >
              render
            </Button>

            <div className="importer">
              <input
                type="file"
                className="file-selector"
                accept=".ynadk"
                ref={inputfileRef}
                onInput={async (evt) => {
                  const file = evt.currentTarget.files?.[0]
                  if (!file) {
                    return
                  }
                  context.kitRenderer.createNewImport(await file.arrayBuffer())
                }}
                onClick={(evt) => {
                  evt.currentTarget.value = ''
                }}
              />
              <Button
                className="import"
                onClick={() => {
                  if (!inputfileRef.current) {
                    return
                  }
                  inputfileRef.current?.click()
                }}
              >
                import
              </Button>
              <Button
                className="export"
                onClick={() => {
                  context.kitRenderer.createNewExport(context)
                }}
              >
                export
              </Button>
            </div>
          </div>
          <DrumKitFiles context={context} />
        </div>
      </main>
      <RenderToast context={context} />
      <DroppingOverlay isDropping={isDropping} />
    </div>
  )
}
