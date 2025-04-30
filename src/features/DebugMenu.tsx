import { css, cx } from '@linaria/core'
import { type FC, type ReactNode, createContext, useContext, useMemo, useState } from 'react'
import { fragments } from '../app/style/fragments'
import { style } from '../app/style/style'
import { Icon } from '../components/Icon'

import { createPortal } from 'react-dom'

export const DebugPortalContext = createContext<{
  debugElementsRoot: HTMLElement | null
  setDebugElementsRoot: React.Dispatch<React.SetStateAction<HTMLElement | null>>
}>({
  debugElementsRoot: null,
  setDebugElementsRoot: () => {
    return
  },
})

export const DebugPortalContextProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [debugElementsRoot, setDebugElementsRoot] = useState<HTMLElement | null>(null)
  const contextValue = useMemo(
    () => ({
      debugElementsRoot,
      setDebugElementsRoot,
    }),
    [debugElementsRoot],
  )

  return <DebugPortalContext.Provider value={contextValue}>{children}</DebugPortalContext.Provider>
}

export const Debug: FC<{ children?: ReactNode }> = ({ children }) => {
  const { debugElementsRoot } = useContext(DebugPortalContext)
  return debugElementsRoot ? createPortal(children, debugElementsRoot) : null
}

const debugMenuClass = css`
  position: fixed;
  bottom: 12px;
  left: 12px;
  border: none;
  border-radius: 3px;
  background-color: color-mix(in display-p3, ${style.colors.raspberry[900]}, transparent 50%);
  transition: ${fragments.transition.regular('background-color')};
  overflow: clip;
  &:hover {
    background-color: color-mix(in display-p3, ${style.colors.raspberry[900]}, transparent 25%);
  }
  cursor: pointer;
  padding: 24px;

  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  gap: 24px;

  &.open {
    max-width: 500px;
    max-height: 80vh;
  }

  > .controls {
    flex: 1;
    overflow: auto;
    
  }

  
  ${import.meta.env.DEV ? '' : 'display: none;'}
`

export const DebugMenu: FC = () => {
  const [open, setOpen] = useState(false)
  const debugControlContext = useContext(DebugPortalContext)

  return (
    <dialog open className={cx(debugMenuClass, open && 'open')} onClick={() => setOpen(!open)}>
      {!open && <Icon size="l" />}
      {open && (
        <section className="controls">
          <div ref={debugControlContext.setDebugElementsRoot} />
        </section>
      )}
    </dialog>
  )
}
