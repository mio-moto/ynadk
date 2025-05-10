import { type CSSProperties, css, cx } from '@linaria/core'
import { type FC, type HTMLProps, useCallback, useEffect, useState } from 'react'
import { fragments } from '../../app/style/fragments'
import { style } from '../../app/style/style'
import DownloadIcon from '../../assets/icons/place-item.svg'
import { Icon } from '../../components/Icon'
import type { DrumKitContext, RenderTask, RenderTaskId } from './DrumkitContext'
import type { RendererArgument, RendererEvent, RendererMessage } from './webworker'
import WorkerRenderer from './webworker?worker'

const renderToastClass = css`
  isolation: isolate;
  position: fixed;
  display: flex;
  flex-direction: column;
  top: 8px;
  left: 8px;
  gap: 8px;

  > .toast {
    --line-color: ${style.themeColors.line.default};
    position: relative;
    display: flex;
    align-items: center;
    min-width: 200px;
    width: 250px;
    padding: 12px 24px 12px 12px;
    background-color: ${style.themeColors.background.default};
    outline: 1px solid var(--line-color);

    > .close {
      cursor: pointer;
      position: absolute;
      top: 0;
      right: 6px;
      ${fragments.textStyle.body.s.regular};
      transition: ${fragments.transition.regular('color')};
      &:hover {
        color: ${style.themeColors.text.secondary};
      }
    }

    > .message {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      flex-flow: wrap;
    }

    &.success {
      --line-color: ${style.colors.lime.primary};
      cursor: pointer;
      transition: ${fragments.transition.regular('background-color')};
      &:hover {
        background-color: ${style.themeColors.background.defaultHover};
      }
    }

    &::after {
      position: absolute;
      display: block;
      content: " ";
      bottom: 0;
      left: 0;
      height: 3px;
      width: var(--progress);
      background-color: var(--line-color);
      transition: ${fragments.transition.regular('width')}, ${fragments.transition.regular('background-color')};
    }

    &.error::after {
      --line-color: ${style.themeColors.text.secondary};
    }
  }
`

const inferProgress = (status: RendererMessage | undefined) => {
  if (!status) {
    return 0
  }
  if (status.type === 'error' || status.type === 'success') {
    return 100
  }
  return status.progress
}

const downloadKit = (file: Blob, name: string) => {
  const objectUrl = window.URL.createObjectURL(file)
  const link = document.createElement('a')
  link.setAttribute('href', objectUrl)
  link.setAttribute('download', `${name}.wav`)
  link.click()
  link.remove()
}

export const RenderToast: FC<HTMLProps<HTMLDivElement> & { context: DrumKitContext }> = ({ className, context, ...props }) => {
  const [tasks, setTasks] = useState<(RenderTask & { status?: RendererMessage })[]>([])
  const updateTask = useCallback((id: RenderTaskId, status: RendererMessage) => {
    setTasks((entries) => {
      const entry = entries.find((x) => x.id === id)
      if (entry) {
        entry.status = status
        return [...entries]
      }
      return entries
    })
  }, [])
  useEffect(() => {
    const handler = (task: RenderTask) => {
      const worker: Omit<Worker, 'postMessage'> & { postMessage: (message: RendererArgument, options?: StructuredSerializeOptions) => void } =
        new WorkerRenderer()
      worker.onmessage = (ev: RendererEvent) => {
        updateTask(task.id, ev.data)
        if (ev.data.type === 'success') {
          downloadKit(ev.data.data, task.config.kitName)
        }
      }
      worker.postMessage({
        slots: task.binaries,
        config: task.config,
      })
      setTasks((value) => [...value, task])
    }
    context.kitRenderer.eventBus.current.on('onNewTask', handler)
    return () => context.kitRenderer.eventBus.current.off('onNewTask', handler)
  }, [context.kitRenderer.eventBus.current, updateTask])
  return (
    <div className={cx(className, renderToastClass)} {...props}>
      {tasks.map((x) => (
        <div className={cx('toast', x.status?.type)} key={x.id} style={{ '--progress': `${inferProgress(x.status)}%` } as CSSProperties}>
          {(() => {
            switch (x.status?.type) {
              case undefined:
              case 'update':
                return (
                  <div className="message">
                    Rendering <code>{x.config.kitName}.wav</code>
                  </div>
                )
              case 'success':
                return (
                  <div
                    className="message clickable"
                    onClick={() => {
                      if (x.status?.type !== 'success') {
                        return
                      }
                      downloadKit(x.status.data, x.config.kitName)
                    }}
                  >
                    <Icon icon={DownloadIcon} /> Finished <code>{x.config.kitName}.wav</code>
                  </div>
                )
              case 'error':
                return (
                  <div className="message clickable">
                    Error <code>{x.config.kitName}.wav</code>
                  </div>
                )
            }
          })()}
          <div className="close" onClick={() => setTasks((tasks) => tasks.filter((task) => task.id !== x.id))}>
            x
          </div>
        </div>
      ))}
    </div>
  )
}
