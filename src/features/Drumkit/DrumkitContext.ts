import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WaveFile } from 'wavefile'
import { createEventBus } from '../../utils/events'
import type { KitConfiguration } from './export'
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
    setKit,
    removeKit,
    setKitCount,
    setKitName,
  }
}

export type KitAudioId = UUID & { __kitAudioIdBrand: never }
const makeKitAudioId = () => window.crypto.randomUUID() as KitAudioId
export type KitAudio = PresentKitAudio | RemovedKitAudio
export interface PresentKitAudio {
  type: 'present'
  id: KitAudioId
  index: number
  name: string
  bytes: Uint8Array
  wav: WaveFile
}
export interface RemovedKitAudio {
  type: 'removed'
  id: KitAudioId
  index: number
}
const useKitAudio = () => {
  const [files, setAudioFiles] = useState<KitAudio[]>([])
  const addFile = useCallback((kitAudio: Omit<PresentKitAudio, 'id' | 'type'>) => {
    setAudioFiles((value) => [...value, { ...kitAudio, id: makeKitAudioId(), type: 'present' }])
  }, [])
  const removeFile = useCallback((id: KitAudioId) => {
    setAudioFiles((value) => value.map((x) => (x?.id === id ? { type: 'removed', id: x.id, index: x.index } : x)))
  }, [])

  const meta = useMemo(() => makeAudioMetaData(files.filter((x) => x.type === 'present').map((x) => x.wav)), [files])

  return {
    meta,
    files,
    addFile,
    setAudioFiles,
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

  const [fileAssignment, setFileAssignment] = useState<(KitAudioId | undefined)[]>(internalSlots.map(() => undefined))

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
          file: { ...kitAudio[index] },
          hint: { ...kit[i % kit.length] },
        }
      }),
    [internalSlots, kitAudio, kit, fileAssignment],
  )

  const assignFile = useCallback(
    (id: KitAudioId | undefined, index: number) => {
      setFileAssignment((value) => {
        if (slots.length <= index) {
          return value
        }
        value[index] = id
        return [...value]
      })
    },
    [slots.length],
  )

  const meta = useMemo(() => {
    const waves = slots
      .map((x) => x.file)
      .filter((x) => x?.type === 'present')
      .map((x) => x.wav)
    return makeAudioMetaData(waves)
  }, [slots])

  return {
    meta,
    slots,
    assignFile,
    setFileAssignment,
  }
}

const useDragHandler = (addFile: ReturnType<typeof useKitAudio>['addFile'], importHandler: (binary: ArrayBuffer) => void) => {
  const [isDropping, setIsDropping] = useState(false)
  useEffect(() => {
    const dragHandler = (evt: DragEvent) => {
      if (!evt.dataTransfer?.types.includes('Files')) {
        return
      }
      evt.preventDefault()

      setIsDropping((value) => {
        if (!value) {
          return true
        }
        return value
      })
    }
    const dropHandler = async (evt: DragEvent) => {
      evt.preventDefault()
      setIsDropping(false)
      const files: Parameters<typeof addFile>[0][] = []
      let lastIndex = files.at(-1)?.index ?? 1
      const draggedFiles = [...(evt.dataTransfer?.files ?? [])]
      const importFile = draggedFiles.find((x) => x.name.toLowerCase().endsWith('.ynadk'))
      if (importFile) {
        importHandler(await importFile.arrayBuffer())
        return
      }
      const droppedFiles = draggedFiles.filter((x) => x.name.toLowerCase().endsWith('wav')).toSorted((a, b) => (a.name > b.name ? 1 : -1))
      for (const file of droppedFiles) {
        if (!file.name.toLowerCase().endsWith('.wav')) {
          continue
        }
        try {
          const bytes = new Uint8Array(await file.arrayBuffer())
          const wav = new WaveFile(bytes)
          files.push({
            name: file.name,
            index: lastIndex,
            bytes,
            wav,
          })
          lastIndex += 1
        } catch (e) {
          console.error(e)
        }
      }
      for (const file of files) {
        addFile(file)
      }
    }
    const dragEndHandler = () => {
      setIsDropping(false)
    }
    document?.addEventListener('drop', dropHandler)
    document?.addEventListener('dragover', dragHandler)
    document?.addEventListener('dragend', dragEndHandler)
    document?.addEventListener('dragleave', dragEndHandler)
    return () => {
      document?.removeEventListener('drop', dropHandler)
      document?.removeEventListener('dragover', dragHandler)
      document?.removeEventListener('dragend', dragEndHandler)
      document?.removeEventListener('dragleave', dragEndHandler)
    }
  }, [addFile, importHandler])

  return {
    isDropping,
  }
}

