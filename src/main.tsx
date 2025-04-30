import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/style/style.ts'
import { DebugMenu, DebugPortalContextProvider } from './features/DebugMenu.tsx'
import { App } from './App.tsx'

const element = document.getElementById('root')
if (!element) {
  throw new Error('Application error.')
}
createRoot(element).render(
  <StrictMode>
    <DebugPortalContextProvider>
      <App />
      <DebugMenu />
    </DebugPortalContextProvider>
  </StrictMode>,
)
