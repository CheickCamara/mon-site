import { useState, useEffect } from 'react'
import './App.css'
import MapPage from './MapPage'
import InscriptionRestaurateur from './InscriptionRestaurateur'
import EspaceRestaurateur from './EspaceRestaurateur'

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.15 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }
}

type Offre = {
  id: number
  titre: string
  description: string
  menu: string
  valeur_indicative: number
  contrepartie: string
  places_restantes: number
  tranche_min: number
  tranche_max: number | null
  conditions: string
  restaurants: { nom: string; adresse: string; image: string }
}

const PHOTOS_PAR_CUISINE: Record<string, string> = {
  'japonais':    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  'italien':     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  'français':    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  'française':   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  'mexicain':    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  'libanais':    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
  'méditerranée':'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80',
  'burger':      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'poisson':     'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80',
  'catalan':     'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&q=80',
  'default':     'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
}

function getPhoto(description: string): string {
  const desc = description.toLowerCase()
  for (const [mot, url] of Object.entries(PHOTOS_PAR_CUISINE)) {
    if (desc.includes(mot)) return url
  }
  return PHOTOS_PAR_CUISINE['default']
}


const API = 'https://mon-api-rqm7.onrender.com'

type Utilisateur = {
  id: number
  nom: string
  email: string
  role: string
  reseau?: string
  abonnes?: number
}