const sampleRates = [8000, 44100, 48000, 96000, 192000] as const
export type SampleRate = (typeof sampleRates)[number]
const bitDepths = [8, 16, 24, 32] as const
export type BitDepth = (typeof bitDepths)[number]
export type UserConfig = ReturnType<typeof useUserConfig>['current']

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
      kitName: kitName.length <= 0 ? 'kit' : kitName,
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
  const [highlight, setHighlight] = useState<{ id?: KitAudioId; source: string }>()

  return {
    highlight,
    setHighlight,
  }
}

export type DrumKitContext = ReturnType<typeof useDrumKit>

export const useSelection = (kitAudio: ReturnType<typeof useKitAudio>) => {
  const [selectedFiles, setSelectedFiles] = useState<KitAudioId[]>([])

  const modifiers = useRef({
    shift: false,
    alt: false,
    ctrl: false,
    meta: false,
  })
  // tracks changes in modifiers
  useEffect(() => {
    const listener = (ev: KeyboardEvent | MouseEvent) => {
      modifiers.current = {
        shift: ev.shiftKey,
        alt: ev.altKey,
        ctrl: ev.ctrlKey,
        meta: ev.metaKey,
      }
    }
    document.addEventListener('keydown', listener)
    document.addEventListener('keyup', listener)
    document.addEventListener('mousemove', listener)
    return () => {
      document.removeEventListener('keydown', listener)
      document.removeEventListener('keyup', listener)
      document.removeEventListener('mousemove', listener)
    }
  }, [])

  // for now I'm inclined to only do additive range selections and singular selections invert the selected element
  // this keeps the selection range much easier to maintain
  // important: keep the last selected / clicked file as last entry
  // alt and ctrl are handled all the same right now - alt is more uncommon, but sometimes useful for macs
  // windows considers shift-selection after a ctrl selection to just select the shift selection, but idc, fight me.
  // windows considers ctrl + shift selection to keep the prior selection, and I still don't really care
  // shift > ctrl > click
  // - shift: select range from the last selection (additive only)
  // - ctrl: (or alt) add individual selection of file
  // - click: just selection, clears multi-selection out
  const setSelection = useCallback(
    (id: KitAudioId, overrides?: Partial<{ shift: boolean; alt: boolean; ctrl: boolean; meta: boolean }>) => {
      const mods = { ...modifiers.current, ...overrides }
      // no modifiers is just additive
      if (!Object.values(mods).some((x) => x)) {
        // clicking the same file with _one_ selection unselects all
        // if multiple files are clicked and a user clicks one file, then only one file is clicked
        // clicking again clears the selection
        if (selectedFiles.length === 1 && selectedFiles[0] === id) {
          setSelectedFiles([])
          return
        }
        // otherwise just that one file is selected
        setSelectedFiles([id])
        return
      }

      if (mods.shift) {
        const lastSelectedFile = selectedFiles?.at(-1)
        // no prior selection, only set that one that's been clicked
        if (!lastSelectedFile || lastSelectedFile === id) {
          setSelectedFiles([id])
          return
        }
        const lastIndex = kitAudio.files.findIndex((x) => x.id === lastSelectedFile)
        const currentIndex = kitAudio.files.findIndex((x) => x.id === id)
        // one of them not found (unlikely) or clicked the same entry
        if (lastIndex < 0 || currentIndex < 0) {
          return
        }
        let elements: KitAudioId[]
        if (currentIndex < lastIndex) {
          // without the last element to avoid duplicates - it's in the selection already
          elements = kitAudio.files
            .slice(currentIndex, lastIndex)
            .toReversed()
            .map((x) => x.id)
        } else {
          // without the first element to avoid duplicates - it's in the selection already
          elements = kitAudio.files.slice(lastIndex + 1, currentIndex + 1).map((x) => x.id)
        }
        setSelectedFiles((value) => [...value, ...elements])
        return
      }
      // now only ctrl/alt clicking is left
      // if the element is selected, unselect it
      if (selectedFiles.includes(id)) {
        setSelectedFiles(selectedFiles.filter((x) => x !== id))
        return
      }
      // otherwise add it to the selection
      setSelectedFiles([...selectedFiles, id])
    },
    [kitAudio.files, selectedFiles],
  )

  const clearSelection = useCallback(() => setSelectedFiles([]), [])

  // ordering by their indices of the files
  const files = useMemo(
    () =>
      selectedFiles
        .map((x) => kitAudio.files.find((y) => y.id === x))
        .filter((x) => !!x)
        .sort((a, b) => a.index - b.index),
    [kitAudio.files, selectedFiles],
  )

  return {
    selectedFiles: files,
    setSelection,
    clearSelection,
    modifiers,
  }
}

