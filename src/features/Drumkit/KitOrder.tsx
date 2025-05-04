import { css, cx } from '@linaria/core'
import { type FC, Fragment, type HTMLProps } from 'react'
import { fragments } from '../../app/style/fragments'
import { style } from '../../app/style/style'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import type { DrumKitContext } from './DrumkitContext'

const kitOrderClass = css`
  display: flex;
  justify-content: flex-end;
  > .content {
    min-width: 160px;
    justify-self: flex-start;
    align-self: flex-start;
    display: grid;
    grid-template-columns: 1fr min-content min-content min-content;
    grid-column-gap: 4px;
    > .title {
      grid-row: 1;
      grid-column: 1 / -1;
      border-bottom: 2px solid ${style.themeColors.line.default};
    }
    > .kits {
      grid-row: 2;
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: subgrid;

      ${fragments.textStyle.body.m.regular};
      > .details {
        > .input {
          max-width: 1.5rem;
        }
      }
      > .multiplier {
        display: flex;
        align-items: center;
        ${fragments.textStyle.body.m.regular};
        color: ${style.colors.lime[400]};
      }
    }

    > .count {
      grid-row: 3;
      grid-column: 1;
      font-size: 16px;
      color: ${style.themeColors.text.disabled};
    }
    > .button {
      grid-row: 4;
      grid-column: 1/-1;
      
    }
  }
`
export const KitOrder: FC<HTMLProps<HTMLDivElement> & { context: DrumKitContext }> = ({ className, context, ...props }) => {
  const { kits } = context

  return (
    <div className={cx(kitOrderClass, className)} {...props}>
      <div className="content">
        <div className="title">Kit Order</div>
        <div className="kits">
          {kits.kit.map((x) => (
            <Fragment key={x.id}>
              <div className="details">
                <Input
                  className="input"
                  value={x.name}
                  onChange={(evt) => {
                    kits.setKitName(x.id, evt.currentTarget.value.toUpperCase())
                  }}
                  maxLength={4}
                />
              </div>
              <div className="multiplier">{x.count > 1 && `x${x.count}`}</div>
              <Button
                onClick={() => {
                  kits.setKitCount(x.id, x.count + 1)
                }}
              >
                +
              </Button>
              <Button
                onClick={() => {
                  kits.setKitCount(x.id, Math.max(0, x.count - 1))
                }}
              >
                {x.count <= 1 ? 'x' : '-'}
              </Button>
            </Fragment>
          ))}
        </div>

        <div className="count">size {kits.count}</div>

        <Button onClick={kits.addKit} className="button">
          Add kit
        </Button>
      </div>
    </div>
  )
}
