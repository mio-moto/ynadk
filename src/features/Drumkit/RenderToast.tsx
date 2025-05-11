import { type CSSProperties, css, cx } from '@linaria/core'
import { type FC, type HTMLProps, type MouseEventHandler, useCallback, useEffect, useState } from 'react'
import { fragments } from '../../app/style/fragments'
import { style } from '../../app/style/style'
import DownloadIcon from '../../assets/icons/place-item.svg'
import { Icon } from '../../components/Icon'
import type { DrumKitContext, ExportTask, ImportTask, RenderTask } from './DrumkitContext'
import type { RendererArgument, RendererEvent, RendererMessage } from './audioRenderer'
import WorkerRenderer from './audioRenderer?worker'
import { type ConversionArgument, type ConversionResult, kitToWorkerMessage } from './export'
import ImExportWorker from './export?worker'

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

const RenderTaskToast: FC<
  HTMLProps<HTMLDivElement> & { context: DrumKitContext; task: RenderTask; onCloseRequested?: MouseEventHandler<HTMLDivElement> }
> = ({ className, context, task, ...props }) => {
  const [status, setStatus] = useState<RendererMessage>()
  useEffect(() => {
    const worker: Omit<Worker, 'postMessage'> & { postMessage: (message: RendererArgument, options?: StructuredSerializeOptions) => void } =
      new WorkerRenderer()
    worker.onmessage = (ev: RendererEvent) => {
      setStatus(ev.data)
      if (ev.data.type === 'success') {
        downloadKit(ev.data.data, task.config.kitName)
      }
    }
    worker.postMessage({
      slots: task.binaries,
      config: task.config,
    })
    return () => worker.terminate()
  }, [task])

  return (
    <Toast className={cx(status?.type, className)} progress={inferProgress(status)} {...props}>
      {(() => {
        switch (status?.type) {
          case undefined:
          case 'update':
            return (
              <div className="message">
                Rendering <code>{task.config.kitName}.wav</code>
              </div>
            )
          case 'success':
            return (
              <div
                className="message clickable"
                onClick={() => {
                  if (status?.type !== 'success') {
                    return
                  }
                  downloadKit(status.data, task.config.kitName)
                }}
              >
                <Icon icon={DownloadIcon} /> Finished <code>{task.config.kitName}.wav</code>
              </div>
            )
          case 'error':
            return (
              <div className="message clickable">
                Error <code>{task.config.kitName}.wav</code>
              </div>
            )
        }
      })()}
    </Toast>
  )
}

const downloadExport = (file: Blob, name: string) => {
  const objectUrl = window.URL.createObjectURL(file)
  const link = document.createElement('a')
  link.setAttribute('href', objectUrl)
  link.setAttribute('download', `${name}.ynadk`)
  link.click()
  link.remove()
}

const ExportTaskToast: FC<
  HTMLProps<HTMLDivElement> & { context: DrumKitContext; task: ExportTask; onCloseRequested?: MouseEventHandler<HTMLDivElement> }
> = ({ className, context, task, ...props }) => {
  const [finished, setFinished] = useState<boolean>(false)
  useEffect(() => {
    const message = kitToWorkerMessage(task.context)
    const worker: Omit<Worker, 'postMessage'> & {
      postMessage: (message: ConversionArgument, options?: StructuredSerializeOptions) => void
    } = new ImExportWorker()
    worker.onmessage = (ev: MessageEvent<ConversionResult>) => {
      console.log(ev)
      if (ev.data.type === 'export') {
        downloadExport(ev.data.blob, task.context.config.current.kitName)
        setFinished(true)
      }
    }
    worker.postMessage(message)
    return () => worker.terminate()
  }, [task])

  return (
    <Toast progress={finished ? 100 : 0} {...props}>
      {finished ? 'Exported ' : 'Exporting '} <code>{task.context.config.current.kitName}.ynadk</code>
    </Toast>
  )
}

const ImportTaskToast: FC<HTMLProps<HTMLDivElement> & { context: DrumKitContext; task: ImportTask; onCloseRequested?: () => void }> = ({
  className,
  context,
  task,
  ...props
}) => {
  const [finished, setFinished] = useState<boolean>(false)
  useEffect(() => {
    const worker: Omit<Worker, 'postMessage'> & {
      postMessage: (message: ConversionArgument, options?: StructuredSerializeOptions) => void
    } = new ImExportWorker()
    worker.onmessage = (ev: MessageEvent<ConversionResult>) => {
      console.log(ev)
      if (ev.data.type === 'import' && ev.data.kit) {
        context.importKit(ev.data.kit)
        setFinished(true)
        props.onCloseRequested?.()
      }
    }
    worker.postMessage({
      type: 'import',
      blob: task.binary,
    })
    return () => worker.terminate()
  }, [task, context.importKit, props.onCloseRequested])

  return (
    <Toast progress={finished ? 100 : 0} {...props}>
      {finished ? 'Imported ' : 'Importing '} drumkit
    </Toast>
  )
}

const Toast: FC<HTMLProps<HTMLDivElement> & { onCloseRequested?: MouseEventHandler<HTMLDivElement>; progress: number }> = ({
  onCloseRequested,
  className,
  progress,
  children,
  ...props
}) => {
  return (
    <div className={cx('toast', className)} style={{ '--progress': `${progress}%` } as CSSProperties} {...props}>
      {children}
      <div className="close" onClick={onCloseRequested}>
        x
      </div>
    </div>
  )
}

export const RenderToast: FC<HTMLProps<HTMLDivElement> & { context: DrumKitContext }> = ({ className, context, ...props }) => {
  const [tasks, setTasks] = useState<(RenderTask | ExportTask | ImportTask)[]>([])
  const removeTask = useCallback((id: (RenderTask | ExportTask | ImportTask)['id']) => {
    setTasks((value) => value.filter((x) => x.id !== id))
  }, [])
  useEffect(() => {
    const handler = (task: RenderTask | ExportTask | ImportTask) => {
      console.log(task)
      setTasks((value) => [...value, task])
    }
    context.kitRenderer.eventBus.current.on('onNewTask', handler)
    context.kitRenderer.eventBus.current.on('onNewExport', handler)
    context.kitRenderer.eventBus.current.on('onNewImport', handler)
    return () => {
      context.kitRenderer.eventBus.current.off('onNewTask', handler)
      context.kitRenderer.eventBus.current.off('onNewExport', handler)
      context.kitRenderer.eventBus.current.off('onNewImport', handler)
    }
  }, [context.kitRenderer.eventBus.current])

  return (
    <div className={cx(className, renderToastClass)} {...props}>
      {tasks.map((x) => {
        switch (x.type) {
          case 'render':
            return <RenderTaskToast context={context} task={x} key={x.id} onCloseRequested={() => removeTask(x.id)} />
          case 'export':
            return <ExportTaskToast context={context} task={x} key={x.id} onCloseRequested={() => removeTask(x.id)} />
          case 'import':
            return <ImportTaskToast context={context} task={x} key={x.id} onCloseRequested={() => removeTask(x.id)} />
        }
      })}
    </div>
  )
}
