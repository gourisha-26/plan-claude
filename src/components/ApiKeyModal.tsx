import { useState } from 'react'
import { getGeminiApiKey, setGeminiApiKey } from '../lib/gemini'
import { Check, Lock, Sparkle, X } from './icons'

interface Props {
  isOpen: boolean
  onClose: () => void
  onKeySaved?: () => void
}

export function ApiKeyModal({ isOpen, onClose, onKeySaved }: Props) {
  const [key, setKey] = useState(getGeminiApiKey())
  const [saved, setSaved] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    setGeminiApiKey(key)
    setSaved(true)
    onKeySaved?.()
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 900)
  }

  const handleClear = () => {
    setKey('')
    setGeminiApiKey('')
    onKeySaved?.()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sheet apikey-modal" onClick={(e) => e.stopPropagation()}>
        <header className="sheet__head">
          <div className="apikey-modal__title">
            <span className="panel__logo" aria-hidden>
              <Sparkle size={15} />
            </span>
            <h3>Google Gemini API</h3>
          </div>
          <button className="sheet__close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </header>

        <div className="apikey-modal__body">
          <p className="apikey-modal__desc">
            Connect Google’s free Gemini 2.0 Flash model to enable real-time prompt comprehension, plan generation, and natural conversation.
          </p>

          <div className="apikey-modal__hint">
            <Lock size={13} />
            <span>
              Don't have a key? Get one completely free in 10 seconds from{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                Google AI Studio ↗
              </a>
              . Your key is stored locally in your browser only.
            </span>
          </div>

          <div className="apikey-modal__field">
            <label htmlFor="gemini-key-input">Gemini API Key</label>
            <input
              id="gemini-key-input"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste AIzaSy... key here"
              autoFocus
            />
          </div>

          {saved && (
            <div className="apikey-modal__success">
              <Check size={14} /> Key saved successfully! Real Gemini AI is now active.
            </div>
          )}

          <div className="apikey-modal__actions">
            {key && (
              <button type="button" className="btn btn--subtle" onClick={handleClear}>
                Remove Key
              </button>
            )}
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={!key.trim()}>
              {saved ? 'Saved!' : 'Save & Enable Gemini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
