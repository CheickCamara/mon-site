import { useState, useEffect } from 'react'
import './App.css'
import MapPage from './MapPage'
import InscriptionRestaurateur from './InscriptionRestaurateur'
import EspaceRestaurateur from './EspaceRestaurateur'
import Messagerie from './Messagerie'
import ProfilRestaurant from './ProfilRestaurant'

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
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
  restaurants: { id: number; nom: string; adresse: string; image: string }
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
  const [inscriptionOk, setInscriptionOk] = useState(false)
  const [vueMdp, setVueMdp] = useState<'connexion' | 'oublie' | 'ok'>('connexion')
  const [emailOublie, setEmailOublie] = useState('')
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
      setInscriptionOk(true)
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

        {inscriptionOk ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: 12 }}>Inscription reçue !</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
              Ton profil est en cours de vérification par notre équipe.<br />
              Tu recevras un email à <strong>{form.email}</strong> dès que ton compte sera activé.
            </p>
            <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 8, color: 'var(--primary)' }}>⏱ Délai de validation</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>La validation prend généralement moins de 24h. Vérifie aussi tes spams.</p>
            </div>
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Fermer
            </button>
          </div>
        ) : (<>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => changeTab('login')}>Connexion</button>
          <button className={`auth-tab ${tab === 'influenceur' ? 'active' : ''}`} onClick={() => changeTab('influenceur')}>Influenceur</button>
          <button className={`auth-tab ${tab === 'restaurateur' ? 'active' : ''}`} onClick={() => changeTab('restaurateur')}>Restaurateur</button>
        </div>

        {tab === 'login' && (<>
          {vueMdp === 'connexion' && (
          <form className="auth-form" onSubmit={handleConnexion}>
            <p className="auth-subtitle">Content de te revoir 👋</p>
            <label>Adresse e-mail
              <input type="email" placeholder="toi@exemple.com" value={form.email} onChange={set('email')} required />
            </label>
            <label>Mot de passe
              <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </label>
            <button type="button" className="auth-forgot" onClick={() => { setVueMdp('oublie'); setErreur('') }}>
              Mot de passe oublié ?
            </button>
            {erreur && <p className="auth-error">{erreur}</p>}
            <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
            <p className="auth-terms" style={{ textAlign: 'center' }}>
              Pas encore de compte ?{' '}
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }} onClick={() => changeTab('influenceur')}>S'inscrire</button>
            </p>
          </form>
          )}

          {vueMdp === 'oublie' && (
          <form className="auth-form" onSubmit={async e => {
            e.preventDefault(); setLoading(true)
            await fetch(`${API}/auth/mot-de-passe-oublie`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailOublie }) })
            setLoading(false); setVueMdp('ok')
          }}>
            <p className="auth-subtitle">🔑 Mot de passe oublié</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', marginBottom: 4 }}>Entre ton adresse email et nous t'enverrons un lien de réinitialisation.</p>
            <label>Adresse e-mail
              <input type="email" placeholder="toi@exemple.com" value={emailOublie} onChange={e => setEmailOublie(e.target.value)} required />
            </label>
            <button type="submit" className="btn btn-primary btn-full auth-submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
            <button type="button" className="auth-forgot" onClick={() => setVueMdp('connexion')}>← Retour à la connexion</button>
          </form>
          )}

          {vueMdp === 'ok' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>📬</p>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Email envoyé !</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text)', marginBottom: 20 }}>Si un compte existe avec cette adresse, tu recevras un lien valable 1 heure. Vérifie aussi tes spams.</p>
            <button type="button" className="auth-forgot" onClick={() => { setVueMdp('connexion'); setEmailOublie('') }}>← Retour à la connexion</button>
          </div>
          )}
        </>)}

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
        </>)}
      </div>
    </div>
  )
}

const STATUT_CANDIDATURE: Record<string, { label: string; color: string }> = {
  en_attente: { label: '⏳ En attente de validation', color: '#f59e0b' },
  valide:     { label: '✅ Acceptée', color: '#22c55e' },
  refuse:     { label: '❌ Refusée', color: '#ef4444' },
  honoree:    { label: '🏆 Collaboration honorée', color: '#7c3aed' },
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
  collaborations_honorees: number
  pseudo: string | null
}

