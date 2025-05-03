import { css, cx } from '@linaria/core'
import type { FC, HTMLProps } from 'react'
import { fragments } from '../../app/style/fragments'
import { style } from '../../app/style/style'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import type { DrumKitContext } from './DrumkitContext'

const userSettingsClass = css`
  flex: 1;
  display: grid;
  grid-template-columns: min-content auto;
  align-self: stretch;

  grid-column-gap: 120px;
  grid-row-gap: 5px;

  padding-bottom: 24px;
  border-bottom: 3px solid ${style.themeColors.text.default};

  > .title {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    > .value {
      ${fragments.textStyle.body.s.regular};
    }
  }

  > .name {
    grid-column: 1 / -1;
  }

  > .channel, > .mode {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  > .bit-depth, > .sample-rate, > .normalize, > .stride {
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    > .actions {
      display: flex;
      gap: 8px;
    }
  }
            
`

export const UserSettings: FC<HTMLProps<HTMLDivElement> & { context: DrumKitContext }> = ({ context, className, ...props }) => {
  const {
    config: {
      bitDepth,
      setBitDepth,
      changeBitDepth,
      channels,
      setChannels,
      sampleRate,
      setSampleRate,
      changeSampleRate,
      kitName,
      setKitName,
      stride,
      setStride,
      changeStride,
      normalize,
      setNormalize,
      current: { bitDepth: fileBitDepth, channels: fileChannels, sampleRate: fileSampleRate, stride: kitStride },
    },
  } = context

  return (
    <div className={cx(userSettingsClass, className)} {...props}>
      <Input placeholder="kit name" value={kitName} onChange={(evt) => setKitName(evt.currentTarget.value)} className="name" />

      <div className="title">
        <span className="name">.channel</span>
        <span className="value">{fileChannels}</span>
      </div>
      <div className="channel">
        <Button selected={channels === 'mono'} onClick={() => setChannels('mono')}>
          mono
        </Button>
        <Button selected={channels === 'stereo'} onClick={() => setChannels('stereo')}>
          stereo
        </Button>
        <Button selected={channels === 'auto'} onClick={() => setChannels('auto')}>
          auto
        </Button>
      </div>

      <div className="title">
        <span className="name">.stride</span>
        <span className="value">{kitStride}</span>
      </div>
      <div className="stride">
        <Button onClick={() => changeStride('increment')}>+</Button>
        <Button onClick={() => changeStride('decrement')}>-</Button>
        <Button selected={stride === 'auto'} onClick={() => setStride('auto')}>
          auto
        </Button>
      </div>

      <div className="title">
        <span className="name">.sampleRate</span>
        <span className="value">{fileSampleRate}</span>
      </div>
      <div className="sample-rate">
        <div className="actions">
          <Button onClick={() => changeSampleRate('increment')}>+</Button>
          <Button onClick={() => changeSampleRate('decrement')}>-</Button>
          <Button selected={sampleRate === 'auto'} onClick={() => setSampleRate('auto')}>
            auto
          </Button>
        </div>
      </div>

      <div className="title">
        <span className="name">.bitDepth</span>
        <span className="value">{fileBitDepth}</span>
      </div>
      <div className="bit-depth">
        <div className="actions">
          <Button onClick={() => changeBitDepth('increment')}>+</Button>
          <Button onClick={() => changeBitDepth('decrement')}>-</Button>
          <Button selected={bitDepth === 'auto'} onClick={() => setBitDepth('auto')}>
            auto
          </Button>
        </div>
      </div>

      <div className="title">.normalize</div>
      <div className="normalize">
        <Button selected={!normalize} onClick={() => setNormalize(false)}>
          no
        </Button>
        <Button selected={normalize} onClick={() => setNormalize(true)}>
          yes
        </Button>
      </div>
    </div>
  )
}
