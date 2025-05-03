import { useCallback, useEffect, useMemo, useState } from 'react'
import { WaveFile } from 'wavefile'
import { makeAudioMetaData } from './utils'

export type UUID = ReturnType<typeof window.crypto.randomUUID>
export type KitId = UUID & { __kitIdBrand: never }
const makeKitId = () => window.crypto.randomUUID() as KitId
const useKit = () => {
  const [kit, setKit] = useState<{ name: string; id: KitId; count: number }[]>([])

  const addKit = useCallback(() => {
    setKit((value) => [...value, { name: '?', id: makeKitId(), count: 1 }])
  }, [])
  const removeKit = useCallback((id: KitId) => {
    setKit((value) => value.filter((x) => x.id !== id))
  }, [])

  const setKitCount = useCallback(
    (id: KitId, count: number) => {
      if (count <= 0) {
        removeKit(id)
        return
      }
      setKit((value) => {
        const entry = value.find((x) => x.id === id)
        if (!entry) {
          return value
        }
        entry.count = count
        return [...value]
      })
    },
    [removeKit],
  )

  const setKitName = useCallback((id: KitId, name: string) => {
    setKit((value) => {
      const entry = value.find((x) => x.id === id)
      if (!entry) {
        return value
      }
      entry.name = name
      return [...value]
    })
  }, [])

  const count = useMemo(() => kit.map((x) => x.count).reduce((a, b) => a + b, 0), [kit])

  return {
    kit,
    count,
    addKit,
    removeKit,
    setKitCount,
    setKitName,
  }
}

export type KitAudioId = UUID & { __kitAudioIdBrand: never }
const makeKitAudioId = () => window.crypto.randomUUID() as KitAudioId
export interface KitAudio {
  id: KitAudioId
  name: string
  bytes: Uint8Array
  wav: WaveFile
}
const useKitAudio = () => {
  const [files, setAudioFiles] = useState<KitAudio[]>([])
  const addFile = useCallback((kitAudio: Omit<KitAudio, 'id'>) => {
    setAudioFiles((value) => [...value, { ...kitAudio, id: makeKitAudioId() }])
  }, [])
  const removeFile = useCallback((id: KitAudioId) => {
    setAudioFiles((value) => value.filter((x) => x.id !== id))
  }, [])

  const meta = useMemo(() => makeAudioMetaData(files.map((x) => x.wav).filter((x) => !!x)), [files])

  return {
    meta,
    files,
    addFile,
    removeFile,
  }
}

export const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export const octaves = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B'] as const
export type Note = (typeof notes)[number]
export type Octave = (typeof octaves)[number]
const noteName = (note: Note, octave: Octave) => (note.length > 1 ? (`${note}${octave}` as const) : (`${note}-${octave}` as const))

interface Slot {
  index: number
  note: Note
  octave: Octave
  name: ReturnType<typeof noteName>
}
const useSlots = (kit: ReturnType<typeof useKit>['kit'], kitAudio: ReturnType<typeof useKitAudio>['files']) => {
  const internalSlots = useMemo<
    {
      index: number
      note: Note
      octave: Octave
      name: ReturnType<typeof noteName>
    }[]
  >(() => {
    const slots: Slot[] = []
    for (const [y, octave] of octaves.entries()) {
      for (const [x, note] of notes.entries()) {
        const index = y * notes.length + x
        slots.push({
          index,
          note,
          octave,
          name: noteName(note, octave),
        })
      }
    }
    return slots
  }, [])

  const [fileAssignment, setFileAssigment] = useState<(KitAudioId | undefined)[]>(internalSlots.map(() => undefined))

  const slots = useMemo(
    () =>
      internalSlots.map((x, i) => {
        const index = kitAudio.findIndex((x) => x.id === fileAssignment[i])
        if (index < 0) {
          return {
            ...x,
            hint: { ...kit[i % kit.length] },
            file: undefined,
          }
        }

        return {
          ...x,
          file: { ...kitAudio[index], index },
          hint: { ...kit[i % kit.length] },
        }
      }),
    [internalSlots, kitAudio, kit, fileAssignment],
  )

  const assignFile = useCallback((id: KitAudioId | undefined, index: number) => {
    setFileAssigment((value) => {
      value[index] = id
      return [...value]
    })
  }, [])

  const meta = useMemo(() => makeAudioMetaData(slots.map((x) => x.file?.wav).filter((x) => !!x)), [slots])

  return {
    meta,
    slots,
    assignFile,
  }
}

