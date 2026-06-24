import { useState, useEffect } from 'react'
import './App.css'
import MapPage from './MapPage'

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

const CONTREPARTIE_LABEL: Record<string, string> = {
  story: '📱 Story',
  post: '📸 Post',
  reel: '🎬 Reel / Vidéo',
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
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [form, setForm] = useState({ email: '', password: '', name: '', network: '', followers: '' })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErreur('')
  }

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

  const handleInscription = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch(`${API}/auth/inscription-influenceur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.name,
          email: form.email,
          mot_de_passe: form.password,
          reseau: form.network,
          abonnes: Number(form.followers),
        }),
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
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>✕</button>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErreur('') }}>
            Connexion
          </button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setErreur('') }}>
            Inscription
          </button>
        </div>

        {tab === 'login' ? (
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
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleInscription}>
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
      </div>
    </div>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [page, setPage] = useState<'home' | 'map'>('home')
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
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>👋 {utilisateur.nom}</span>
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
      </footer>
    </div>
  )
}
