import { useState, useEffect, useRef } from 'react'

const API = 'https://mon-api-rqm7.onrender.com'

type Message = {
  id: number
  expediteur: string
  contenu: string
  date_envoi: string
}

type Props = {
  candidatureId: number
  monRole: 'influenceur' | 'restaurateur'
  nomInterlocuteur: string
  onFermer: () => void
}

export default function Messagerie({ candidatureId, monRole, nomInterlocuteur, onFermer }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [texte, setTexte] = useState('')
  const [loading, setLoading] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const token = localStorage.getItem('token')
  const headers = { 'Authorization': `Bearer ${token}` }

  const charger = async () => {
    const res = await fetch(`${API}/messages/${candidatureId}`, { headers })
    if (res.ok) setMessages(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    charger()
    fetch(`${API}/messages/${candidatureId}/lus`, { method: 'PUT', headers })
    const interval = setInterval(charger, 5000)
    return () => clearInterval(interval)
  }, [candidatureId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!texte.trim() || envoi) return
    setEnvoi(true)
    const res = await fetch(`${API}/messages/${candidatureId}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu: texte.trim() }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, msg])
      setTexte('')
    }
    setEnvoi(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column', maxHeight: '85vh',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>💬 {nomInterlocuteur}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Fil de discussion</p>
          </div>
          <button onClick={onFermer} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.4rem', color: 'var(--text-muted)', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>Chargement…</p>}
          {!loading && messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
              <p style={{ fontSize: '1.5rem' }}>👋</p>
              <p style={{ fontSize: '0.9rem' }}>Aucun message pour l'instant.<br />Commencez la conversation !</p>
            </div>
          )}
          {messages.map(m => {
            const estMoi = m.expediteur === monRole
            return (
              <div key={m.id} style={{
                display: 'flex', justifyContent: estMoi ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: estMoi ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: estMoi ? 'var(--primary)' : 'var(--bg)',
                  border: estMoi ? 'none' : '1px solid var(--border)',
                  color: estMoi ? '#fff' : 'inherit',
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word' }}>{m.contenu}</p>
                  <p style={{
                    margin: '4px 0 0', fontSize: '0.72rem',
                    color: estMoi ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    textAlign: 'right',
                  }}>
                    {new Date(m.date_envoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(m.date_envoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Saisie */}
        <form onSubmit={envoyer} style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, flexShrink: 0,
        }}>
          <input
            value={texte}
            onChange={e => setTexte(e.target.value)}
            placeholder="Écrire un message…"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 24,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'inherit', fontSize: '0.9rem', outline: 'none',
            }}
          />
          <button type="submit" disabled={!texte.trim() || envoi} style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none',
            background: 'var(--primary)', color: '#fff', cursor: 'pointer',
            fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !texte.trim() || envoi ? 0.5 : 1, flexShrink: 0,
          }}>➤</button>
        </form>
      </div>
    </div>
  )
}
