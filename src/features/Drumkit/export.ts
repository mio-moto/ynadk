import JSZip from 'jszip'
import type { DrumKitContext, KitAudioId, PresentKitAudio } from './DrumkitContext'

export interface KitConfiguration {
  files: Omit<PresentKitAudio, 'wav' | 'type'>[]
  // pure assignment, the rest can be recovered manually
  slots: (KitAudioId | undefined)[]
  kit: DrumKitContext['kits']['kit']
  config: Pick<DrumKitContext['config'], 'bitDepth' | 'channels' | 'sampleRate' | 'kitName' | 'stride' | 'normalize'>
}

const isExchangeConfigurationV1 = (exchangeConfiguration: KitExchangeConfiguration): exchangeConfiguration is KitExchangeConfigurationV1 =>
  !('version' in exchangeConfiguration)

interface KitExchangeConfigurationV1 {
  files: (Omit<PresentKitAudio, 'wav' | 'type' | 'bytes'> & { bytes: number[] })[]
  // pure assignment, the rest can be recovered manually
  slots: (KitAudioId | undefined)[]
  kit: DrumKitContext['kits']['kit']
  config: Pick<DrumKitContext['config'], 'bitDepth' | 'channels' | 'sampleRate' | 'kitName' | 'stride' | 'normalize'>
}

const isExchangeConfigurationV2 = (exchangeConfiguration: KitExchangeConfiguration): exchangeConfiguration is KitExchangeConfigurationV2 =>
  'version' in exchangeConfiguration && exchangeConfiguration.version === 'v2'

interface KitExchangeConfigurationV2 {
  version: 'v2'
  files: Omit<PresentKitAudio, 'wav' | 'type' | 'bytes'>[] // & { bytes: number[] })[]
  // pure assignment, the rest can be recovered manually
  slots: (KitAudioId | undefined)[]
  kit: DrumKitContext['kits']['kit']
  config: Pick<DrumKitContext['config'], 'bitDepth' | 'channels' | 'sampleRate' | 'kitName' | 'stride' | 'normalize'>
}

type KitExchangeConfiguration = KitExchangeConfigurationV1 | KitExchangeConfigurationV2

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

const importKitV2 = async (kit: KitExchangeConfigurationV2, zip: JSZip): Promise<ImportResult> => {
  const files = await Promise.all(
    kit.files.map(async (file) => {
      return zip.files[`wav/${file.id}`].async('uint8array')
    }),
  )

  return {
    type: 'import',
    success: true,
    kit: {
      ...kit,
      files: kit.files.map((x, i) => ({ ...x, bytes: files[i] })),
    },
  }
}

const importKit = async (blob: ArrayBuffer): Promise<ImportResult> => {
  const result = await JSZip.loadAsync(blob)
  const kitEntry = result.files['kit.ynadk']
  if (kitEntry) {
    const kit = JSON.parse(await kitEntry.async('text')) as KitExchangeConfiguration

    // v1 format stores the bytes inside the json
    if (isExchangeConfigurationV1(kit)) {
      return {
        type: 'import',
        success: true,
        kit: {
          ...kit,
          files: kit.files.map((x) => ({ ...x, bytes: new Uint8Array(x.bytes) })),
        },
      }
    }

    if (isExchangeConfigurationV2(kit)) {
      return importKitV2(kit, result)
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
    version: 'v2',
    ...kit,
    files: kit.files.map(({ bytes, ...x }) => x),
  } satisfies KitExchangeConfigurationV2)

  const zip = new JSZip()
  for (const file of kit.files) {
    zip.file(`wav/${file.id}`, file.bytes, { binary: true, createFolders: true })
  }
  zip.file('kit.ynadk', message, { binary: false })
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