const useDragHandler = (addFile: ReturnType<typeof useKitAudio>['addFile']) => {
  useEffect(() => {
    const dragHandler = (evt: DragEvent) => {
      evt.preventDefault()
    }
    const dropHandler = async (evt: DragEvent) => {
      evt.preventDefault()
      const files: Parameters<typeof addFile>[0][] = []
      for (const file of evt.dataTransfer?.files ?? []) {
        if (!file.name.toLowerCase().endsWith('.wav')) {
          continue
        }
        try {
          const bytes = new Uint8Array(await file.arrayBuffer())
          const wav = new WaveFile(bytes)
          files.push({
            name: file.name,
            bytes,
            wav,
          })
          console.log(wav.listCuePoints())
        } catch (e) {
          console.error(e)
        }
      }
      for (const file of files) {
        addFile(file)
      }
    }
    document?.addEventListener('drop', dropHandler)
    document?.addEventListener('dragover', dragHandler)
    return () => {
      document?.removeEventListener('drop', dropHandler)
      document?.removeEventListener('dragover', dragHandler)
    }
  }, [addFile])
}

const sampleRates = [8000, 44100, 48000, 96000, 192000] as const
export type SampleRate = (typeof sampleRates)[number]
const bitDepths = [8, 16, 24, 32] as const
export type BitDepth = (typeof bitDepths)[number]

const useUserConfig = (slots: ReturnType<typeof useSlots>, kit: ReturnType<typeof useKit>) => {
  const [bitDepth, setBitDepth] = useState<BitDepth | 'auto'>('auto')
  const [channels, setChannels] = useState<'mono' | 'stereo' | 'auto'>('auto')
  const [sampleRate, setSampleRate] = useState<SampleRate | 'auto'>('auto')
  const [kitName, setKitName] = useState<string>('')
  const [stride, setStride] = useState<number | 'auto'>('auto')
  const [normalize, setNormalize] = useState(true)

  const current = useMemo(() => {
    const usedChannels: 1 | 2 = channels === 'auto' ? (slots.meta.channel.stereo > 0 ? 2 : 1) : channels === 'stereo' ? 2 : 1
    // @TODO: poor fortifications against odd wav formats, can be certainly improved
    const usedBitDepth = bitDepth === 'auto' ? (slots.meta.bitDepth.max as BitDepth) : bitDepth
    const usedSampleRate = sampleRate === 'auto' ? (slots.meta.sampleRate.max as SampleRate) : sampleRate
    return {
      channels: usedChannels,
      bitDepth: usedBitDepth,
      sampleRate: usedSampleRate,
      stride: stride === 'auto' ? kit.count : stride,
      normalize,
      kitName,
    }
  }, [slots.meta, bitDepth, sampleRate, channels, normalize, kitName, stride, kit.count])

  const changeSampleRate = useCallback(
    (direction: 'increment' | 'decrement') => {
      const change = direction === 'increment' ? +1 : -1
      const index = sampleRates.findIndex((x) => x <= current.sampleRate)
      if (index < 0) {
        return
      }
      setSampleRate(sampleRates[Math.min(sampleRates.length, Math.max(0, index + change))])
    },
    [current],
  )
  const changeBitDepth = useCallback(
    (direction: 'increment' | 'decrement') => {
      const change = direction === 'increment' ? +1 : -1
      const index = bitDepths.findIndex((x) => x <= current.bitDepth)
      if (index < 0) {
        return
      }
      setBitDepth(bitDepths[Math.min(bitDepths.length, Math.max(0, index + change))])
    },
    [current],
  )
  const changeStride = useCallback(
    (direction: 'increment' | 'decrement') => {
      const change = direction === 'increment' ? +1 : -1
      setStride(current.stride + change)
    },
    [current],
  )

  return {
    current,
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
  }
}

const useHighlight = () => {
  const [highlight, setHighlight] = useState<KitAudioId>()

  return {
    highlight,
    setHighlight,
  }
}

export type DrumKitContext = ReturnType<typeof useDrumKit>

export const useDrumKit = () => {
  const kits = useKit()
  const files = useKitAudio()
  const slots = useSlots(kits.kit, files.files)
  const highlight = useHighlight()
  const config = useUserConfig(slots, kits)
  useDragHandler(files.addFile)

  const [selectedFile, setSelectedFile] = useState<KitAudioId>()

  return {
    kits,
    files,
    slots,
    highlight,
    selectedFile,
    setSelectedFile,
    config,
  }
}
