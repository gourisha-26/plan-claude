import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './styles/desktop.css'
import './styles/claude.css'
import './styles/panel.css'
import './styles/overlays.css'
import './styles/evidence.css'
import './styles/onboarding.css'
import './styles/guide.css'
import './styles/caseStudy.css'
import './styles/theme-light.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
