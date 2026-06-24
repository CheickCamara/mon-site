import { useState, useEffect } from 'react'

const API = 'https://mon-api-rqm7.onrender.com'

const STATUT_CANDIDATURE: Record<string, { label: string; color: string }> = {
  en_attente: { label: '⏳ En attente', color: '#f59e0b' },
  valide:     { label: '✅ Acceptée',   color: '#22c55e' },
  refuse:     { label: '❌ Refusée',    color: '#ef4444' },
}

const CONTREPARTIE_LABEL: Record<string, string> = {
  story: '📱 Story',
  post:  '📸 Post',
  reel:  '🎬 Reel',
}

const STATUT_OFFRE: Record<string, { label: string; color: string }> = {
  active:    { label: '✅ Active',    color: '#22c55e' },
  en_pause:  { label: '⏸ En pause',  color: '#f59e0b' },
  cloturee:  { label: '🔒 Clôturée', color: '#6b7280' },
}

type Restaurant = {
  id: number
  nom: string
  adresse: string
  description: string
  telephone: string
  statut: string
  siret: string
}

type Offre = {
  id: number
  titre: string
  contrepartie: string
  nombre_places: number
  places_restantes: number
  valeur_indicative: number
  statut: string
  tranche_min: number
  tranche_max: number | null
}

type Candidature = {
  id: number
  statut: string
  date_candidature: string
  post_publie: boolean
  influenceurs: { nom: string; email: string; reseau: string; abonnes: number } | null
  offres: { titre: string; contrepartie: string } | null
}

type Props = {
  utilisateur: { id: number; nom: string; email: string; role: string }
  onRetour: () => void
}

export default function EspaceRestaurateur({ utilisateur, onRetour }: Props) {
  const [onglet, setOnglet] = useState<'restaurant' | 'offres' | 'candidatures'>('restaurant')
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [offres, setOffres] = useState<Offre[]>([])
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')
  const headers = { 'Authorization': `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/restaurateur/mon-restaurant`, { headers }).then(r => r.json()),
      fetch(`${API}/restaurateur/mes-offres`, { headers }).then(r => r.json()),
      fetch(`${API}/restaurateur/candidatures`, { headers }).then(r => r.json()),
    ]).then(([resto, offresData, candData]) => {
      setRestaurant(resto)
      setOffres(Array.isArray(offresData) ? offresData : [])
      setCandidatures(Array.isArray(candData) ? candData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const STATUT_RESTAURANT: Record<string, { label: string; color: string }> = {
    en_attente: { label: '⏳ En attente de validation', color: '#f59e0b' },
    Ouvert:     { label: '✅ Validé et actif',          color: '#22c55e' },
    Fermé:      { label: '🔒 Fermé',                   color: '#6b7280' },
  }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', paddingBottom: 80 }}>
      <nav className="lp-nav">
        <span className="lp-logo">Pop Fluence</span>
        <button className="btn btn-ghost btn-sm" onClick={onRetour}>← Retour</button>
      </nav>

      <div style={{ maxWidth: 860, margin: '60px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>
          Bonjour {utilisateur.nom} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Espace restaurateur</p>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)', marginBottom: 32 }}>
          {([
            { key: 'restaurant', label: '🏠 Mon restaurant' },
            { key: 'offres',     label: `🎁 Mes offres (${offres.length})` },
            { key: 'candidatures', label: `📋 Candidatures (${candidatures.length})` },
          ] as const).map(o => (
            <button key={o.key} onClick={() => setOnglet(o.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontWeight: 600, fontSize: '0.95rem',
              color: onglet === o.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: onglet === o.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {o.label}
            </button>
          ))}
        </div>

        {loading && <p>Chargement…</p>}

        {/* Mon restaurant */}
        {!loading && onglet === 'restaurant' && (
          <div style={{ maxWidth: 560 }}>
            {restaurant ? (
              <>
                <div style={{
                  background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '20px 24px', marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>{restaurant.nom}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 {restaurant.adresse}</p>
                      {restaurant.telephone && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>📞 {restaurant.telephone}</p>}
                      {restaurant.siret && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>SIRET : {restaurant.siret}</p>}
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: '0.85rem',
                      color: STATUT_RESTAURANT[restaurant.statut]?.color ?? '#888',
                    }}>
                      {STATUT_RESTAURANT[restaurant.statut]?.label ?? restaurant.statut}
                    </span>
                  </div>
                  {restaurant.description && (
                    <p style={{ marginTop: 16, fontSize: '0.9rem', lineHeight: 1.6 }}>{restaurant.description}</p>
                  )}
                </div>

                {restaurant.statut === 'en_attente' && (
                  <div style={{
                    background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10,
                    padding: '16px 20px', fontSize: '0.9rem', color: '#92400e',
                  }}>
                    <strong>Dossier en cours d'examen</strong><br />
                    Notre équipe va vérifier ton établissement sous 48h. Tu pourras créer des offres une fois validé.
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Impossible de charger les informations du restaurant.</p>
            )}
          </div>
        )}

        {/* Mes offres */}
        {!loading && onglet === 'offres' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {offres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem' }}>🎁</p>
                <p>Aucune offre créée pour l'instant.</p>
                <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Les offres sont créées par l'équipe Pop Fluence pour toi.</p>
              </div>
            ) : offres.map(o => {
              const s = STATUT_OFFRE[o.statut] ?? { label: o.statut, color: '#888' }
              return (
                <div key={o.id} style={{
                  background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '20px 24px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{o.titre}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {CONTREPARTIE_LABEL[o.contrepartie]} · {o.places_restantes}/{o.nombre_places} places restantes
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
                      {o.tranche_min.toLocaleString('fr-FR')}{o.tranche_max ? `–${o.tranche_max.toLocaleString('fr-FR')}` : '+'} abonnés
                      {o.valeur_indicative ? ` · ${o.valeur_indicative} €` : ''}
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: s.color }}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Candidatures reçues */}
        {!loading && onglet === 'candidatures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {candidatures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem' }}>📋</p>
                <p>Aucune candidature reçue pour l'instant.</p>
              </div>
            ) : candidatures.map(c => {
              const s = STATUT_CANDIDATURE[c.statut] ?? { label: c.statut, color: '#888' }
              return (
                <div key={c.id} style={{
                  background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '20px 24px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
                      {c.influenceurs?.nom ?? '—'}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {c.influenceurs?.reseau === 'instagram' ? '📸 Instagram' : '🎵 TikTok'} · {c.influenceurs?.abonnes?.toLocaleString('fr-FR') ?? '—'} abonnés
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
                      Pour : {c.offres?.titre ?? '—'} · {CONTREPARTIE_LABEL[c.offres?.contrepartie ?? ''] ?? ''}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                      Le {new Date(c.date_candidature).toLocaleDateString('fr-FR')}
                      {c.post_publie ? ' · ✅ Post publié' : ''}
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: s.color }}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