function AuthModal({ onClose, onConnexion }: { onClose: () => void; onConnexion: (u: Utilisateur) => void }) {
  const [tab, setTab] = useState<'login' | 'influenceur' | 'restaurateur'>('login')
  const [form, setForm] = useState({ email: '', password: '', name: '', network: '', followers: '' })
  const [resto, setResto] = useState({ nom: '', email: '', mot_de_passe: '', nom_etablissement: '', adresse: '', siret: '', telephone: '' })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const changeTab = (t: typeof tab) => { setTab(t); setErreur('') }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setForm(f => ({ ...f, [k]: e.target.value })); setErreur('') }
  const setR = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => { setResto(f => ({ ...f, [k]: e.target.value })); setErreur('') }

  const handleConnexion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch(`${API}/auth/connexion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, mot_de_passe: form.password }),
      })
      const data = await r.json()
      if (!r.ok) { setErreur(data.error); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))
      onConnexion(data.utilisateur)
      onClose()
    } catch {
      setErreur('Erreur de connexion, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const handleInscriptionInfluenceur = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch(`${API}/auth/inscription-influenceur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: form.name, email: form.email, mot_de_passe: form.password, reseau: form.network, abonnes: Number(form.followers) }),
      })
      const data = await r.json()
      if (!r.ok) { setErreur(data.error); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))
      onConnexion(data.utilisateur)
      onClose()
    } catch {
      setErreur('Erreur lors de l\'inscription, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const handleInscriptionRestaurateur = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch(`${API}/auth/inscription-restaurateur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resto),
      })
      const data = await r.json()
      if (!r.ok) { setErreur(data.error); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))
      onConnexion(data.utilisateur)
      onClose()
    } catch {
      setErreur('Erreur lors de l\'inscription, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="auth-close" onClick={onClose}>✕</button>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => changeTab('login')}>Connexion</button>
          <button className={`auth-tab ${tab === 'influenceur' ? 'active' : ''}`} onClick={() => changeTab('influenceur')}>Influenceur</button>
          <button className={`auth-tab ${tab === 'restaurateur' ? 'active' : ''}`} onClick={() => changeTab('restaurateur')}>Restaurateur</button>
        </div>

        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleConnexion}>
            <p className="auth-subtitle">Content de te revoir 👋</p>
            <label>Adresse e-mail
              <input type="email" placeholder="toi@exemple.com" value={form.email} onChange={set('email')} required />
            </label>
            <label>Mot de passe
              <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </label>
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <p className="auth-terms" style={{ textAlign: 'center' }}>
              Pas encore de compte ?{' '}
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600 }} onClick={() => changeTab('influenceur')}>S'inscrire</button>
            </p>
          </form>
        )}

        {tab === 'influenceur' && (
          <form className="auth-form" onSubmit={handleInscriptionInfluenceur}>
            <p className="auth-subtitle">Rejoins la communauté — c'est gratuit ✨</p>
            <label>Prénom ou pseudo
              <input type="text" placeholder="Ton nom de créateur" value={form.name} onChange={set('name')} required />
            </label>
            <label>Adresse e-mail
              <input type="email" placeholder="toi@exemple.com" value={form.email} onChange={set('email')} required />
            </label>
            <label>Mot de passe
              <input type="password" placeholder="8 caractères minimum" value={form.password} onChange={set('password')} required />
            </label>
            <label>Réseau principal
              <select value={form.network} onChange={set('network')} required>
                <option value="">Choisir un réseau…</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </label>
            <label>Nombre d'abonnés
              <input type="number" placeholder="Minimum 1 000 requis" min="1000" value={form.followers} onChange={set('followers')} required />
            </label>
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
              {loading ? 'Inscription…' : 'Créer mon compte'}
            </button>
            <p className="auth-terms">En t'inscrivant tu acceptes nos <a href="#">CGU</a> et notre <a href="#">politique de confidentialité</a>.</p>
          </form>
        )}

        {tab === 'restaurateur' && (
          <form className="auth-form" onSubmit={handleInscriptionRestaurateur}>
            <p className="auth-subtitle">Inscris ton restaurant 🍽️</p>
            <label>Ton prénom et nom
              <input type="text" placeholder="Jean Dupont" value={resto.nom} onChange={setR('nom')} required />
            </label>
            <label>Adresse e-mail
              <input type="email" placeholder="contact@monrestaurant.fr" value={resto.email} onChange={setR('email')} required />
            </label>
            <label>Mot de passe
              <input type="password" placeholder="8 caractères minimum" value={resto.mot_de_passe} onChange={setR('mot_de_passe')} required />
            </label>
            <label>Nom de l'établissement
              <input type="text" placeholder="Le Petit Bistrot" value={resto.nom_etablissement} onChange={setR('nom_etablissement')} required />
            </label>
            <label>Adresse complète
              <input type="text" placeholder="12 rue de la Paix, 75001 Paris" value={resto.adresse} onChange={setR('adresse')} required />
            </label>
            <label>SIRET <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>(14 chiffres)</span>
              <input type="text" placeholder="12345678901234" maxLength={14} value={resto.siret} onChange={setR('siret')} required />
            </label>
            <label>Téléphone <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>(optionnel)</span>
              <input type="tel" placeholder="01 23 45 67 89" value={resto.telephone} onChange={setR('telephone')} />
            </label>
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer ma demande'}
            </button>
            <p className="auth-terms">Ton dossier sera examiné par notre équipe sous 48h.</p>
          </form>
        )}
      </div>
    </div>
  )
}

const STATUT_CANDIDATURE: Record<string, { label: string; color: string }> = {
  en_attente: { label: '⏳ En attente de validation', color: '#f59e0b' },
  valide:     { label: '✅ Acceptée', color: '#22c55e' },
  refuse:     { label: '❌ Refusée', color: '#ef4444' },
}

const CONTREPARTIE_LABEL: Record<string, string> = {
  story: '📱 Story',
  post:  '📸 Post',
  reel:  '🎬 Reel / Vidéo',
}

type MaCandidature = {
  id: number
  statut: string
  date_candidature: string
  lien_publication: string | null
  capture_story: string | null
  post_publie: boolean
  offres: {
    titre: string
    contrepartie: string
    valeur_indicative: number
    restaurants: { nom: string; adresse: string }
  } | null
}

type Profil = {
  id: number
  nom: string
  email: string
  reseau: string
  abonnes: number
  statut: string
  date_inscription: string
}

