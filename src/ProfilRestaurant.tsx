import { useEffect, useState } from 'react'

const API = 'https://mon-api-rqm7.onrender.com'

const CONTREPARTIE_LABEL: Record<string, string> = {
  story: '📱 Story',
  post: '📸 Post',
  reel: '🎬 Reel',
}

type Offre = {
  id: number
  titre: string
  description: string | null
  contrepartie: string
  valeur_indicative: number | null
  places_restantes: number
  tranche_min: number
  tranche_max: number | null
  conditions: string | null
}

type Avis = {
  note: number
  commentaire: string | null
  created_at: string
}

type Profil = {
  resto: { id: number; nom: string; adresse: string; description: string | null; telephone: string | null; image: string | null }
  offres: Offre[]
  avis: Avis[]
  moyenne: string | null
  total_avis: number
}

type Props = {
  restaurantId: number
  onRetour: () => void
  onCandidater?: (offreId: number) => void
  estConnecte: boolean
  token: string | null
}

export default function ProfilRestaurant({ restaurantId, onRetour, estConnecte, token }: Props) {
  const [profil, setProfil] = useState<Profil | null>(null)
  const [loading, setLoading] = useState(true)
  const [candidatureMsg, setCandidatureMsg] = useState<Record<number, string>>({})
  const [candidatureEnCours, setCandidatureEnCours] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API}/restaurants/${restaurantId}/profil-public`)
      .then(r => r.json())
      .then(data => { setProfil(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [restaurantId])

  const candidater = async (offreId: number) => {
    if (!token) return
    setCandidatureEnCours(offreId)
    try {
      const res = await fetch(`${API}/candidatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ offre_id: offreId }),
      })
      const data = await res.json()
      setCandidatureMsg(m => ({ ...m, [offreId]: res.ok ? '✅ Candidature envoyée !' : (data.error || 'Erreur') }))
    } finally {
      setCandidatureEnCours(null)
    }
  }

  const etoiles = (note: number) => '⭐'.repeat(note) + '☆'.repeat(5 - note)

  if (loading) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Chargement…</p>
    </div>
  )

  if (!profil) return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Restaurant introuvable.</p>
    </div>
  )

  const { resto, offres, avis, moyenne, total_avis } = profil

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a0533, #2d0a4e)', padding: '48px 24px 40px', textAlign: 'center', position: 'relative' }}>
        <button onClick={onRetour} style={{
          position: 'absolute', top: 20, left: 20,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 10, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
        }}>← Retour</button>

        {resto.image ? (
          <img src={resto.image} alt={resto.nom} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', display: 'block', border: '3px solid rgba(255,255,255,0.2)' }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', margin: '0 auto 16px',
          }}>🍽️</div>
        )}
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px' }}>{resto.nom}</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', margin: '0 0 12px' }}>📍 {resto.adresse}</p>
        {moyenne && (
          <p style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
            {etoiles(Math.round(Number(moyenne)))} {moyenne}/5
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, marginLeft: 6, fontSize: '0.85rem' }}>({total_avis} avis)</span>
          </p>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
        {/* Description */}
        {resto.description && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text)' }}>{resto.description}</p>
          </div>
        )}

        {/* Offres */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
          🎁 Offres disponibles
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem', marginLeft: 8 }}>({offres.length})</span>
        </h2>

        {offres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', background: 'var(--surface)', borderRadius: 12, marginBottom: 32, color: 'var(--text-muted)' }}>
            Aucune offre disponible pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            {offres.map(o => (
              <div key={o.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{o.titre}</h3>
                  <span style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>
                    {CONTREPARTIE_LABEL[o.contrepartie]}
                  </span>
                </div>
                {o.description && <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 10 }}>{o.description}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {o.valeur_indicative && (
                    <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: '0.82rem' }}>
                      🍽 Valeur ~{o.valeur_indicative} €
                    </span>
                  )}
                  <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: '0.82rem' }}>
                    👥 {o.tranche_min.toLocaleString('fr-FR')}{o.tranche_max ? `–${o.tranche_max.toLocaleString('fr-FR')}` : '+'} abonnés
                  </span>
                  <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: '0.82rem' }}>
                    🎟 {o.places_restantes} place{o.places_restantes > 1 ? 's' : ''} restante{o.places_restantes > 1 ? 's' : ''}
                  </span>
                </div>
                {o.conditions && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>ℹ️ {o.conditions}</p>}
                {candidatureMsg[o.id] ? (
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: candidatureMsg[o.id].startsWith('✅') ? '#22c55e' : '#ef4444' }}>
                    {candidatureMsg[o.id]}
                  </p>
                ) : estConnecte && token ? (
                  <button
                    onClick={() => candidater(o.id)}
                    disabled={candidatureEnCours === o.id}
                    style={{
                      padding: '10px 24px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                      opacity: candidatureEnCours === o.id ? 0.6 : 1,
                    }}
                  >
                    {candidatureEnCours === o.id ? 'Envoi…' : 'Candidater →'}
                  </button>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Connecte-toi pour candidater</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Avis */}
        {avis.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>
              ⭐ Avis des influenceurs
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem', marginLeft: 8 }}>({total_avis})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {avis.map((a, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{etoiles(a.note)} {a.note}/5</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {a.commentaire && <p style={{ fontSize: '0.88rem', color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>"{a.commentaire}"</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
