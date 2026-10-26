import '@fontsource-variable/inter'
import '@fontsource/inter-tight/700.css'
import '@fontsource/jetbrains-mono/400.css'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
