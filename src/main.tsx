import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './appwriteClient.ts'
import { registerSW } from 'virtual:pwa-register'
import { setupTelegramApp } from './utils/telegram'

registerSW({ immediate: true })

// Initialize Telegram WebApp settings if in Telegram
setupTelegramApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