function MonEspace({ utilisateur, onRetour, onNomChange }: { utilisateur: Utilisateur; onRetour: () => void; onNomChange: (nom: string) => void }) {
  const [onglet, setOnglet] = useState<'candidatures' | 'profil'>('candidatures')
  const [candidatures, setCandidatures] = useState<MaCandidature[]>([])
  const [loadingCand, setLoadingCand] = useState(true)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [form, setForm] = useState({ nom: '', reseau: '', abonnes: '', mot_de_passe: '', pseudo: '' })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [liens, setLiens] = useState<Record<number, string>>({})
  const [pubMsg, setPubMsg] = useState<Record<number, string>>({})
  const [messagerieCand, setMessagerieCand] = useState<{ id: number; nom: string } | null>(null)
  const [nonLus, setNonLus] = useState<Record<number, number>>({})
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
  const [avisDeposes, setAvisDeposes] = useState<Record<number, { note: number; commentaire: string | null }>>({})
  const [avisForm, setAvisForm] = useState<Record<number, { note: number; commentaire: string }>>({})
  const [avisMsg, setAvisMsg] = useState<Record<number, string>>({})
  const [noteMoyenne, setNoteMoyenne] = useState<{ moyenne: string | null; total: number } | null>(null)

  const soumettreAvis = async (candId: number) => {
    const form = avisForm[candId]
    if (!form || !form.note) return
    const res = await fetch(`${API}/avis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      const formData = new FormData()
      formData.append('fichier', file)
      const uploadR = await fetch(`${API}/mon-espace/candidatures/${candId}/upload-story`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
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
      .then(r => r.json()).then(async (data) => {
        setCandidatures(data)
        setLoadingCand(false)
        const valides = data.filter((c: MaCandidature) => c.statut === 'valide')
        const counts = await Promise.all(valides.map((c: MaCandidature) =>
          fetch(`${API}/messages/${c.id}/non-lus`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json()).then(d => ({ id: c.id, count: d.non_lus ?? 0 })).catch(() => ({ id: c.id, count: 0 }))
        ))
        const map: Record<number, number> = {}
        counts.forEach(({ id, count }) => { map[id] = count })
        setNonLus(map)
        // Charger les avis déjà déposés pour les collaborations honorées
        const honorees = data.filter((c: MaCandidature) => c.statut === 'honoree')
        const avisExistants: Record<number, { note: number; commentaire: string | null }> = {}
        await Promise.all(honorees.map((c: MaCandidature) =>
          fetch(`${API}/avis/${c.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json()).then(d => { if (d) avisExistants[c.id] = d }).catch(() => {})
        ))
        setAvisDeposes(avisExistants)
      })
      .catch(() => setLoadingCand(false))
  }, [])

  useEffect(() => {
    if (onglet !== 'profil' || profil) return
    fetch(`${API}/mon-espace/profil`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        setProfil(data)
        setForm({ nom: data.nom, reseau: data.reseau, abonnes: String(data.abonnes), mot_de_passe: '', pseudo: data.pseudo ?? '' })
      })
    fetch(`${API}/mon-espace/avis-recus`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setNoteMoyenne(data))
  }, [onglet])

  const sauvegarder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const body: Record<string, string | number | null> = { nom: form.nom, reseau: form.reseau, abonnes: Number(form.abonnes), pseudo: form.pseudo || null }
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
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: statut.color, whiteSpace: 'nowrap' }}>
                          {statut.label}
                        </span>
                        {c.statut === 'valide' && (
                          <button
                            onClick={() => { setMessagerieCand({ id: c.id, nom: c.offres?.restaurants?.nom ?? 'Restaurant' }); setNonLus(prev => ({ ...prev, [c.id]: 0 })) }}
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
                        )}
                      </div>
                    </div>

                    {/* Bloc notation — collaboration honorée */}
                    {c.statut === 'honoree' && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        {avisDeposes[c.id] ? (
                          <p style={{ fontSize: '0.88rem', color: '#22c55e', fontWeight: 600 }}>
                            ⭐ Tu as noté ce restaurant {avisDeposes[c.id].note}/5
                            {avisDeposes[c.id].commentaire && ` — "${avisDeposes[c.id].commentaire}"`}
                          </p>
                        ) : (
                          <div>
                            <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8 }}>
                              🏆 Collaboration terminée ! Comment s'est passée l'expérience ?
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
                            <textarea
                              placeholder="Un commentaire ? (optionnel)"
                              value={avisForm[c.id]?.commentaire ?? ''}
                              onChange={e => setAvisForm(p => ({ ...p, [c.id]: { note: p[c.id]?.note ?? 0, commentaire: e.target.value } }))}
                              rows={2}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }}
                            />
                            <button
                              className="btn btn-primary"
                              style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                              disabled={!avisForm[c.id]?.note}
                              onClick={() => soumettreAvis(c.id)}
                            >
                              Envoyer mon avis
                            </button>
                            {avisMsg[c.id] && <p style={{ fontSize: '0.85rem', marginTop: 6, color: avisMsg[c.id].startsWith('⭐') ? '#22c55e' : '#ef4444' }}>{avisMsg[c.id]}</p>}
                          </div>
                        )}
                      </div>
                    )}

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

        {/* Messagerie */}
        {messagerieCand && (
          <Messagerie
            candidatureId={messagerieCand.id}
            monRole="influenceur"
            nomInterlocuteur={messagerieCand.nom}
            onFermer={() => setMessagerieCand(null)}
          />
        )}

        {/* Profil */}
        {onglet === 'profil' && (
          <div style={{ maxWidth: 480 }}>
            {profil && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{
                  flex: 1, minWidth: 160,
                  background: 'var(--card-bg, var(--surface))', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Statut du compte</p>
                    <p style={{ color: STATUT_PROFIL[profil.statut]?.color ?? '#888', fontWeight: 700, margin: 0 }}>
                      {STATUT_PROFIL[profil.statut]?.label ?? profil.statut}
                    </p>
                  </div>
                </div>
                <div style={{
                  flex: 1, minWidth: 160,
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: '1.8rem' }}>🏆</span>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.6rem', color: '#fff', margin: 0, lineHeight: 1 }}>
                      {profil.collaborations_honorees}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', margin: 0 }}>
                      collaboration{profil.collaborations_honorees !== 1 ? 's' : ''} honorée{profil.collaborations_honorees !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div style={{
                  flex: 1, minWidth: 160,
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: '1.8rem' }}>⭐</span>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.6rem', color: '#fff', margin: 0, lineHeight: 1 }}>
                      {noteMoyenne?.moyenne ?? '—'}<span style={{ fontSize: '1rem', fontWeight: 400 }}>/5</span>
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', margin: 0 }}>
                      {noteMoyenne?.total ? `${noteMoyenne.total} avis reçu${noteMoyenne.total > 1 ? 's' : ''}` : 'Aucun avis'}
                    </p>
                  </div>
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
                Pseudo {form.reseau === 'instagram' ? 'Instagram' : 'TikTok'}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
                  <span style={{ padding: '10px 12px', color: 'var(--text-muted)', borderRight: '1px solid var(--border)', background: 'var(--surface)', fontSize: '1rem' }}>@</span>
                  <input
                    placeholder={form.reseau === 'instagram' ? 'ton_pseudo_instagram' : 'ton_pseudo_tiktok'}
                    value={form.pseudo}
                    onChange={e => setForm(f => ({ ...f, pseudo: e.target.value.replace(/^@/, '') }))}
                    style={{ flex: 1, padding: '10px 14px', border: 'none', background: 'transparent', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  Permet aux restaurants de consulter ton profil public
                </span>
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

function ResetMotDePasse({ token, onRetour }: { token: string; onRetour: () => void }) {
  const [mdp, setMdp] = useState('')
  const [mdp2, setMdp2] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [erreur, setErreur] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mdp !== mdp2) { setErreur('Les mots de passe ne correspondent pas'); return }
    if (mdp.length < 6) { setErreur('Minimum 6 caractères'); return }
    setLoading(true); setErreur('')
    const r = await fetch(`${API}/auth/reset-mot-de-passe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, nouveau_mot_de_passe: mdp }),
    })
    const data = await r.json()
    setLoading(false)
    if (r.ok) setMsg('✅ Mot de passe mis à jour ! Tu peux te connecter.')
    else setErreur(data.error)
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a0533, #2d0a4e)', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: 8, color: '#1a0533' }}>🔑 Nouveau mot de passe</h2>
        <p style={{ color: '#7c6e8a', fontSize: '0.9rem', marginBottom: 24 }}>Choisis un nouveau mot de passe pour ton compte.</p>
        {msg ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#22c55e', fontWeight: 700, marginBottom: 20 }}>{msg}</p>
            <button className="btn btn-primary" onClick={onRetour} style={{ width: '100%' }}>Retour à l'accueil</button>
          </div>
        ) : (
          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
              Nouveau mot de passe
              <input type="password" placeholder="••••••••" value={mdp} onChange={e => setMdp(e.target.value)} required
                style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
              Confirmer le mot de passe
              <input type="password" placeholder="••••••••" value={mdp2} onChange={e => setMdp2(e.target.value)} required
                style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' }} />
            </label>
            {erreur && <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>{erreur}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? 'Mise à jour…' : 'Enregistrer le nouveau mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [page, setPage] = useState<'home' | 'map' | 'espace' | 'restaurateur' | 'reset' | 'profil-restaurant'>('home')
  const [profilRestoId, setProfilRestoId] = useState<number | null>(null)
  const [resetToken, setResetToken] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(() => {
    try { return JSON.parse(localStorage.getItem('utilisateur') || 'null') } catch { return null }
  })
  const [candidatureEnvoyee, setCandidatureEnvoyee] = useState<Record<number, string>>({})
  const [notifCount, setNotifCount] = useState(0)
  useScrollReveal()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')
    if (token) { setResetToken(token); setPage('reset') }
  }, [])

  useEffect(() => {
    if (!utilisateur || utilisateur.role !== 'influenceur') return
    const token = localStorage.getItem('token')
    const depuis = localStorage.getItem('derniere_visite_espace') ?? ''
    fetch(`${API}/mon-espace/notifications${depuis ? `?depuis=${encodeURIComponent(depuis)}` : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => setNotifCount(d.count ?? 0)).catch(() => {})
  }, [utilisateur])

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

  if (page === 'reset') return (
    <ResetMotDePasse token={resetToken} onRetour={() => { setPage('home'); window.history.replaceState({}, '', '/') }} />
  )

  if (page === 'profil-restaurant' && profilRestoId) return (
    <ProfilRestaurant
      restaurantId={profilRestoId}
      onRetour={() => setPage('home')}
      estConnecte={!!utilisateur && utilisateur.role === 'influenceur'}
      token={localStorage.getItem('token')}
    />
  )

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
      <MapPage utilisateur={utilisateur} token={localStorage.getItem('token')} />
    </div>
  )

  return (
    <div className="landing">
      <nav className="lp-nav">
        <span className="lp-logo">Pop Fluence</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('map')}>🗺 <span className="nav-label">Carte</span></button>
          <button className="btn btn-ghost btn-sm theme-toggle" onClick={toggle} aria-label="Changer le thème">
            {theme === 'dark' ? '☀️' : '🌙'}<span className="nav-label"> {theme === 'dark' ? 'Clair' : 'Sombre'}</span>
          </button>
          {utilisateur ? (
            <>
              <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }} onClick={() => {
                setPage('espace')
                setNotifCount(0)
                localStorage.setItem('derniere_visite_espace', new Date().toISOString())
              }}>
                👤 <span className="nav-label">Mon Espace</span>
                {notifCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#ef4444', color: '#fff',
                    borderRadius: '50%', width: 18, height: 18,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{notifCount > 9 ? '9+' : notifCount}</span>
                )}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={deconnexion}>⏏ <span className="nav-label">Déconnexion</span></button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm nav-login" onClick={() => setAuthOpen(true)}>Connexion / Inscription</button>
          )}
        </div>
      </nav>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onConnexion={(u) => setUtilisateur(u)} />}
      {/* HERO */}
      {/* HERO */}
      <header className="lp-hero">
        <div className="lp-hero-blob lp-hero-blob-1" />
        <div className="lp-hero-blob lp-hero-blob-2" />
        <div className="lp-hero-blob lp-hero-blob-3" />
        <div className="lp-hero-badge">✨ Instagram · TikTok · Restauration</div>
        <h1 className="lp-hero-title">
          Mange gratuitement.<br /><span className="highlight">Crée du contenu.</span>
        </h1>
        <p className="lp-hero-sub">
          Pop Fluence connecte les créateurs de contenu avec les restaurants qui cherchent de la visibilité.
          Un repas offert contre une publication authentique. Sans agence, sans contrat compliqué.
        </p>
        <div className="lp-hero-cta">
          <a href="#influenceurs" className="btn btn-primary">🎬 Je suis influenceur</a>
          <a href="#restaurateurs" className="btn btn-ghost">🍽️ Je suis restaurateur</a>
        </div>
        <div className="lp-hero-stats">
          <div className="stat"><span className="stat-num">0 €</span><span>Frais d'inscription</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">1 000</span><span>abonnés minimum</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">48 h</span><span>délai de réponse</span></div>
        </div>
      </header>

      {/* PRINCIPE */}
      <section className="lp-concept" id="concept">
        <div className="concept-inner">
          <div className="concept-text">
            <span className="concept-tag">Le principe</span>
            <h2 className="section-title left">Un échange simple<br />et gagnant-gagnant</h2>
            <p className="concept-desc">
              Pop Fluence est une plateforme web de mise en relation géolocalisée entre influenceurs Instagram & TikTok
              et restaurateurs. Le restaurateur publie une offre de menu dégustation avec la contrepartie attendue.
              L'influenceur découvre les offres disponibles près de chez lui et candidate en un clic.
              Pas de cachet, pas d'agence, pas de contrat compliqué.
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
                  <strong>Contrepartie claire et cadrée</strong>
                  <span>Story, post ou reel — précisé dans chaque offre. Contenu authentique, sans script imposé.</span>
                </div>
              </li>
              <li>
                <span className="concept-icon">👥</span>
                <div>
                  <strong>1 000 abonnés minimum requis</strong>
                  <span>Ce seuil garantit une vraie portée pour le restaurant partenaire. Instagram ou TikTok.</span>
                </div>
              </li>
              <li>
                <span className="concept-icon">✅</span>
                <div>
                  <strong>Validation sous 48 h</strong>
                  <span>Le restaurant consulte ton profil vérifié et confirme rapidement. Notification immédiate.</span>
                </div>
              </li>
            </ul>
          </div>
          <div className="concept-badge-col">
            <div className="concept-badge">
              <span className="badge-num">1 000</span>
              <span className="badge-label">abonnés minimum</span>
              <span className="badge-sub">Instagram · TikTok</span>
            </div>
            <p className="concept-note">
              La plateforme encadre l'ensemble : candidature, validation, messagerie, preuve de publication et historique de fiabilité.
            </p>
          </div>
        </div>
      </section>

      {/* POUR LES INFLUENCEURS */}
      <section id="influenceurs" className="lp-section-influenceurs">
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="section-pill-influenceur">🎬 Pour les influenceurs</span>
            <h2 className="section-title" style={{ marginTop: 0, color: '#2d0a4e' }}>Accède à des collab' réelles.<br />Mange gratuitement.</h2>
            <p style={{ color: '#5b4d6e', maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontSize: '1.05rem' }}>
              Tu crées du contenu food ou lifestyle ? Trouve des restaurants qui veulent te recevoir
              près de chez toi, sans démarcher, avec les conditions claires dès le départ.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 44 }}>
            {[
              { icon: '📍', title: 'Offres géolocalisées', desc: 'Trouve les restaurants ouverts à une collab autour de toi, sans les démarcher.' },
              { icon: '⚡', title: 'Candidature en 1 clic', desc: 'Ton profil est prêt. Tu candidates, le restaurant répond sous 48 h.' },
              { icon: '🍽️', title: 'Repas 100 % offert', desc: 'Entrée, plat, dessert et boissons inclus. Valeur moyenne 45 € à 90 €.' },
              { icon: '🏆', title: 'Historique de fiabilité', desc: 'Chaque collab honorée renforce ton profil et ta crédibilité.' },
            ].map((item, i) => (
              <div key={item.title} className={`fun-card fun-card-influenceur reveal reveal-delay-${i + 1}`}>
                <span className="fun-card-icon">{item.icon}</span>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 8, color: '#2d0a4e' }}>{item.title}</h3>
                <p style={{ color: '#5b4d6e', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <a href="#restaurants" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>Voir les offres disponibles →</a>
          </div>
        </div>
      </section>

      {/* POUR LES RESTAURATEURS */}
      <section id="restaurateurs" className="lp-section-restaurateurs">
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="section-pill-restaurateur">🍽️ Pour les restaurateurs</span>
            <h2 className="section-title" style={{ marginTop: 0, color: '#78350f' }}>Des candidatures qualifiées.<br />Un retour garanti.</h2>
            <p style={{ color: '#92400e', maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontSize: '1.05rem' }}>
              Fini les repas offerts sans retour. Pop Fluence encadre chaque collaboration de A à Z :
              profil vérifié, preuve de publication et messagerie intégrée.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 44 }}>
            {[
              { icon: '🎯', title: 'Candidatures ciblées', desc: 'Définissez la tranche d\'abonnés souhaitée. Seuls les profils éligibles peuvent candidater.' },
              { icon: '🔍', title: 'Profils vérifiés', desc: 'Consultez réseau, abonnés et historique de fiabilité avant d\'accepter.' },
              { icon: '📢', title: 'Visibilité garantie', desc: 'La publication est prouvée via lien ou capture. Du contenu authentique à chaque fois.' },
              { icon: '💬', title: 'Messagerie intégrée', desc: 'Coordonnez le rendez-vous directement sur la plateforme. Tout est centralisé.' },
            ].map((item, i) => (
              <div key={item.title} className={`fun-card fun-card-restaurateur reveal reveal-delay-${i + 1}`}>
                <span className="fun-card-icon">{item.icon}</span>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 8, color: '#78350f' }}>{item.title}</h3>
                <p style={{ color: '#92400e', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', border: 'none', fontSize: '1rem', padding: '14px 32px', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }} onClick={() => setAuthOpen(true)}>
              Inscrire mon restaurant →
            </button>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="lp-how" id="how" style={{ background: 'var(--surface)' }}>
        <h2 className="section-title">Comment ça marche</h2>
        <div className="steps">
          <div className="step reveal reveal-delay-1">
            <div className="step-num">1</div>
            <h3>Crée ton profil</h3>
            <p>Influenceur ou restaurateur — inscription en 2 minutes. Compte vérifié, profil prêt à l'emploi.</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step reveal reveal-delay-2">
            <div className="step-num">2</div>
            <h3>Candidate ou publie</h3>
            <p>L'influenceur trouve une offre près de chez lui et candidate. Le restaurateur reçoit des candidatures filtrées et qualifiées.</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step reveal reveal-delay-3">
            <div className="step-num">3</div>
            <h3>Dégustation & publication</h3>
            <p>Le repas a lieu. L'influenceur publie son contenu et dépose la preuve sur la plateforme. La collaboration est honorée.</p>
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
                <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <span>{o.restaurants?.nom} · {o.restaurants?.adresse}</span>
                  {o.restaurants?.id && (
                    <button onClick={() => { setProfilRestoId(o.restaurants!.id); setPage('profil-restaurant') }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                      Voir le profil →
                    </button>
                  )}
                </div>
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