function MonEspace({ utilisateur, onRetour, onNomChange }: { utilisateur: Utilisateur; onRetour: () => void; onNomChange: (nom: string) => void }) {
  const [onglet, setOnglet] = useState<'candidatures' | 'profil'>('candidatures')
  const [candidatures, setCandidatures] = useState<MaCandidature[]>([])
  const [loadingCand, setLoadingCand] = useState(true)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [form, setForm] = useState({ nom: '', reseau: '', abonnes: '', mot_de_passe: '' })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [liens, setLiens] = useState<Record<number, string>>({})
  const [pubMsg, setPubMsg] = useState<Record<number, string>>({})
  const [uploading, setUploading] = useState<Record<number, boolean>>({})

  const token = localStorage.getItem('token')

  const soumettreLien = async (candId: number) => {
    const lien = liens[candId]
    if (!lien) return
    const r = await fetch(`${API}/mon-espace/candidatures/${candId}/publication`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ lien_publication: lien }),
    })
    const data = await r.json()
    if (r.ok) {
      setPubMsg(prev => ({ ...prev, [candId]: '✅ ' + data.message }))
      setCandidatures(prev => prev.map(c => c.id === candId ? { ...c, post_publie: true, lien_publication: lien } : c))
    } else {
      setPubMsg(prev => ({ ...prev, [candId]: '❌ ' + data.error }))
    }
  }

  const soumettreCapture = async (candId: number, file: File) => {
    setUploading(prev => ({ ...prev, [candId]: true }))
    try {
      // Upload du fichier
      const uploadR = await fetch(`${API}/mon-espace/candidatures/${candId}/upload-story`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': file.type },
        body: file,
      })
      const uploadData = await uploadR.json()
      if (!uploadR.ok) { setPubMsg(prev => ({ ...prev, [candId]: '❌ ' + uploadData.error })); return }

      // Enregistrer l'URL
      const r = await fetch(`${API}/mon-espace/candidatures/${candId}/publication`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ capture_story: uploadData.url }),
      })
      const data = await r.json()
      if (r.ok) {
        setPubMsg(prev => ({ ...prev, [candId]: '✅ ' + data.message }))
        setCandidatures(prev => prev.map(c => c.id === candId ? { ...c, post_publie: true, capture_story: uploadData.url } : c))
      } else {
        setPubMsg(prev => ({ ...prev, [candId]: '❌ ' + data.error }))
      }
    } catch {
      setPubMsg(prev => ({ ...prev, [candId]: '❌ Erreur réseau, réessaie.' }))
    } finally {
      setUploading(prev => ({ ...prev, [candId]: false }))
    }
  }

  useEffect(() => {
    fetch(`${API}/mon-espace/candidatures`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => { setCandidatures(data); setLoadingCand(false) })
      .catch(() => setLoadingCand(false))
  }, [])

  useEffect(() => {
    if (onglet !== 'profil' || profil) return
    fetch(`${API}/mon-espace/profil`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        setProfil(data)
        setForm({ nom: data.nom, reseau: data.reseau, abonnes: String(data.abonnes), mot_de_passe: '' })
      })
  }, [onglet])

  const sauvegarder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const body: Record<string, string | number> = { nom: form.nom, reseau: form.reseau, abonnes: Number(form.abonnes) }
    if (form.mot_de_passe) body.mot_de_passe = form.mot_de_passe
    const r = await fetch(`${API}/mon-espace/profil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    setSaving(false)
    if (r.ok) {
      setMsg('✅ Profil mis à jour !')
      onNomChange(form.nom)
      const stored = JSON.parse(localStorage.getItem('utilisateur') || '{}')
      localStorage.setItem('utilisateur', JSON.stringify({ ...stored, nom: form.nom }))
    } else {
      setMsg(`❌ ${data.error}`)
    }
  }

  const STATUT_PROFIL: Record<string, { label: string; color: string }> = {
    en_attente: { label: '⏳ En attente de validation', color: '#f59e0b' },
    valide:     { label: '✅ Compte validé', color: '#22c55e' },
    refuse:     { label: '❌ Compte refusé', color: '#ef4444' },
  }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', padding: '0 0 60px' }}>
      <nav className="lp-nav">
        <span className="lp-logo">Pop Fluence</span>
        <button className="btn btn-ghost btn-sm" onClick={onRetour}>← Retour aux offres</button>
      </nav>

      <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 4 }}>
          Bonjour {utilisateur.nom} 👋
        </h1>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 8, margin: '24px 0 32px', borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
          {(['candidatures', 'profil'] as const).map(o => (
            <button key={o} onClick={() => setOnglet(o)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontWeight: 600, fontSize: '0.95rem',
              color: onglet === o ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: onglet === o ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {o === 'candidatures' ? '📋 Mes candidatures' : '👤 Mon profil'}
            </button>
          ))}
        </div>

        {/* Candidatures */}
        {onglet === 'candidatures' && (
          <>
            {loadingCand && <p>Chargement…</p>}
            {!loadingCand && candidatures.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem' }}>🍽️</p>
                <p>Tu n'as pas encore candidaté à une offre.</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onRetour}>Voir les offres</button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {candidatures.map(c => {
                const statut = STATUT_CANDIDATURE[c.statut] ?? { label: c.statut, color: '#888' }
                return (
                  <div key={c.id} style={{
                    background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '20px 24px', display: 'flex',
                    flexDirection: 'column', gap: 12,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{c.offres?.titre ?? '—'}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          🍽️ {c.offres?.restaurants?.nom ?? '—'} · {c.offres?.restaurants?.adresse ?? ''}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                          {CONTREPARTIE_LABEL[c.offres?.contrepartie ?? ''] ?? ''}
                          {c.offres?.valeur_indicative ? ` · Valeur ${c.offres.valeur_indicative} €` : ''}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                          Candidaté le {new Date(c.date_candidature).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: statut.color, whiteSpace: 'nowrap' }}>
                        {statut.label}
                      </span>
                    </div>

                    {/* Bloc preuve de publication */}
                    {c.statut === 'valide' && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        {c.post_publie ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: '0.88rem' }}>
                            <span style={{ color: '#22c55e', fontWeight: 700 }}>✅ Publication soumise</span>
                            {c.lien_publication && (
                              <a href={c.lien_publication} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Voir le post →</a>
                            )}
                            {c.capture_story && (
                              <a href={c.capture_story} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Voir la capture →</a>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 10 }}>
                              🎉 Candidature acceptée ! Soumets ta preuve de publication après ton repas.
                            </p>

                            {c.offres?.contrepartie === 'story' ? (
                              // Story → capture d'écran
                              <div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                                  Les stories n'ont pas de lien permanent. Envoie une capture d'écran de ta story.
                                </p>
                                <label style={{
                                  display: 'inline-block', padding: '8px 16px', borderRadius: 8,
                                  background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                                }}>
                                  {uploading[c.id] ? 'Envoi…' : '📷 Choisir une capture'}
                                  <input type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) soumettreCapture(c.id, f) }}
                                  />
                                </label>
                              </div>
                            ) : (
                              // Post ou Reel → lien URL
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <input
                                  type="url"
                                  placeholder={c.offres?.contrepartie === 'reel' ? 'https://www.instagram.com/reel/...' : 'https://www.instagram.com/p/...'}
                                  value={liens[c.id] ?? ''}
                                  onChange={e => setLiens(prev => ({ ...prev, [c.id]: e.target.value }))}
                                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', minWidth: 200 }}
                                />
                                <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => soumettreLien(c.id)}>
                                  Envoyer
                                </button>
                              </div>
                            )}

                            {pubMsg[c.id] && (
                              <p style={{ fontSize: '0.85rem', marginTop: 6, color: pubMsg[c.id].startsWith('✅') ? '#22c55e' : '#ef4444' }}>
                                {pubMsg[c.id]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Profil */}
        {onglet === 'profil' && (
          <div style={{ maxWidth: 480 }}>
            {profil && (
              <div style={{
                background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                borderRadius: 12, padding: '16px 20px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Statut du compte</p>
                  <p style={{ color: STATUT_PROFIL[profil.statut]?.color ?? '#888', fontWeight: 700 }}>
                    {STATUT_PROFIL[profil.statut]?.label ?? profil.statut}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={sauvegarder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                Prénom / Pseudo
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                Réseau principal
                <select value={form.reseau} onChange={e => setForm(f => ({ ...f, reseau: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }}>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                Nombre d'abonnés
                <input type="number" min="1000" value={form.abonnes} onChange={e => setForm(f => ({ ...f, abonnes: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
                Nouveau mot de passe <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(laisser vide pour ne pas changer)</span>
                <input type="password" placeholder="••••••••" value={form.mot_de_passe} onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
              </label>
              {msg && <p style={{ color: msg.startsWith('✅') ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{msg}</p>}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [page, setPage] = useState<'home' | 'map' | 'espace' | 'restaurateur'>('home')
  const [authOpen, setAuthOpen] = useState(false)
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(() => {
    try { return JSON.parse(localStorage.getItem('utilisateur') || 'null') } catch { return null }
  })
  const [candidatureEnvoyee, setCandidatureEnvoyee] = useState<Record<number, string>>({})
  useScrollReveal()

  const deconnexion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('utilisateur')
    setUtilisateur(null)
  }

  const candidater = async (offreId: number) => {
    if (!utilisateur) { setAuthOpen(true); return }
    const token = localStorage.getItem('token')
    setCandidatureEnvoyee(prev => ({ ...prev, [offreId]: 'chargement' }))
    try {
      const r = await fetch(`${API}/candidatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ offre_id: offreId }),
      })
      const data = await r.json()
      if (!r.ok) {
        setCandidatureEnvoyee(prev => ({ ...prev, [offreId]: data.error }))
      } else {
        setCandidatureEnvoyee(prev => ({ ...prev, [offreId]: 'ok' }))
      }
    } catch {
      setCandidatureEnvoyee(prev => ({ ...prev, [offreId]: 'Erreur réseau, réessaie.' }))
    }
  }
  const [offres, setOffres] = useState<Offre[]>([])
  const [fetchError, setFetchError] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    fetch('https://mon-api-rqm7.onrender.com/offres')
      .then(r => r.json())
      .then(offresData => {
        setOffres(offresData)
        setFetchLoading(false)
      })
      .catch(() => { setFetchError(true); setFetchLoading(false) })
  }, [])

  if (page === 'restaurateur') return (
    <InscriptionRestaurateur
      onRetour={() => setPage('home')}
      onConnexion={(u) => setUtilisateur(u)}
    />
  )

  if (page === 'espace' && utilisateur) {
    if (utilisateur.role === 'restaurateur') return (
      <EspaceRestaurateur utilisateur={utilisateur} onRetour={() => setPage('home')} />
    )
    return (
      <MonEspace
        utilisateur={utilisateur}
        onRetour={() => setPage('home')}
        onNomChange={nom => setUtilisateur(u => u ? { ...u, nom } : u)}
      />
    )
  }

  if (page === 'map') return (
    <div style={{ background: 'var(--bg)', minHeight: '100svh' }}>
      <nav className="lp-nav">
        <span className="lp-logo">Pop Fluence</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('home')}>← Accueil</button>
          <button className="btn btn-ghost btn-sm theme-toggle" onClick={toggle}>
            {theme === 'dark' ? '☀️ Clair' : '🌙 Sombre'}
          </button>
        </div>
      </nav>
      <MapPage />
    </div>
  )

  return (
    <div className="landing">
      <nav className="lp-nav">
        <span className="lp-logo">Pop Fluence</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('map')}>🗺 Carte</button>
          <button className="btn btn-ghost btn-sm theme-toggle" onClick={toggle} aria-label="Changer le thème">
            {theme === 'dark' ? '☀️ Clair' : '🌙 Sombre'}
          </button>
          {utilisateur ? (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('espace')}>👤 Mon Espace</button>
              <button className="btn btn-ghost btn-sm" onClick={deconnexion}>Déconnexion</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm nav-login" onClick={() => setAuthOpen(true)}>Connexion / Inscription</button>
          )}
        </div>
      </nav>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onConnexion={(u) => setUtilisateur(u)} />}
      {/* HERO */}
      <header className="lp-hero">
        <div className="lp-hero-badge">Pour les créateurs de contenu</div>
        <h1 className="lp-hero-title">
          <span className="highlight">Mange</span> gratuitement.<br />Crée du contenu.
        </h1>
        <p className="lp-hero-sub">
          Les meilleurs restaurants t'offrent leur menu dégustation — entrée, plat, dessert et boissons —
          en échange d'une publication authentique sur tes réseaux. Zéro euro à débourser.
          Juste du contenu sincère et une communauté de <strong>minimum 1 000 abonnés</strong>.
        </p>
        <div className="lp-hero-cta">
          <a href="#restaurants" className="btn btn-primary">Voir les restaurants</a>
          <a href="#concept" className="btn btn-ghost">Comment ça marche</a>
        </div>
        <div className="lp-hero-stats">
          <div className="stat"><span className="stat-num">120+</span><span>Restaurants partenaires</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">3 400+</span><span>Influenceurs inscrits</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">0 €</span><span>Frais d'inscription</span></div>
        </div>
      </header>

      {/* CONCEPT SECTION */}
      <section className="lp-concept" id="concept">
        <div className="concept-inner">
          <div className="concept-text">
            <span className="concept-tag">Le principe</span>
            <h2 className="section-title left">Dégustation gratuite<br />contre visibilité</h2>
            <p className="concept-desc">
              Pop Fluence repose sur un échange simple et gagnant-gagnant : le restaurant t'invite à table,
              tu lui offres de la visibilité auprès de ta communauté. Pas de cachet, pas d'agence, pas de contrat compliqué.
            </p>
            <ul className="concept-list">
              <li>
                <span className="concept-icon">🍽️</span>
                <div>
                  <strong>Repas 100 % offert</strong>
                  <span>Entrée, plat, dessert et boissons inclus — valeur moyenne 45 € à 90 €.</span>
                </div>
              </li>
              <li>
                <span className="concept-icon">📸</span>
                <div>
                  <strong>Une story + un post dans les 7 jours</strong>
                  <span>Contenu authentique, sans script imposé. Tu gardes ta ligne éditoriale.</span>
                </div>
              </li>
              <li>
                <span className="concept-icon">👥</span>
                <div>
                  <strong>1 000 abonnés minimum requis</strong>
                  <span>Ce seuil garantit une vraie portée pour le restaurant partenaire. Instagram, TikTok ou YouTube — peu importe le réseau.</span>
                </div>
              </li>
              <li>
                <span className="concept-icon">✅</span>
                <div>
                  <strong>Validation sous 48 h</strong>
                  <span>Le restaurant consulte ton profil et confirme rapidement. Tu reçois une notification dès l'accord.</span>
                </div>
              </li>
            </ul>
          </div>
          <div className="concept-badge-col">
            <div className="concept-badge">
              <span className="badge-num">1 000</span>
              <span className="badge-label">abonnés minimum</span>
              <span className="badge-sub">Instagram · TikTok · YouTube</span>
            </div>
            <p className="concept-note">
              Pas encore 1 000 abonnés ? Inscris-toi quand même — tu recevras une alerte dès que tu atteins le seuil.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how" id="how">
        <h2 className="section-title">Comment ça marche</h2>
        <div className="steps">
          <div className="step reveal reveal-delay-1">
            <div className="step-num">1</div>
            <h3>Vérifie ton éligibilité</h3>
            <p>Tu as au moins <strong>1 000 abonnés</strong> sur Instagram, TikTok ou YouTube ? Tu es éligible. Crée ton profil en 2 minutes.</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step reveal reveal-delay-2">
            <div className="step-num">2</div>
            <h3>Choisis un restaurant</h3>
            <p>Géolocalise-toi pour voir les établissements proches et leur seuil d'abonnés. Filtre par cuisine, quartier ou score.</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step reveal reveal-delay-3">
            <div className="step-num">3</div>
            <h3>Candidate & déguste</h3>
            <p>Partage ton profil. Le restaurant valide sous 48 h. Tu dégustes gratuitement et publies dans les 7 jours.</p>
          </div>
        </div>
      </section>

      {/* OFFRES */}
      <section className="lp-restaurants" id="restaurants">
        <div className="restaurants-header">
          <h2 className="section-title">Offres disponibles</h2>
          <p className="section-sub">Candidate à un repas gratuit en échange d'une publication</p>
        </div>
        {fetchLoading && <p className="geo-error">Chargement des offres…</p>}
        {fetchError && <p className="geo-error">Impossible de charger les offres.</p>}
        {!fetchLoading && !fetchError && offres.length === 0 && (
          <p className="geo-error">Aucune offre disponible pour le moment. Reviens bientôt !</p>
        )}
        <div className="restaurant-grid">
          {offres.map((o) => (
            <div className="restaurant-card" key={o.id}>
              <div className="card-img-wrap">
                <img
                  src={o.restaurants?.image || getPhoto(o.description || '')}
                  alt={o.restaurants?.nom}
                  className="card-img"
                />
                <div className="card-badge">{CONTREPARTIE_LABEL[o.contrepartie]}</div>
              </div>
              <div className="card-body">
                <div className="card-meta">{o.restaurants?.nom} · {o.restaurants?.adresse}</div>
                <h3 className="card-title">{o.titre}</h3>
                {o.menu && <p className="card-desc">{o.menu}</p>}
                <div style={{ display: 'flex', gap: 8, margin: '8px 0', flexWrap: 'wrap' }}>
                  {o.valeur_indicative && (
                    <span className="card-chip">💶 {o.valeur_indicative} €</span>
                  )}
                  <span className="card-chip">
                    👥 {o.tranche_min.toLocaleString('fr-FR')}
                    {o.tranche_max ? ` – ${o.tranche_max.toLocaleString('fr-FR')}` : '+'} abonnés
                  </span>
                  <span className="card-chip">🪑 {o.places_restantes} place{o.places_restantes > 1 ? 's' : ''}</span>
                </div>
                {o.conditions && <p className="card-desc" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ℹ️ {o.conditions}</p>}
                {candidatureEnvoyee[o.id] === 'ok' ? (
                  <div className="btn btn-full" style={{ background: 'var(--success, #22c55e)', color: '#fff', textAlign: 'center', padding: '10px', borderRadius: 8 }}>
                    ✅ Candidature envoyée !
                  </div>
                ) : (
                  <>
                    <button
                      className="btn btn-primary btn-full"
                      disabled={candidatureEnvoyee[o.id] === 'chargement'}
                      onClick={() => candidater(o.id)}
                    >
                      {candidatureEnvoyee[o.id] === 'chargement' ? 'Envoi…' : 'Je candidate'}
                    </button>
                    {candidatureEnvoyee[o.id] && candidatureEnvoyee[o.id] !== 'chargement' && (
                      <p style={{ color: 'var(--error, #ef4444)', fontSize: '0.8rem', marginTop: 6 }}>
                        {candidatureEnvoyee[o.id]}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <p>© 2026 Pop Fluence — Tous droits réservés</p>
        <p style={{ marginTop: 12 }}>
          Vous êtes restaurateur ?{' '}
          <button onClick={() => setPage('restaurateur')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', fontSize: 'inherit' }}>
            Rejoignez la plateforme
          </button>
        </p>
      </footer>
    </div>
  )
}
