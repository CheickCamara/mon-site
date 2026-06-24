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
  image: string | null
}

type Offre = {
  id: number
  titre: string
  description: string | null
  menu: string | null
  conditions: string | null
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
  influenceur_id: number
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
  const [offreError, setOffreError] = useState('')
  const [avisDeposes, setAvisDeposes] = useState<Record<number, { note: number; commentaire: string | null }>>({})
  const [avisForm, setAvisForm] = useState<Record<number, { note: number; commentaire: string }>>({})
  const [avisMsg, setAvisMsg] = useState<Record<number, string>>({})
  const [notesInfluenceurs, setNotesInfluenceurs] = useState<Record<number, { moyenne: string; total: number }>>({})
  const [noteRestaurant, setNoteRestaurant] = useState<{ moyenne: string | null; total: number } | null>(null)
  const [offreEnEdition, setOffreEnEdition] = useState<Offre | null>(null)
  const [editForm, setEditForm] = useState({
    titre: '', description: '', menu: '', valeur_indicative: '',
    contrepartie: 'post', nombre_places: '', tranche_min: '1000', tranche_max: '', conditions: '',
  })
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [editingResto, setEditingResto] = useState(false)
  const [restoForm, setRestoForm] = useState({ nom: '', description: '', telephone: '', adresse: '' })
  const [restoLoading, setRestoLoading] = useState(false)
  const [restoSuccess, setRestoSuccess] = useState(false)
  const [restoError, setRestoError] = useState('')
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
      // Charger les avis déjà déposés pour les collaborations honorées
      const honorees = cands.filter((c: Candidature) => c.statut === 'honoree')
      const avisExistants: Record<number, { note: number; commentaire: string | null }> = {}
      await Promise.all(honorees.map((c: Candidature) =>
        fetch(`${API}/avis/${c.id}`, { headers }).then(r => r.json())
          .then(d => { if (d) avisExistants[c.id] = d }).catch(() => {})
      ))
      setAvisDeposes(avisExistants)
      // Note moyenne du restaurant
      if (resto?.id) {
        fetch(`${API}/restaurants/${resto.id}/avis`).then(r => r.json()).then(setNoteRestaurant).catch(() => {})
      }
      // Notes des influenceurs dans les candidatures
      const notesCands: Record<number, { moyenne: string; total: number }> = {}
      await Promise.all(cands.map((c: Candidature) => {
        const infId = c.influenceur_id
        if (!infId) return Promise.resolve()
        return fetch(`${API}/influenceurs/${infId}/avis`, { headers }).then(r => r.json())
          .then(d => { if (d.total > 0) notesCands[infId] = d }).catch(() => {})
      }))
      setNotesInfluenceurs(notesCands)
    }).catch(() => setLoading(false))
  }, [])

  const soumettreAvis = async (candId: number) => {
    const form = avisForm[candId]
    if (!form?.note) return
    const res = await fetch(`${API}/avis`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidature_id: candId, note: form.note, commentaire: form.commentaire }),
    })
    const data = await res.json()
    if (res.ok) {
      setAvisDeposes(prev => ({ ...prev, [candId]: { note: form.note, commentaire: form.commentaire } }))
      setAvisMsg(prev => ({ ...prev, [candId]: '⭐ Merci pour ton avis !' }))
    } else {
      setAvisMsg(prev => ({ ...prev, [candId]: data.error || 'Erreur' }))
    }
  }

  const ouvrirEditionResto = () => {
    if (!restaurant) return
    setRestoForm({ nom: restaurant.nom, description: restaurant.description || '', telephone: restaurant.telephone || '', adresse: restaurant.adresse })
    setEditingResto(true)
    setRestoSuccess(false)
    setRestoError('')
  }

  const sauvegarderResto = async (e: React.FormEvent) => {
    e.preventDefault()
    setRestoLoading(true)
    setRestoError('')
    try {
      const res = await fetch(`${API}/restaurateur/mon-restaurant`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(restoForm),
      })
      const data = await res.json()
      if (!res.ok) { setRestoError(data.error || 'Erreur'); return }
      setRestaurant(prev => prev ? { ...prev, ...restoForm } : prev)
      setRestoSuccess(true)
      setEditingResto(false)
    } finally {
      setRestoLoading(false)
    }
  }

  const ouvrirEdition = (o: Offre) => {
    setOffreEnEdition(o)
    setEditForm({
      titre: o.titre, description: o.description ?? '', menu: o.menu ?? '', valeur_indicative: o.valeur_indicative ? String(o.valeur_indicative) : '',
      contrepartie: o.contrepartie, nombre_places: String(o.nombre_places),
      tranche_min: String(o.tranche_min), tranche_max: o.tranche_max ? String(o.tranche_max) : '', conditions: o.conditions ?? '',
    })
  }

  const sauvegarderOffre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offreEnEdition) return
    setOffreLoading(true)
    setOffreError('')
    try {
      const res = await fetch(`${API}/restaurateur/offres/${offreEnEdition.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          valeur_indicative: editForm.valeur_indicative ? Number(editForm.valeur_indicative) : null,
          nombre_places: Number(editForm.nombre_places),
          tranche_min: Number(editForm.tranche_min),
          tranche_max: editForm.tranche_max ? Number(editForm.tranche_max) : null,
        }),
      })
      if (res.ok) {
        setOffreEnEdition(null)
        const updated = await fetch(`${API}/restaurateur/mes-offres`, { headers }).then(r => r.json())
        setOffres(Array.isArray(updated) ? updated : [])
      } else {
        const data = await res.json()
        setOffreError(data.error || 'Une erreur est survenue')
      }
    } finally {
      setOffreLoading(false)
    }
  }

  const supprimerOffre = async (id: number) => {
    await fetch(`${API}/restaurateur/offres/${id}`, { method: 'DELETE', headers })
    setDeleteConfirm(null)
    setOffres(prev => prev.filter(o => o.id !== id))
  }

  const soumettreOffre = async (e: React.FormEvent) => {
    e.preventDefault()
    setOffreLoading(true)
    setOffreSuccess(false)
    setOffreError('')
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
      } else {
        const data = await res.json()
        setOffreError(data.error || 'Une erreur est survenue')
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
    valide:     { label: '✅ Validé et actif',          color: '#22c55e' },
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
                {/* Carte infos + photo */}
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
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: STATUT_RESTAURANT[restaurant.statut]?.color ?? '#888' }}>
                      {STATUT_RESTAURANT[restaurant.statut]?.label ?? restaurant.statut}
                    </span>
                  </div>
                  {restaurant.description && (
                    <p style={{ marginTop: 16, fontSize: '0.9rem', lineHeight: 1.6 }}>{restaurant.description}</p>
                  )}
                  {noteRestaurant && noteRestaurant.total > 0 && (
                    <p style={{ marginTop: 12, fontSize: '0.9rem', color: '#f59e0b', fontWeight: 700 }}>
                      {'⭐'.repeat(Math.round(Number(noteRestaurant.moyenne)))} {noteRestaurant.moyenne}/5
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>
                        {noteRestaurant.total} avis influenceur{noteRestaurant.total > 1 ? 's' : ''}
                      </span>
                    </p>
                  )}

                  <button onClick={ouvrirEditionResto} style={{
                    marginTop: 16, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    ✏️ Modifier les informations
                  </button>
                </div>

                {/* Formulaire d'édition */}
                {editingResto && (
                  <form onSubmit={sauvegarderResto} style={{
                    background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '24px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14,
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>✏️ Modifier mon restaurant</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nom du restaurant *</label>
                      <input value={restoForm.nom} onChange={e => setRestoForm(f => ({ ...f, nom: e.target.value }))} required
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description publique</label>
                      <textarea value={restoForm.description} onChange={e => setRestoForm(f => ({ ...f, description: e.target.value }))} rows={4}
                        placeholder="Décrivez votre restaurant, votre cuisine, l'ambiance…"
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Téléphone</label>
                      <input value={restoForm.telephone} onChange={e => setRestoForm(f => ({ ...f, telephone: e.target.value }))}
                        placeholder="01 23 45 67 89"
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Adresse *</label>
                      <input value={restoForm.adresse} onChange={e => setRestoForm(f => ({ ...f, adresse: e.target.value }))} required
                        style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                    </div>

                    {restoError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>❌ {restoError}</p>}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="submit" disabled={restoLoading} style={{
                        flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                        opacity: restoLoading ? 0.7 : 1,
                      }}>
                        {restoLoading ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                      <button type="button" onClick={() => setEditingResto(false)} style={{
                        padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
                        background: 'transparent', color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem',
                      }}>
                        Annuler
                      </button>
                    </div>
                  </form>
                )}

                {restoSuccess && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '14px 18px', color: '#166534', fontSize: '0.9rem', marginBottom: 16 }}>
                    ✅ Informations mises à jour avec succès.
                  </div>
                )}

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
            {offreError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', color: '#991b1b', fontSize: '0.9rem' }}>
                ❌ {offreError}
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
                  borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  {offreEnEdition?.id === o.id ? (
                    <form onSubmit={sauvegarderOffre} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <strong style={{ fontSize: '0.95rem' }}>Modifier l'offre</strong>
                      {[
                        { label: 'Titre *', key: 'titre', type: 'text' },
                        { label: 'Valeur indicative (€)', key: 'valeur_indicative', type: 'number' },
                        { label: 'Nombre de places', key: 'nombre_places', type: 'number' },
                        { label: 'Abonnés min', key: 'tranche_min', type: 'number' },
                        { label: 'Abonnés max', key: 'tranche_max', type: 'number' },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{f.label}</label>
                          <input type={f.type} value={(editForm as any)[f.key]} required={f.key === 'titre'}
                            onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: 2 }} />
                        </div>
                      ))}
                      <select value={editForm.contrepartie} onChange={e => setEditForm(p => ({ ...p, contrepartie: e.target.value }))}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                        <option value="post">📸 Post</option>
                        <option value="story">📱 Story</option>
                        <option value="reel">🎬 Reel</option>
                      </select>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" disabled={offreLoading} style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                          {offreLoading ? 'Sauvegarde…' : '💾 Sauvegarder'}
                        </button>
                        <button type="button" onClick={() => setOffreEnEdition(null)} style={{ padding: '10px 16px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
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
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => ouvrirEdition(o)} style={{ padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>
                          ✏️ Modifier
                        </button>
                        {deleteConfirm === o.id ? (
                          <>
                            <button onClick={() => supprimerOffre(o.id)} style={{ padding: '7px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                              Confirmer la suppression
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text)' }}>
                              Annuler
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(o.id)} style={{ padding: '7px 14px', background: 'var(--surface)', border: '1px solid #ef4444', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#ef4444' }}>
                            🗑 Supprimer
                          </button>
                        )}
                      </div>
                    </>
                  )}
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
                          {notesInfluenceurs[c.influenceur_id] && (
                            <p style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700, margin: 0 }}>
                              ⭐ {notesInfluenceurs[c.influenceur_id].moyenne}/5
                              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
                                ({notesInfluenceurs[c.influenceur_id].total} avis)
                              </span>
                            </p>
                          )}
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
                  {/* Notation de l'influenceur — collaboration honorée */}
                  {c.statut === 'honoree' && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                      {avisDeposes[c.id] ? (
                        <p style={{ fontSize: '0.88rem', color: '#22c55e', fontWeight: 600 }}>
                          ⭐ Tu as noté cet influenceur {avisDeposes[c.id].note}/5
                          {avisDeposes[c.id].commentaire && ` — "${avisDeposes[c.id].commentaire}"`}
                        </p>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8 }}>
                            🏆 Collaboration confirmée ! Comment était l'influenceur ?
                          </p>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            {[1,2,3,4,5].map(n => (
                              <button key={n} onClick={() => setAvisForm(p => ({ ...p, [c.id]: { ...p[c.id], note: n, commentaire: p[c.id]?.commentaire ?? '' } }))}
                                style={{ fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer', opacity: (avisForm[c.id]?.note ?? 0) >= n ? 1 : 0.3, transition: 'opacity 0.15s' }}>
                                ⭐
                              </button>
                            ))}
                            {avisForm[c.id]?.note && <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{avisForm[c.id].note}/5</span>}
                          </div>
                          <textarea placeholder="Un commentaire ? (optionnel)" value={avisForm[c.id]?.commentaire ?? ''}
                            onChange={e => setAvisForm(p => ({ ...p, [c.id]: { note: p[c.id]?.note ?? 0, commentaire: e.target.value } }))}
                            rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
                          <button onClick={() => soumettreAvis(c.id)} disabled={!avisForm[c.id]?.note}
                            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: !avisForm[c.id]?.note ? 0.5 : 1 }}>
                            Envoyer mon avis
                          </button>
                          {avisMsg[c.id] && <p style={{ fontSize: '0.85rem', marginTop: 6, color: avisMsg[c.id].startsWith('⭐') ? '#22c55e' : '#ef4444' }}>{avisMsg[c.id]}</p>}
                        </div>
                      )}
                    </div>
                  )}
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
