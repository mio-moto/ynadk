import { WaveFile } from 'wavefile'
import type { UserConfig } from './DrumkitContext'
import { renderAudioKit } from './audioRenderer'

interface UpdateMessage {
  type: 'update'
  progress: number
}
interface SuccessMessage {
  type: 'success'
  data: Blob
}
interface ErrorMessage {
  type: 'error'
  reason: string
}

export type RendererMessage = UpdateMessage | SuccessMessage | ErrorMessage
export type RendererEvent = MessageEvent<RendererMessage>
export interface RendererArgument {
  slots: (Uint8Array<ArrayBufferLike> | undefined)[]
  config: UserConfig
}

const typedPostMessage = (message: RendererMessage) => postMessage(message)
self.onmessage = (event: MessageEvent<RendererArgument>) => {
  const files = event.data.slots.map((x) => (x ? new WaveFile(x) : undefined))
  const result = renderAudioKit(files, event.data.config, (message) => postMessage(message))
  const buffer = result.toBuffer()
  const content = new Blob([buffer], { type: 'audio/wav' })
  typedPostMessage({ type: 'success', data: content })
}
