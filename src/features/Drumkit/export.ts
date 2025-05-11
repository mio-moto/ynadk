import JSZip from 'jszip'
import type { DrumKitContext, KitAudioId, PresentKitAudio } from './DrumkitContext'

export interface KitConfiguration {
  files: Omit<PresentKitAudio, 'wav' | 'type'>[]
  // pure assignment, the rest can be recovered manually
  slots: (KitAudioId | undefined)[]
  kit: DrumKitContext['kits']['kit']
  config: Pick<DrumKitContext['config'], 'bitDepth' | 'channels' | 'sampleRate' | 'kitName' | 'stride' | 'normalize'>
}

interface KitExchangeConfiguration {
  files: (Omit<PresentKitAudio, 'wav' | 'type' | 'bytes'> & { bytes: number[] })[]
  // pure assignment, the rest can be recovered manually
  slots: (KitAudioId | undefined)[]
  kit: DrumKitContext['kits']['kit']
  config: Pick<DrumKitContext['config'], 'bitDepth' | 'channels' | 'sampleRate' | 'kitName' | 'stride' | 'normalize'>
}

interface ExportArgument {
  type: 'export'
  kit: KitConfiguration
}

interface ImportArgument {
  type: 'import'
  blob: ArrayBuffer
}

export type ConversionArgument = ExportArgument | ImportArgument

interface ExportResult {
  type: 'export'
  blob: Blob
}

interface ExportProgressResult {
  type: 'export-progress'
  progress: number
}

type ImportResult = { type: 'import'; success: true; kit: KitConfiguration } | { type: 'import'; success: false; kit: undefined }
export type ConversionResult = ExportResult | ImportResult | ExportProgressResult

const typedPostMessage = (message: ConversionResult) => postMessage(message)
self.onmessage = (event: MessageEvent<ConversionArgument>) => {
  if (event.data.type === 'import') {
    importKit(event.data.blob).then((value) => typedPostMessage(value))
  }

  if (event.data.type === 'export') {
    exportKit(event.data.kit).then((value) => typedPostMessage(value))
  }
}

/**
 * This has to be done on the host side, wavefile and other properties cannot be cloned otherwise
 */
export const kitToWorkerMessage = (context: DrumKitContext): ExportArgument => {
  const slots = context.slots.slots.map((x) => x.file?.id)
  const emptySlots = slots.toReversed().findIndex((x) => !!x)
  // trim the array to the minimum of entries
  slots.length = slots.length - emptySlots

  const { bitDepth, channels, sampleRate, kitName, stride, normalize } = context.config

  return {
    type: 'export',
    kit: {
      files: context.files.files.filter((x) => x.type === 'present').map(({ wav, type, ...props }) => props),
      slots,
      kit: context.kits.kit,
      config: { bitDepth, channels, sampleRate, kitName, stride, normalize },
    },
  }
}

const importKit = async (blob: ArrayBuffer): Promise<ImportResult> => {
  const result = await JSZip.loadAsync(blob)
  const kitEntry = result.files['kit.ynadk']
  if (kitEntry) {
    const kit = JSON.parse(await kitEntry.async('text')) as KitExchangeConfiguration
    return {
      type: 'import',
      success: true,
      kit: {
        ...kit,
        files: kit.files.map((x) => ({ ...x, bytes: new Uint8Array(x.bytes) })),
      },
    }
  }
  return {
    type: 'import',
    success: false,
    kit: undefined,
  }
}

const exportKit = async (kit: KitConfiguration): Promise<ExportResult> => {
  const message = JSON.stringify({
    ...kit,
    files: kit.files.map((x) => ({ ...x, bytes: [...x.bytes] })),
  } satisfies KitExchangeConfiguration)

  const zip = new JSZip()
  zip.file('kit.ynadk', message)
  return {
    type: 'export',
    blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } }, (ev) => {
      typedPostMessage({
        type: 'export-progress',
        progress: ev.percent,
      })
    }),
  }
}
