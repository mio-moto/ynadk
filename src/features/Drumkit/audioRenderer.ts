import { WaveFile } from 'wavefile'
import type { BitDepth, DrumKitContext } from './DrumkitContext'
import type { WaveFormat } from './utils'

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

const cookSample = (wav: WaveFile, targetChannels: 1 | 2, targetBitDepth: BitDepth, targetSampleRate: number) => {
  const format = wav.fmt as WaveFormat
  if (format.bitsPerSample !== targetBitDepth) {
    wav.toBitDepth(targetBitDepth.toString())
  }
  if (format.sampleRate !== targetSampleRate) {
    wav.toSampleRate(targetSampleRate, { method: 'sinc' })
  }

  // interleaved audio files
  const samples = wav.getSamples(true, Float64Array)
  const audioFrames = samples.length / format.numChannels
  const cookedAudio = new Float64Array(audioFrames * targetChannels)
  const maxValue = samples.reduce((prev, curr) => Math.max(prev, Math.abs(curr)), 0)
  const factor = maxValueByBitDepth[targetBitDepth] / maxValue

  // go through all audio frames with each channel
  for (let i = 0; i < samples.length; i += format.numChannels) {
    const frame: number[] = []
    for (let ch = 0; ch < format.numChannels; ch += 1) {
      frame[ch] = samples[ch + i]
    }
    const idx = (i / format.numChannels) * targetChannels
    if (targetChannels === 1) {
      const value = mixStrategies.toMono(...frame)
      cookedAudio[idx] = value * factor
    } else if (targetChannels === 2) {
      const [left, right] = mixStrategies.toStereo(...frame)
      cookedAudio[idx] = left * factor
      cookedAudio[idx + 1] = right * factor
    }
  }
  return cookedAudio
}


const createEmptyFrame = (bitDepth: BitDepth, channels: number) => [...Array(channels).keys().map(_ => bitDepth === 8 ? 64 : 0)]
export const renderAudioKit = (currentContext: DrumKitContext) => {
  const {
    slots: { slots, meta },
    config: { sampleRate, channels, bitDepth },
  } = currentContext
  const usedChannels = channels === 'auto' ? (meta.channel.stereo > 0 ? 2 : 1) : channels === 'mono' ? 1 : 2
  const usedSampleRate = sampleRate === 'auto' ? meta.sampleRate.max : sampleRate
  const usedBitDepth = bitDepth === 'auto' ? (meta.bitDepth.max as BitDepth) : bitDepth
  const emptyFile = new WaveFile()
  emptyFile.fromScratch(usedChannels, usedSampleRate, usedBitDepth.toString(), createEmptyFrame(usedBitDepth, usedChannels))

  const lastIndex = slots.length - slots.toReversed().findIndex((x) => !!x.file)
  const collectedFiles = slots.map((x, i) => (i < lastIndex ? (x.file?.wav ?? emptyFile) : undefined)).filter((x) => !!x)

  const targetSamples = collectedFiles.map((x) => (cookSample(x, usedChannels, usedBitDepth, usedSampleRate)))
  const sampleLength = targetSamples.reduce((a, b) => a + (b?.length ?? 0), 0)
  const audioSamples = new Float64Array(sampleLength)
  let writtenLength = 0
  for (const sample of targetSamples) {
    if (sample === undefined) {
      continue
    }
    audioSamples.set(sample, writtenLength)
    writtenLength += sample.length
  }

  const result = new WaveFile()
  result.fromScratch(usedChannels, usedSampleRate, usedBitDepth.toString(), audioSamples)
  let lastCuePoint = 0
  for (const file of targetSamples) {
    const time = (file.length / usedSampleRate / usedChannels) * 1000
    result.setCuePoint({ position: lastCuePoint, end: null, label: 'atad' })
    lastCuePoint += time
  }
  return result
}
