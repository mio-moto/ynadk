import { css, cx } from '@linaria/core'
import { type FC, type HTMLProps, type RefObject, memo, useEffect, useMemo, useRef, useState } from 'react'
import { fragments } from '../../app/style/fragments'
import { style } from '../../app/style/style'
import { Button } from '../../components/Button'
import type { DrumKitContext, KitAudio } from './DrumkitContext'

const drumKitFilesClass = css`
  display: flex;
  
  > .content {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 200px;

    gap: 8px;
    > .title {
      border-bottom: 2px solid ${style.themeColors.line.default};
    }

    > .audio {
      display: none;
    }

    > .files {
      overflow: auto;
      flex: 1 1 0;
      border-bottom: 2px solid ${style.themeColors.line.default};
      padding-bottom: 8px;
      > .file {
        display: flex;
        gap: 8px;
        transition: ${fragments.transition.fast('color')};
        align-items: center;
        user-select: auto;
        &.selected {
          color: ${style.themeColors.text.important};
        }
        &.highlighted {
          color: ${style.colors.lime[500]};
        }
        > .name {
          flex: 1;
        }

        &.removed {
          pointer-events: none;
          > .name {
            color: ${style.themeColors.text.disabled};
            ${fragments.textStyle.body.s.regular};
            transform: skewX(-15deg);
          }
        }
      }

      > .file.selected {
      }

      > .file.highlighted {
      }
    }

    > .stats {
      display: grid;
      grid-template-columns: 1fr min-content;
      grid-column-gap: 8px;
      grid-row-gap: 8px;
      > .control {
        grid-column: 1 / -1;

        > .indicator {
          display: inline-flex;
          transform: rotateX(0);
          transition: ${fragments.transition.regular('transform')};
          &.closed {
            transform: rotateX(180deg);
          }
        }
      }

      > .stats {
        height: calc-size(auto, size);
          transition: ${fragments.transition.regular('height')};
          &.closed {
            height: 0;
          }

        > .sample-rate, > .bit-depth, > .channels {
          display: grid;
          grid-template-columns: subgrid;
          grid-column: 1 / -1;

          > .title {
            ${fragments.textStyle.body.m.regular};
          }

          > .values {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: flex-end;

            > .value-group {
              display: flex;
              align-items: flex-start;
              justify-content: flex-end;
              gap: 4px;

              > .name {
                ${fragments.textStyle.body.s.regular};
              }

              > .value {
                display: flex;
                justify-content: flex-end;
                ${fragments.textStyle.body.s.regular};
                min-width: 1rem;
              }
            }
          }
        }
      }
    }
  }
`

const File: FC<
  HTMLProps<HTMLDivElement> & {
    file: KitAudio
    highlight: DrumKitContext['highlight']
    audioRef: RefObject<HTMLAudioElement | null>
    selectedFiles: DrumKitContext['selection']['selectedFiles']
    setSelection: DrumKitContext['selection']['setSelection']
    removeFile: DrumKitContext['files']['removeFile']
  }
> = memo(({ highlight, file, selectedFiles, setSelection, removeFile, audioRef, ...props }) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (highlight.highlight?.id === file.id && highlight.highlight?.source !== 'file-list' && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [highlight.highlight, file.id])
  return (
    <div
      ref={ref}
      className={cx(
        'file',
        selectedFiles.some((y) => y.id === file.id) && 'selected',
        highlight.highlight?.id === file.id && 'highlighted',
        file.type,
      )}
      onClick={() => {
        setSelection(file.id)
      }}
      onDragStart={() => {
        setSelection(file.id, { ctrl: true })
      }}
      onPointerEnter={() => {
        highlight.setHighlight({ id: file.id, source: 'file-list' })
      }}
      onPointerLeave={() => {
        if (file.id === highlight.highlight?.id) {
          highlight.setHighlight(undefined)
        }
      }}
      {...props}
    >
      <span className="index">{file.index.toString().padStart(3, '0')}</span>
      <span className="name">{file.type === 'present' ? file.name : 'removed'}</span>
      {file.type === 'present' && (
        <>
          <Button
            onClick={(evt) => {
              evt.stopPropagation()
              if (!audioRef.current || file.type !== 'present') {
                return
              }
              const blob = new Blob([file.bytes], { type: 'audio/wav' })
              audioRef.current.src = URL.createObjectURL(blob)
              audioRef.current.play()
            }}
          >
            &gt;
          </Button>

          <Button
            className="close"
            onClick={(evt) => {
              evt.stopPropagation()
              removeFile(file.id)
            }}
          >
            x
          </Button>
        </>
      )}
    </div>
  )
})

export const DrumKitFiles: FC<HTMLProps<HTMLDivElement> & { context: DrumKitContext }> = ({ className, context, ...props }) => {
  const {
    files: { files, meta, removeFile },
    highlight,
    selection: { setSelection, selectedFiles },
  } = context
  const audioRef = useRef<HTMLAudioElement>(null)
  const otherChannels = useMemo(() => Object.entries(meta.channel.other), [meta.channel.other])
  const [statsOpen, setStatsOpen] = useState(false)

  return (
    <div className={cx(drumKitFilesClass, className)} {...props}>
      <div className="content">
        <div className="title">Audio Files</div>
        <audio className="audio" aria-hidden ref={audioRef} />

        <div className="files">
          {files.map((x) => (
            <File
              key={x.id}
              file={x}
              highlight={highlight}
              audioRef={audioRef}
              selectedFiles={selectedFiles}
              setSelection={setSelection}
              removeFile={removeFile}
              draggable="true"
            />
          ))}
        </div>

        <div className="stats">
          <div onClick={() => setStatsOpen(!statsOpen)} className="control">
            <span className={cx('indicator', !statsOpen && 'closed')}>v</span> {statsOpen ? 'Hide Stats' : 'Show Stats'}
          </div>
          <div className={cx('stats', !statsOpen && 'closed')}>
            <div className="sample-rate">
              <div className="title">.sampleRate</div>
              <div className="values">
                <div className="value-group">
                  <span className="name">min</span> <span className="value">{meta.sampleRate.min}</span>
                </div>
                <div className="value-group">
                  <span className="name">max</span> <span className="value">{meta.sampleRate.max}</span>
                </div>
              </div>
            </div>
            <div className="bit-depth">
              <div className="title">.bitDepth</div>
              <div className="values">
                <div className="value-group">
                  <span className="name">min</span> <span className="value">{meta.bitDepth.min}</span>
                </div>
                <div className="value-group">
                  <span className="name">max</span> <span className="value">{meta.bitDepth.max}</span>
                </div>
              </div>
            </div>
            <div className="channels">
              <div className="title">.channels</div>
              <div className="values">
                <div className="value-group">
                  <span className="name">mono</span> <span className="value">{meta.channel.mono}</span>
                </div>
                <div className="value-group">
                  <span className="name">stereo</span> <span className="value">{meta.channel.stereo}</span>
                </div>
                {otherChannels.length > 0 && (
                  <div className="value-group">
                    <span className="name">other</span> <span className="value">{otherChannels.map((entry) => `${entry[0]}: ${entry[1]}`)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
