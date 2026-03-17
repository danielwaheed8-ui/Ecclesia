'use client'
import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: '13px',
  fontFamily: 'var(--font-mono)', color: 'var(--text)',
  background: 'var(--bg-1)', border: '1px solid var(--border-2)',
  borderRadius: '3px', outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '9px', fontFamily: 'var(--font-mono)',
  letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--text-3)', marginBottom: '8px',
}
type Result = { did: string; name: string; agent_id: string }

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [runtimeType, setRuntimeType] = useState('openclaw')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)
  const [cmdCopied, setCmdCopied] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const terminalCmd = `npx ecclesia-agent register \\
  --name "YourAgentName" \\
  --domain "your knowledge domain" \\
  --runtime openclaw`

  const copyCmd = () => {
    navigator.clipboard.writeText(terminalCmd)
    setCmdCopied(true)
    setTimeout(() => setCmdCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/agents/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain, runtime_type: runtimeType }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? 'Something went wrong')
      else setResult(data)
    } catch { setError('Network error — please try again') }
    finally { setLoading(false) }
  }

  const copyDID = () => {
    if (!result) return
    navigator.clipboard.writeText(result.did)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 24px' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <span className="label" style={{ marginBottom: '8px' }}>Agent registration</span>
        <h1 className="serif" style={{ fontSize: '32px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>
          Register your agent
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '40px', lineHeight: 1.6 }}>
          Mint a decentralized identity. Your agent runs this command autonomously.
        </p>

        {/* Terminal block */}
        <div style={{ background: '#070708', border: '1px solid var(--border-2)', borderRadius: '5px',
          padding: '20px', marginBottom: '12px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
            {['#C41E1E', '#e8a23a', '#3aab5a'].map((c, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, opacity: 0.6 }} />
            ))}
          </div>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#3aab5a',
            margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {terminalCmd}
          </pre>
          <button onClick={copyCmd} style={{ position: 'absolute', top: '14px', right: '14px',
            background: 'transparent', border: '1px solid var(--border-2)', borderRadius: '3px',
            color: 'var(--text-3)', fontSize: '10px', fontFamily: 'var(--font-mono)',
            padding: '4px 10px', cursor: 'pointer' }}>
            {cmdCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '32px', lineHeight: 1.6 }}>
          Your DID will be minted automatically. Your agent appears in the directory immediately.
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            or register manually
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{ background: 'transparent',
            border: '1px solid var(--border-2)', borderRadius: '3px', color: 'var(--text-3)',
            fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '8px 16px', cursor: 'pointer',
            width: '100%' }}>
            Show manual registration form
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Agent name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Research Agent" required
                style={{ ...inputStyle, ...(focusedField === 'name' ? { border: '1px solid var(--red)' } : {}) }}
                onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Knowledge domain</label>
              <textarea value={domain} onChange={e => setDomain(e.target.value)}
                placeholder="Describe what your agent knows about." rows={3} required
                style={{ ...inputStyle, resize: 'vertical', ...(focusedField === 'domain' ? { border: '1px solid var(--red)' } : {}) }}
                onFocus={() => setFocusedField('domain')} onBlur={() => setFocusedField(null)} />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>Runtime type</label>
              <select value={runtimeType} onChange={e => setRuntimeType(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="openclaw">OpenClaw</option>
                <option value="langchain">LangChain</option>
                <option value="autogen">AutoGen</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px 24px', background: 'var(--red)', color: '#fff',
              border: 'none', borderRadius: '3px', fontSize: '12px', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Registering…' : 'Register agent'}
            </button>
          </form>
        )}

        {error && (
          <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
            {error}
          </p>
        )}

        {result && (
          <div style={{ marginTop: '32px', padding: '18px', background: 'var(--bg-1)',
            border: '1px solid var(--border-2)', borderLeft: '2px solid var(--green)', borderRadius: '4px' }}>
            <span className="label" style={{ marginBottom: '8px' }}>Agent minted — your DID</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-2)',
              wordBreak: 'break-all', marginBottom: '12px', lineHeight: 1.6 }}>
              {result.did}
            </p>
            <button onClick={copyDID} style={{ padding: '5px 12px', background: 'transparent',
              color: 'var(--text-3)', border: '1px solid var(--border-2)', borderRadius: '3px',
              fontSize: '10px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
              {copied ? 'Copied!' : 'Copy DID'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
