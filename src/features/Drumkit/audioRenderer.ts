import { WaveFile } from 'wavefile'
import type { BitDepth, DrumKitContext } from './DrumkitContext'
import type { UserConfig } from './DrumkitContext'
import type { WaveFormat } from './utils'

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

const invSqrt2 = 1 / Math.sqrt(2)
const inv2Sqrt2 = 1 / (2 * Math.sqrt(2))
const half = 1 / 2

const mixStrategies = {
  toMono: (
    ...[
      frontLeft,
      frontRight,
      center,
      secondLeft,
      secondRight,
      backLeft,
      backRight,
      top,
      highFrontLeft,
      highFrontCenter,
      highFrontRight,
      highBackLeft,
      highBackRight,
      ..._rest
    ]: number[]
  ) => {
    if (frontRight === undefined) {
      return frontLeft
    }
    let value = frontLeft * invSqrt2 + frontRight * invSqrt2
    if (center === undefined) {
      return value
    }
    value += center
    if (secondLeft === undefined) {
      return value
    }
    value += secondLeft / 2 + secondRight / 2
    if (backLeft === undefined) {
      return value
    }
    value += backLeft * half + backRight * half
    if (top === undefined) {
      return value
    }
    value += top
    if (highFrontLeft === undefined) {
      return value
    }
    value += highFrontLeft * half + highFrontCenter + highFrontRight * half
    if (highBackLeft === undefined) {
      return value
    }
    return value + highBackLeft * inv2Sqrt2 + highBackRight * inv2Sqrt2
  },
  toStereo: (
    ...[
      frontLeft,
      frontRight,
      center,
      secondLeft,
      secondRight,
      backLeft,
      backRight,
      top,
      highFrontLeft,
      highFrontCenter,
      highFrontRight,
      highBackLeft,
      highBackRight,
      ..._rest
    ]: number[]
  ): [number, number] => {
    if (frontRight === undefined) {
      return [frontLeft, frontLeft]
    }
    if (center === undefined) {
      return [frontLeft, frontRight]
    }
    let left = frontLeft + center * invSqrt2
    let right = frontRight + center * invSqrt2
    if (secondLeft === undefined) {
      return [left, right]
    }
    left += secondLeft * invSqrt2
    right += secondRight * invSqrt2
    if (backLeft === undefined) {
      return [left, right]
    }
    left += backLeft * invSqrt2
    right += backRight * invSqrt2
    if (top === undefined) {
      return [left, right]
    }
    left += top * invSqrt2
    right += top * invSqrt2
    if (highFrontLeft === undefined) {
      return [left, right]
    }
    left += highFrontLeft * invSqrt2 + highFrontCenter * half
    right += highFrontRight * invSqrt2 + highFrontCenter * half
    if (highBackLeft) {
      return [left, right]
    }
    return [left + highBackLeft * half, right + highBackRight * half]
  },
}

const maxValueByBitDepth: Record<BitDepth, number> = {
  8: 255,
  16: 32768,
  24: 8388608,
  32: 2147483648,
}

const cookSample = (wav: WaveFile, targetChannels: 1 | 2, targetBitDepth: BitDepth, targetSampleRate: number, normalize: boolean) => {
  if ((wav.fmt as WaveFormat).bitsPerSample !== targetBitDepth) {
    wav.toBitDepth(targetBitDepth.toString())
  }
  if ((wav.fmt as WaveFormat).sampleRate !== targetSampleRate) {
    wav.toSampleRate(targetSampleRate, { method: 'sinc' })
  }

  // the library mutates the fmt object
  const { numChannels } = wav.fmt as WaveFormat

  // interleaved audio files
  const samples = wav.getSamples(true, Float64Array)
  const audioFrames = samples.length / numChannels
  const cookedAudio = new Float64Array(audioFrames * targetChannels)
  const maxValue = samples.reduce((prev, curr) => Math.max(prev, Math.abs(curr)), 0)
  const factor = normalize ? 1 : maxValueByBitDepth[targetBitDepth] / maxValue

  // go through all audio frames with each channel
  for (let i = 0; i < samples.length; i += numChannels) {
    const frame: number[] = []
    for (let ch = 0; ch < numChannels; ch += 1) {
      frame[ch] = samples[ch + i]
    }
    const idx = (i / numChannels) * targetChannels
    if (targetChannels === 1) {
      const value = mixStrategies.toMono(...frame)
      cookedAudio[idx] = value * factor
    } else if (targetChannels === 2) {
      const [left, right] = mixStrategies.toStereo(...frame)
      cookedAudio[idx] = left * factor
      cookedAudio[idx + 1] = right * factor
    }
  }
  return [cookedAudio, calculateSampleDuration(wav)] satisfies [Float64Array<ArrayBuffer>, number]
}

const createEmptyFrame = (bitDepth: BitDepth, channels: number) => [
  ...Array(channels)
    .keys()
    .map((_) => (bitDepth === 8 ? 64 : 0)),
]

const calculateSampleDuration = (file: WaveFile) => {
  const format = file.fmt as WaveFormat
  return file.chunkSize / format.numChannels / format.sampleRate / (format.bitsPerSample / 8)
}

const collectFile = (file: WaveFile | undefined, index: number, lastIndex: number, emptyFile: WaveFile) => {
  if (index > lastIndex) {
    return undefined
  }
  if (!file) {
    return emptyFile
  }
  return file
}
export const renderAudioKit = (
  slots: (WaveFile | undefined)[],
  currentConfig: DrumKitContext['config']['current'],
  onUpdate: (message: RendererMessage) => void,
) => {
  onUpdate({ type: 'update', progress: 0 })
  const { channels, bitDepth, sampleRate } = currentConfig
  const emptyFile = new WaveFile()
  emptyFile.fromScratch(channels, sampleRate, bitDepth.toString(), createEmptyFrame(bitDepth, channels))

  const lastIndex = slots.length - slots.toReversed().findIndex((x) => !!x)
  const collectedFiles = slots.map((x, i) => collectFile(x, i, lastIndex, emptyFile)).filter((x) => !!x)

  onUpdate({ type: 'update', progress: 1 })
  const targetSamples: [Float64Array<ArrayBuffer>, number][] = []
  for (const [index, sample] of collectedFiles.entries()) {
    targetSamples.push(cookSample(sample, channels, bitDepth, sampleRate, currentConfig.normalize))
    // goes till 97%
    onUpdate({ type: 'update', progress: 1 + 89 * (index / (collectedFiles.length - 1)) })
  }
  const sampleLength = targetSamples.reduce((a, [b]) => a + (b?.length ?? 0), 0)
  const audioSamples = new Float64Array(sampleLength)
  let writtenLength = 0
  for (const [index, [sample]] of targetSamples.entries()) {
    if (sample === undefined) {
      continue
    }
    audioSamples.set(sample, writtenLength)
    writtenLength += sample.length
    // goes till 99%
    onUpdate({ type: 'update', progress: 97 + 2 * (index / (targetSamples.length - 1)) })
  }
  const result = new WaveFile()
  result.fromScratch(channels, sampleRate, bitDepth.toString(), audioSamples)
  let lastCuePoint = 0
  for (const [_file, duration] of targetSamples) {
    const time = duration * 1000
    result.setCuePoint({ position: lastCuePoint, end: null })
    lastCuePoint += time
  }
  result.toRIFF()
  return result
}
