// biome-ignore lint/suspicious/noExplicitAny: library code, allowed to do that
export const createEventBus = <T extends Record<string, (...args: any[]) => void>>() => {
  // biome-ignore lint/suspicious/noExplicitAny: library code, allowed to do that
  const eventMap = {} as Record<keyof T, Set<(...args: any[]) => void>>

  return {
    emit: <K extends keyof T>(event: K, ...args: Parameters<T[K]>) => {
      for (const cb of eventMap[event]) {
        cb(...args)
      }
    },

    on: <K extends keyof T>(event: K, callback: T[K]) => {
      if (!eventMap[event]) {
        eventMap[event] = new Set()
      }
      eventMap[event].add(callback)
    },

    off: <K extends keyof T>(event: K, callback: T[K]) => {
      if (!eventMap[event]) {
        return
      }
      eventMap[event].delete(callback)
    },
  }
}
