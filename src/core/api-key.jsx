/* ═══════════════════════════════════════════
   CORE — ANTHROPIC API KEY
   ═══════════════════════════════════════════

   BYO-key pattern for a personal single-user tool. The key lives in
   localStorage only — never in source, never in env files, never
   transmitted to any server other than api.anthropic.com (and even
   that goes direct from the user's browser).

   Three concerns split out:
   - `loadStoredApiKey()` / `saveStoredApiKey()` — persistence
   - `anthropicHeaders()` — builds the headers every API call needs
     (reads from localStorage at call time so the key change takes
     effect immediately without prop-drilling React state through
     workflow.js)
   - `ApiKeyModal` + `ApiKeySettingsButton` — the UI surface */

import { useState } from 'react'
import { C, SERIF, SANS, MONO, BP, BS } from './ui.jsx'

const STORAGE_KEY = 'lessonForge.anthropicApiKey'

export function loadStoredApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    // localStorage can throw in private-browsing / disabled-cookies modes.
    // No key just means the user will be prompted to add one.
    return ''
  }
}

export function saveStoredApiKey(key) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same — silently ignore. UI will reflect the unchanged state.
  }
}

// Standard Anthropic API headers for every /v1/messages call. Reads from
// localStorage at invocation time so the latest saved key is always used.
// Throws a user-readable error if no key is set — callers' try/catch will
// surface the message into their existing error UI.
export function anthropicHeaders() {
  const key = loadStoredApiKey()
  if (!key) {
    throw new Error(
      'No Anthropic API key set — click the ⚙ icon in the header to add one.'
    )
  }
  return {
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    // Required for direct-from-browser Anthropic API calls. Without this
    // the API rejects the request as a CORS-policy violation. (We accept
    // the security trade-off — the user owns the key and is the only
    // person using this tool.)
    'anthropic-dangerous-direct-browser-access': 'true',
  }
}

/* ─── Header gear button ─────────────────────────────────────────────── */
export function ApiKeySettingsButton({ hasKey, onClick }) {
  return (
    <button
      onClick={onClick}
      title={hasKey ? 'API key configured — click to change' : 'No API key set — click to add'}
      aria-label="API key settings"
      style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '6px 11px',
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${hasKey ? C.green + '60' : C.red + '60'}`,
        color: '#E2E8F0',
        fontSize: '13px',
        cursor: 'pointer',
        fontFamily: SANS,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: 1 }}>⚙</span>
      <span
        aria-hidden="true"
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: hasKey ? C.green : C.red,
          boxShadow: hasKey ? `0 0 4px ${C.green}` : `0 0 4px ${C.red}`,
        }}
      />
    </button>
  )
}

/* ─── Modal ──────────────────────────────────────────────────────────── */
// Render with `{open && <ApiKeyModal ... />}` so the component fully
// unmounts on close — that gives us fresh local state next time without
// needing a useEffect to reset the draft.
export function ApiKeyModal({ onClose, currentKey, onSave }) {
  const [draft, setDraft] = useState(currentKey)
  const [reveal, setReveal] = useState(false)

  const trimmed = draft.trim()
  const hasInput = trimmed.length > 0
  const looksValid = /^sk-ant-/i.test(trimmed)

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Anthropic API key settings"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderTop: `3px solid ${C.green}`,
          padding: '28px 32px',
          maxWidth: '520px',
          width: '100%',
          fontFamily: SANS,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <h2 style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
          Anthropic API key
        </h2>
        <p
          style={{
            fontSize: '12px',
            color: C.slate,
            margin: '0 0 18px',
            lineHeight: 1.55,
          }}
        >
          Stored only in your browser&apos;s{' '}
          <code style={{ fontFamily: MONO }}>localStorage</code>. Never sent anywhere except
          directly to <code style={{ fontFamily: MONO }}>api.anthropic.com</code> from your
          browser.
        </p>

        <label
          htmlFor="api-key-input"
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 700,
            color: C.slate,
            fontFamily: MONO,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          Key
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            id="api-key-input"
            type={reveal ? 'text' : 'password'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-ant-api03-..."
            autoFocus
            spellCheck={false}
            autoComplete="off"
            style={{
              flex: 1,
              padding: '10px 12px',
              fontFamily: MONO,
              fontSize: '13px',
              border: `1.5px solid ${hasInput && !looksValid ? C.orange : '#E2E8F0'}`,
              outline: 'none',
              background: '#FAFAFA',
            }}
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            style={{ ...BS, padding: '0 14px', fontSize: '12px' }}
          >
            {reveal ? 'Hide' : 'Show'}
          </button>
        </div>
        {hasInput && !looksValid && (
          <p
            style={{
              fontSize: '11px',
              color: C.orange,
              fontFamily: MONO,
              margin: '0 0 12px',
            }}
          >
            ⚠ Doesn&apos;t look like an Anthropic key (expected{' '}
            <code style={{ fontFamily: MONO }}>sk-ant-...</code>). Saving anyway is fine.
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => {
              onSave(trimmed)
              onClose()
            }}
            disabled={!hasInput}
            style={{
              ...BP,
              flex: 1,
              opacity: hasInput ? 1 : 0.5,
              cursor: hasInput ? 'pointer' : 'not-allowed',
            }}
          >
            Save
          </button>
          {currentKey && (
            <button
              onClick={() => {
                onSave('')
                onClose()
              }}
              style={{ ...BS, padding: '10px 14px', color: C.red, borderColor: C.red + '60' }}
            >
              Clear
            </button>
          )}
          <button onClick={onClose} style={{ ...BS, padding: '10px 16px' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
