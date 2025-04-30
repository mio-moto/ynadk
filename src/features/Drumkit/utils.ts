import type { WaveFile } from 'wavefile'

export interface WaveFormat {
  numChannels: number
  sampleRate: number
  bitsPerSample: number
}

export const makeAudioMetaData = (audioFiles: WaveFile[]) => {
  if (audioFiles.length <= 0) {
    return {
      sampleRate: {
        min: 0,
        max: 0,
      },
      channel: {
        mono: 0,
        stereo: 0,
        other: {},
      },
      bitDepth: {
        min: 0,
        max: 0,
      },
    }
  }
  let minSampleRate = Number.MAX_SAFE_INTEGER
  let maxSampleRate = 0
  let monoChannel = 0
  let stereoChannel = 0
  const otherChannels: Record<number, number> = {}
  let minBitDepth = Number.MAX_SAFE_INTEGER
  let maxBitDepth = 0

  for (const audioFile of audioFiles) {
    const fmt = audioFile.fmt as WaveFormat
    minSampleRate = Math.min(minSampleRate, fmt.sampleRate)
    maxSampleRate = Math.max(maxSampleRate, fmt.sampleRate)
    switch (fmt.numChannels) {
      case 1:
        monoChannel += 1
        break
      case 2:
        stereoChannel += 1
        break
      default:
        otherChannels[fmt.numChannels] = (otherChannels[fmt.numChannels] ?? 0) + 1
    }
    minBitDepth = Math.min(minBitDepth, fmt.bitsPerSample)
    maxBitDepth = Math.max(maxBitDepth, fmt.bitsPerSample)
  }

  return {
    sampleRate: {
      min: minSampleRate,
      max: maxSampleRate,
    },
    channel: {
      mono: monoChannel,
      stereo: stereoChannel,
      other: otherChannels,
    },
    bitDepth: {
      min: minBitDepth,
      max: maxBitDepth,
    },
  }
}
