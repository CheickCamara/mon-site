import { useEffect, useState } from 'react'

const API = 'https://mon-api-rqm7.onrender.com'

const RESEAU_LABEL: Record<string, string> = {
  instagram: '📸 Instagram',
  tiktok: '🎵 TikTok',
}

type Collab = {
  id: number
  lien_publication: string | null
  date_candidature: string
  offres: { titre: string; restaurants: { nom: string } } | null
}

type Profil = {
  influenceur: { id: number; nom: string; pseudo: string | null; reseau: string; abonnes: number; statut: string }
  collabs: Collab[]
  moyenne: string | null
  total_avis: number
}

type Props = {
  influenceurId: number
  onRetour: () => void
  token: string | null
}

export default function ProfilInfluenceur({ influenceurId, onRetour, token }: Props) {
  const [profil, setProfil] = useState<Profil | null>(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/influenceurs/${influenceurId}/profil-public`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.influenceur) setProfil(d); else setErreur(d.error || 'Profil indisponible') })
      .catch(() => setErreur('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [influenceurId])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text)' }}>Chargement…</div>
  if (erreur || !profil) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: 'var(--text)' }}>{erreur || 'Profil indisponible'}</p>
      <button className="btn btn-ghost btn-sm" onClick={onRetour} style={{ marginTop: 16 }}>← Retour</button>
    </div>
  )

  const { influenceur: inf, collabs, moyenne, total_avis } = profil

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <button className="btn btn-ghost btn-sm" onClick={onRetour} style={{ marginBottom: 24 }}>← Retour</button>

      {/* En-tête */}
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '28px 24px', marginBottom: 20, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #c850ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
            {inf.reseau === 'tiktok' ? '🎵' : '📸'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-h)' }}>{inf.nom}</h1>
            {inf.pseudo && <p style={{ margin: '0 0 8px', color: 'var(--primary)', fontWeight: 600 }}>@{inf.pseudo}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--accent-bg)', color: 'var(--primary)', border: '1px solid var(--accent-border)', borderRadius: 100, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                {RESEAU_LABEL[inf.reseau] ?? inf.reseau}
              </span>
              <span style={{ background: 'var(--accent-bg)', color: 'var(--primary)', border: '1px solid var(--accent-border)', borderRadius: 100, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                👥 {inf.abonnes.toLocaleString('fr-FR')} abonnés
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { label: 'Collabs honorées', val: collabs.length },
            { label: 'Note moyenne', val: moyenne ? `${moyenne}/5 ⭐` : '—' },
            { label: 'Avis reçus', val: total_avis },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-h)' }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Publications */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h)', marginBottom: 12 }}>
        Publications ({collabs.length})
      </h2>
      {collabs.length === 0 ? (
        <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Aucune collaboration honorée pour l'instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {collabs.map(c => (
            <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-h)', marginBottom: 2 }}>
                {c.offres?.titre ?? '—'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: 8 }}>
                🍽️ {c.offres?.restaurants?.nom ?? '—'}
              </div>
              {c.lien_publication ? (
                <a href={c.lien_publication} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Voir la publication →
                </a>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Lien non disponible</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
