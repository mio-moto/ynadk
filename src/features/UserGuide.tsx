import { css, cx } from '@linaria/core'
import { type FC, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { style } from '../app/style/style'
import { themeColors } from '../app/style/themeColors'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'

import ChainTspImage from '../assets/chain-tsp.png'
import ExternalLinkIcon from '../assets/icons/open-in-new.svg'
import StrideImage from '../assets/stride.png'
import { Icon } from '../components/Icon'

const userGuideClass = css`
  border: 4px solid ${style.themeColors.line.default};
  position: fixed;
  max-width: 950px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px;
  display: none;
  &.open {
    display: flex;
  }

  > .close {
    position: absolute;
    top: 0;
    right: 0;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  & code {

  }

  .content {
    margin: 30px 0 0 8px;
    padding: 24px 24px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;

    > p, > div {
      code {
        border: 1px solid ${style.themeColors.line.default};
        padding: 0 4px;
        color: ${themeColors.text.important};
      }

      > * {
        padding-top: 4px;
        padding-bottom: 4px;
      }

      > .title {
        color: ${themeColors.text.secondary};
      }

      > h3 {
        color: ${themeColors.text.important};
      }

      > div {
        vertical-align: bottom;
        .icon {
          margin-bottom: -2px;
        }
      }

      > .gallery {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        max-width: 100%;
        border: 1px solid ${style.themeColors.line.default};
        gap: 8px;

        > img {
          flex: 1 1 0;
          max-width: 100%;
          min-width: 0%;
        }
      }
    }
  }
`

const skipUserGuide = () => localStorage.getItem('skip-user-guide') === 'true'

export const UserGuide: FC<{ forceOpen?: boolean; onClose?: () => void }> = ({ forceOpen, onClose }) => {
  const [internalOpen, setInternalOpen] = useState(!skipUserGuide())
  const ref = useRef<HTMLDialogElement>(null)
  const closeUserGuide = useCallback(() => {
    ref.current?.close()
    localStorage.setItem('skip-user-guide', 'true')
    setInternalOpen(false)
    onClose?.()
  }, [onClose])

  useEffect(() => {
    if (!skipUserGuide() || forceOpen) {
      ref.current?.showModal()
    }
  }, [forceOpen])

  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener('close', closeUserGuide)
      return () => ref.current?.removeEventListener('close', closeUserGuide)
    }
  }, [closeUserGuide])

  const open = forceOpen || internalOpen

  return (
    <Modal ref={ref} className={cx(userGuideClass, open && 'open')} closedby="any">
      <div className="close" onClick={closeUserGuide}>
        x
      </div>
      <div className="content">
        <p>
          This is <code className="title">You Need A Drum Kit</code>, a sample compiler focused for the M8 Tracker. The primary purpose is to combine
          a sound font, a drum kit or sound kit into a single <code>wav</code> file with the cue points being set for you, easing the process of
          creating a sliced sample that can be used with devices that support it.
        </p>

        <p>
          <h3>Ok, and now?</h3>
          The process is quick and easy:
          <ul>
            <li>
              Drag and drop some <code>wav</code> samples into this window
            </li>
            <li>Click a sample and assign them to the slots in the center</li>
            <li>
              Click <code>render</code> and receive your compiled <code>wav</code> file
            </li>
            <li>
              Place the file on your tracker and select <code>01 File</code> playback mode
            </li>
          </ul>
          That's it, you can now play the samples by the corresponding note you assigned that sample as slot to. Bonus points if you're using the
          arpeggiator to randomize your drum patterns.
        </p>

        <div>
          <h3>What's stride?</h3>
          You can configure the <span className="emphasis">layout</span> of your kit on the right kit menu. This allows you to assign the same kind of
          instrument, for example:
          <p>
            <code>Kick x2</code> <code>Hi-Hat x2</code> <code>Ride x2</code> <code>Tom Tom x2</code> <code>Conga</code> <code>Clap x2</code>{' '}
            <code>Shake</code> (total of 12 Samples per kit)
          </p>
          This allows you to configure that kit and then assign your samples to the pre-configured slots. If you use the M8 Tracker, you can then
          create a chain with your drum loop and use the <code>TSP</code> inside a chain to swap out drum kit with the same beat structure.
          <div className="gallery">
            <img src={StrideImage} />
            <img src={ChainTspImage} />
          </div>
        </div>

        <p>
          <h3>Help? Problems? Code? License?!</h3>
          <div>
            Why yes, glad you asked. The code is{' '}
            <a href="https://github.com/mio-moto/ynadk">
              available on Github
              <Icon icon={ExternalLinkIcon} className="icon" />
            </a>
            , which has a handy issue tracker. If you find any problems, need any clarification or otherwise, you can{' '}
            <a href="https://github.com/mio-moto/ynadk/issues/new">
              submit a new issue
              <Icon icon={ExternalLinkIcon} className="icon" />
            </a>
            .
          </div>
          <div>
            The project is{' '}
            <a href="https://www.tldrlegal.com/license/mit-license">
              MIT licensed
              <Icon icon={ExternalLinkIcon} className="icon" />
            </a>
            , the license of the compiled <code>wav</code> file is inherited by the licenses of the samples used and this project sets no limitations
            on that.
          </div>
        </p>
      </div>

      <Button onClick={closeUserGuide} className="button">
        Let's go
      </Button>
    </Modal>
  )
}