export type RenderTaskId = UUID & { __renderTaskUuid: never }
export interface RenderTask {
  id: RenderTaskId
  type: 'render'
  binaries: (Uint8Array<ArrayBufferLike> | undefined)[]
  config: ReturnType<typeof useUserConfig>['current']
}

export type ExportTaskId = UUID & { __exportTaskUuid: never }
export interface ExportTask {
  id: ExportTaskId
  type: 'export'
  context: DrumKitContext
}

export type ImportTaskId = UUID & { __importTaskUuid: never }
export interface ImportTask {
  id: ImportTaskId
  type: 'import'
  binary: ArrayBuffer
}

const useKitRenderer = () => {
  const bus = useRef(
    createEventBus<{
      onNewTask: (task: RenderTask) => void
      onNewExport: (task: ExportTask) => void
      onNewImport: (task: ImportTask) => void
    }>(),
  )

  const createNewTask = useCallback((slots: ReturnType<typeof useSlots>['slots'], config: ReturnType<typeof useUserConfig>['current']) => {
    const binaries = slots.map((x) => (x.file?.type === 'present' ? x.file.bytes : undefined))
    bus.current.emit('onNewTask', { type: 'render', id: crypto.randomUUID() as RenderTaskId, binaries, config })
  }, [])

  const createNewExport = useCallback((context: DrumKitContext) => {
    bus.current.emit('onNewExport', { type: 'export', id: crypto.randomUUID() as ExportTaskId, context })
  }, [])

  const createNewImport = useCallback((binary: ArrayBuffer) => {
    bus.current.emit('onNewImport', { type: 'import', id: crypto.randomUUID() as ImportTaskId, binary })
  }, [])

  return {
    eventBus: bus,
    createNewTask,
    createNewExport,
    createNewImport,
  }
}

export const useDrumKit = () => {
  const kits = useKit()
  const files = useKitAudio()
  const slots = useSlots(kits.kit, files.files)
  const highlight = useHighlight()
  const config = useUserConfig(slots, kits)
  const kitRenderer = useKitRenderer()
  const fileDropping = useDragHandler(files.addFile, kitRenderer.createNewImport)
  const selection = useSelection(files)

  const importKit = useCallback(
    (kit: KitConfiguration) => {
      kits.setKit(kit.kit)
      files.setAudioFiles(kit.files.map((x) => ({ ...x, type: 'present', wav: new WaveFile(x.bytes) })))
      slots.setFileAssignment(kit.slots)
      config.setBitDepth(kit.config.bitDepth)
      config.setChannels(kit.config.channels)
      config.setKitName(kit.config.kitName)
      config.setNormalize(kit.config.normalize)
      config.setSampleRate(kit.config.sampleRate)
      config.setStride(kit.config.stride)
    },
    [
      kits.setKit,
      files.setAudioFiles,
      slots.setFileAssignment,
      config.setBitDepth,
      config.setChannels,
      config.setKitName,
      config.setNormalize,
      config.setSampleRate,
      config.setStride,
    ],
  )

  return {
    kits,
    files,
    slots,
    highlight,
    config,
    selection,
    fileDropping,
    kitRenderer,
    importKit,
  }
}
