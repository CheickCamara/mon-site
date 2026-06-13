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

type Restaurant = {
  id: number
  nom: string
  adresse: string
  description: string
  telephone: string
  statut: string
  info: string
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


export default function App() {
  const { theme, toggle } = useTheme()
  const [page, setPage] = useState<'home' | 'map'>('home')
  useScrollReveal()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [fetchError, setFetchError] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/restaurants')
      .then(res => res.json())
      .then(data => { setRestaurants(data); setFetchLoading(false) })
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('map')}>🗺 Carte</button>
          <button className="btn btn-ghost btn-sm theme-toggle" onClick={toggle} aria-label="Changer le thème">
            {theme === 'dark' ? '☀️ Clair' : '🌙 Sombre'}
          </button>
        </div>
      </nav>
      {/* HERO */}
      <header className="lp-hero">
        <div className="lp-hero-badge">Pour les créateurs de contenu</div>
        <h1 className="lp-hero-title">
          <span className="highlight">Mange</span> gratuitement.<br />Crée du contenu.
        </h1>
        <p className="lp-hero-sub">
          Les meilleurs restaurants t'offrent leur menu dégustation en échange d'une publication
          authentique sur tes réseaux. Trouve l'établissement qui correspond à ta communauté.
        </p>
        <div className="lp-hero-cta">
          <a href="#restaurants" className="btn btn-primary">Voir les restaurants</a>
          <a href="#how" className="btn btn-ghost">Comment ça marche</a>
        </div>
        <div className="lp-hero-stats">
          <div className="stat"><span className="stat-num">120+</span><span>Restaurants partenaires</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">3 400+</span><span>Influenceurs inscrits</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">0 €</span><span>Frais d'inscription</span></div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="lp-how" id="how">
        <h2 className="section-title">Comment ça marche</h2>
        <div className="steps">
          <div className="step reveal reveal-delay-1">
            <div className="step-num">1</div>
            <h3>Trouve un restaurant</h3>
            <p>Utilise ta géolocalisation pour voir les établissements proches de toi et leur seuil d'abonnés minimum.</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step reveal reveal-delay-2">
            <div className="step-num">2</div>
            <h3>Envoie ta candidature</h3>
            <p>Partage ton profil et tes statistiques. Le restaurant valide ta demande sous 48h.</p>
          </div>
          <div className="step-connector">→</div>
          <div className="step reveal reveal-delay-3">
            <div className="step-num">3</div>
            <h3>Profite & publie</h3>
            <p>Tu dégustes gratuitement et tu postes une story + un post dans les 7 jours suivant ta visite.</p>
          </div>
        </div>
      </section>

      {/* RESTAURANTS */}
      <section className="lp-restaurants" id="restaurants">
        <div className="restaurants-header">
          <h2 className="section-title">Restaurants partenaires</h2>
        </div>
        {fetchLoading && <p className="geo-error">Chargement des restaurants…</p>}
        {fetchError && <p className="geo-error">Erreur : impossible de contacter le serveur (port 3001).</p>}
        <div className="restaurant-grid">
          {restaurants.map((r) => (
            <div className="restaurant-card" key={r.id}>
              <div className="card-img-wrap">
                <img src={getPhoto(r.description)} alt={r.nom} className="card-img" />
                {r.statut && <div className="card-badge">{r.statut}</div>}
              </div>
              <div className="card-body">
                <div className="card-meta">{r.description}</div>
                <h3 className="card-title">{r.nom}</h3>
                <p className="card-desc">{r.adresse}</p>
                {r.telephone && <p className="card-desc">{r.telephone}</p>}
                <button className="btn btn-primary btn-full">Je candidate</button>
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
