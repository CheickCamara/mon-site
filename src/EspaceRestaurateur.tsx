import { useState, useEffect } from 'react'
import Messagerie from './Messagerie'

const API = 'https://mon-api-rqm7.onrender.com'

const STATUT_CANDIDATURE: Record<string, { label: string; color: string }> = {
  en_attente: { label: '⏳ En attente', color: '#f59e0b' },
  valide:     { label: '✅ Acceptée',   color: '#22c55e' },
  refuse:     { label: '❌ Refusée',    color: '#ef4444' },
  honoree:    { label: '🏆 Honorée',   color: '#7c3aed' },
}

const CONTREPARTIE_LABEL: Record<string, string> = {
  story: '📱 Story',
  post:  '📸 Post',
  reel:  '🎬 Reel',
}

const STATUT_OFFRE: Record<string, { label: string; color: string }> = {
  en_attente_validation: { label: '⏳ En attente de validation', color: '#f59e0b' },
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
  lien_publication: string | null
  capture_story: string | null
  influenceurs: { nom: string; email: string; reseau: string; abonnes: number; pseudo: string | null } | null
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
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [messagerieCand, setMessagerieCand] = useState<{ id: number; nom: string } | null>(null)
  const [nonLus, setNonLus] = useState<Record<number, number>>({})
  const [showFormulaireOffre, setShowFormulaireOffre] = useState(false)
  const [newOffre, setNewOffre] = useState({
    titre: '', description: '', menu: '', valeur_indicative: '',
    contrepartie: 'post', nombre_places: '', tranche_min: '1000', tranche_max: '', conditions: '',
  })
  const [offreLoading, setOffreLoading] = useState(false)
  const [offreSuccess, setOffreSuccess] = useState(false)

  const token = localStorage.getItem('token')
  const headers = { 'Authorization': `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/restaurateur/mon-restaurant`, { headers }).then(r => r.json()),
      fetch(`${API}/restaurateur/mes-offres`, { headers }).then(r => r.json()),
      fetch(`${API}/restaurateur/candidatures`, { headers }).then(r => r.json()),
    ]).then(async ([resto, offresData, candData]) => {
      setRestaurant(resto)
      setOffres(Array.isArray(offresData) ? offresData : [])
      const cands = Array.isArray(candData) ? candData : []
      setCandidatures(cands)
      setLoading(false)
      const valides = cands.filter((c: Candidature) => c.statut === 'valide')
      const counts = await Promise.all(valides.map((c: Candidature) =>
        fetch(`${API}/messages/${c.id}/non-lus`, { headers }).then(r => r.json())
          .then(d => ({ id: c.id, count: d.non_lus ?? 0 })).catch(() => ({ id: c.id, count: 0 }))
      ))
      const map: Record<number, number> = {}
      counts.forEach(({ id, count }) => { map[id] = count })
      setNonLus(map)
    }).catch(() => setLoading(false))
  }, [])

  const soumettreOffre = async (e: React.FormEvent) => {
    e.preventDefault()
    setOffreLoading(true)
    setOffreSuccess(false)
    try {
      const res = await fetch(`${API}/restaurateur/offres`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOffre,
          valeur_indicative: newOffre.valeur_indicative ? Number(newOffre.valeur_indicative) : null,
          nombre_places: Number(newOffre.nombre_places),
          tranche_min: Number(newOffre.tranche_min),
          tranche_max: newOffre.tranche_max ? Number(newOffre.tranche_max) : null,
        }),
      })
      if (res.ok) {
        setOffreSuccess(true)
        setNewOffre({ titre: '', description: '', menu: '', valeur_indicative: '', contrepartie: 'post', nombre_places: '', tranche_min: '1000', tranche_max: '', conditions: '' })
        setShowFormulaireOffre(false)
      }
    } finally {
      setOffreLoading(false)
    }
  }

  const traiterCandidature = async (id: number, statut: 'valide' | 'refuse' | 'honoree') => {
    setActionLoading(id)
    try {
      await fetch(`${API}/restaurateur/candidatures/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      })
      setCandidatures(prev => prev.map(c => c.id === id ? { ...c, statut } : c))
    } finally {
      setActionLoading(null)
    }
  }

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
            {/* Bouton créer + message succès */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowFormulaireOffre(v => !v); setOffreSuccess(false) }} style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
              }}>
                {showFormulaireOffre ? '✕ Annuler' : '+ Proposer une offre'}
              </button>
            </div>

            {offreSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '14px 18px', color: '#166534', fontSize: '0.9rem' }}>
                ✅ Ton offre a été soumise et sera visible après validation par l'équipe Pop Fluence.
              </div>
            )}

            {/* Formulaire de création */}
            {showFormulaireOffre && (
              <form onSubmit={soumettreOffre} style={{
                background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Nouvelle offre</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Titre de l'offre *</label>
                    <input required value={newOffre.titre} onChange={e => setNewOffre(p => ({ ...p, titre: e.target.value }))}
                      placeholder="ex : Menu dégustation 5 plats" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
                    <textarea value={newOffre.description} onChange={e => setNewOffre(p => ({ ...p, description: e.target.value }))}
                      placeholder="Décris l'expérience proposée…" rows={3}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Menu proposé</label>
                    <textarea value={newOffre.menu} onChange={e => setNewOffre(p => ({ ...p, menu: e.target.value }))}
                      placeholder="Entrée, plat, dessert…" rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Contrepartie *</label>
                    <select required value={newOffre.contrepartie} onChange={e => setNewOffre(p => ({ ...p, contrepartie: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem' }}>
                      <option value="post">📸 Post</option>
                      <option value="story">📱 Story</option>
                      <option value="reel">🎬 Reel</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Nombre de places *</label>
                    <input required type="number" min="1" value={newOffre.nombre_places} onChange={e => setNewOffre(p => ({ ...p, nombre_places: e.target.value }))}
                      placeholder="ex : 3"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Abonnés minimum</label>
                    <input type="number" min="1000" value={newOffre.tranche_min} onChange={e => setNewOffre(p => ({ ...p, tranche_min: e.target.value }))}
                      placeholder="1000"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Abonnés maximum <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optionnel)</span></label>
                    <input type="number" value={newOffre.tranche_max} onChange={e => setNewOffre(p => ({ ...p, tranche_max: e.target.value }))}
                      placeholder="sans limite"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Valeur indicative (€) <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optionnel)</span></label>
                    <input type="number" value={newOffre.valeur_indicative} onChange={e => setNewOffre(p => ({ ...p, valeur_indicative: e.target.value }))}
                      placeholder="ex : 60"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Conditions <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optionnel)</span></label>
                    <textarea value={newOffre.conditions} onChange={e => setNewOffre(p => ({ ...p, conditions: e.target.value }))}
                      placeholder="ex : Réservation obligatoire, valable du lundi au jeudi…" rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={offreLoading} style={{
                    padding: '12px 28px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                    opacity: offreLoading ? 0.6 : 1,
                  }}>
                    {offreLoading ? 'Envoi…' : 'Soumettre l\'offre'}
                  </button>
                </div>
              </form>
            )}

            {/* Liste des offres existantes */}
            {offres.length === 0 && !showFormulaireOffre ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem' }}>🎁</p>
                <p>Aucune offre pour l'instant. Propose ta première offre !</p>
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
              const reseau = c.influenceurs?.reseau === 'instagram' ? '📸 Instagram' : '🎵 TikTok'
              const abonnes = c.influenceurs?.abonnes ? c.influenceurs.abonnes.toLocaleString('fr-FR') : '—'
              return (
                <div key={c.id} style={{
                  background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    {/* Infos influenceur */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                        }}>
                          {(c.influenceurs?.nom ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{c.influenceurs?.nom ?? '—'}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>{c.influenceurs?.email ?? ''}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600,
                        }}>{reseau}</span>
                        <span style={{
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)',
                        }}>👥 {abonnes} abonnés</span>
                        {c.influenceurs?.pseudo && (() => {
                          const reseau = c.influenceurs!.reseau
                          const pseudo = c.influenceurs!.pseudo!
                          const url = reseau === 'instagram'
                            ? `https://www.instagram.com/${pseudo}`
                            : `https://www.tiktok.com/@${pseudo}`
                          return (
                            <a href={url} target="_blank" rel="noreferrer" style={{
                              background: reseau === 'instagram' ? '#e1306c' : '#000',
                              color: '#fff', borderRadius: 20, padding: '2px 10px',
                              fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                            }}>
                              {reseau === 'instagram' ? '📸' : '🎵'} @{pseudo} →
                            </a>
                          )
                        })()}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 2 }}>
                        Pour : <strong>{c.offres?.titre ?? '—'}</strong> · {CONTREPARTIE_LABEL[c.offres?.contrepartie ?? ''] ?? ''}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        Candidature du {new Date(c.date_candidature).toLocaleDateString('fr-FR')}
                      </p>
                      {c.post_publie && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.85rem' }}>✅ Publication soumise</span>
                          {c.lien_publication && (
                            <a href={c.lien_publication} target="_blank" rel="noreferrer"
                              style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                              🔗 Voir le post →
                            </a>
                          )}
                          {c.capture_story && (
                            <a href={c.capture_story} target="_blank" rel="noreferrer"
                              style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                              📷 Voir la story →
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Statut + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: s.color }}>{s.label}</span>
                      {c.statut === 'en_attente' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => traiterCandidature(c.id, 'valide')}
                            style={{
                              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                              opacity: actionLoading === c.id ? 0.6 : 1,
                            }}>
                            ✓ Accepter
                          </button>
                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => traiterCandidature(c.id, 'refuse')}
                            style={{
                              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                              opacity: actionLoading === c.id ? 0.6 : 1,
                            }}>
                            ✗ Refuser
                          </button>
                        </div>
                      )}
                      {c.statut === 'valide' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                          <button
                            onClick={() => { setMessagerieCand({ id: c.id, nom: c.influenceurs?.nom ?? 'Influenceur' }); setNonLus(prev => ({ ...prev, [c.id]: 0 })) }}
                            style={{
                              position: 'relative', padding: '6px 12px', borderRadius: 20, border: '1px solid var(--primary)',
                              background: 'transparent', color: 'var(--primary)', cursor: 'pointer',
                              fontWeight: 600, fontSize: '0.8rem',
                            }}>
                            💬 Message
                            {(nonLus[c.id] ?? 0) > 0 && (
                              <span style={{
                                position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff',
                                borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>{nonLus[c.id]}</span>
                            )}
                          </button>
                          {c.post_publie && (
                            <button
                              disabled={actionLoading === c.id}
                              onClick={() => traiterCandidature(c.id, 'honoree')}
                              style={{
                                padding: '6px 12px', borderRadius: 20, border: 'none',
                                background: '#7c3aed', color: '#fff', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.8rem',
                                opacity: actionLoading === c.id ? 0.6 : 1,
                              }}>
                              🏆 Confirmer la publication
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {messagerieCand && (
        <Messagerie
          candidatureId={messagerieCand.id}
          monRole="restaurateur"
          nomInterlocuteur={messagerieCand.nom}
          onFermer={() => setMessagerieCand(null)}
        />
      )}
    </div>
  )
}
