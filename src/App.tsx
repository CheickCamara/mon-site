import { useState, useEffect } from 'react'
import './App.css'

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

const RESTAURANTS = [
  {
    id: 1,
    name: 'Le Jardin Secret',
    cuisine: 'Française gastronomique',
    city: 'Paris 8e',
    lat: 48.874,
    lng: 2.308,
    minFollowers: 10000,
    description: 'Menu dégustation 7 services avec accords mets-vins.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  },
  {
    id: 2,
    name: 'Umami House',
    cuisine: 'Japonaise fusion',
    city: 'Paris 2e',
    lat: 48.865,
    lng: 2.347,
    minFollowers: 5000,
    description: 'Omakase 10 pièces préparé par le chef Kenji.',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  },
  {
    id: 3,
    name: 'La Brasa',
    cuisine: 'Méditerranéenne',
    city: 'Lyon 6e',
    lat: 45.767,
    lng: 4.834,
    minFollowers: 3000,
    description: 'Dégustation autour des produits de saison et du feu de bois.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  },
  {
    id: 4,
    name: 'Azur & Sel',
    cuisine: 'Poissons & fruits de mer',
    city: 'Marseille',
    lat: 43.296,
    lng: 5.369,
    minFollowers: 8000,
    description: 'Plateau royal et menu homard en bord de mer.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80',
  },
  {
    id: 5,
    name: 'Maison Noire',
    cuisine: 'Bistrot moderne',
    city: 'Bordeaux',
    lat: 44.836,
    lng: -0.58,
    minFollowers: 2000,
    description: 'Menu surprise du marché en 5 temps, cave de 300 références.',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&q=80',
  },
  {
    id: 6,
    name: 'Épices & Âme',
    cuisine: 'Nord-Africaine',
    city: 'Paris 18e',
    lat: 48.889,
    lng: 2.347,
    minFollowers: 4000,
    description: 'Méchoui, bastilla et pastilla sucrée en format dégustation.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
  },
]

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatFollowers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'distance' | 'followers'>('followers')

  function locateMe() {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSortBy('distance')
        setLoading(false)
      },
      () => {
        setGeoError(true)
        setLoading(false)
      }
    )
  }

  const restaurants = [...RESTAURANTS]
    .map((r) => ({
      ...r,
      distance: userPos ? haversine(userPos.lat, userPos.lng, r.lat, r.lng) : null,
    }))
    .sort((a, b) => {
      if (sortBy === 'distance' && a.distance !== null && b.distance !== null)
        return a.distance - b.distance
      return a.minFollowers - b.minFollowers
    })

  return (
    <div className="landing">
      <nav className="lp-nav">
        <span className="lp-logo">Pop Fluence</span>
        <button className="btn btn-ghost btn-sm theme-toggle" onClick={toggle} aria-label="Changer le thème">
          {theme === 'dark' ? '☀️ Clair' : '🌙 Sombre'}
        </button>
      </nav>
      {/* HERO */}
      <header className="lp-hero">
        <div className="lp-hero-badge">Pour les créateurs de contenu</div>
        <h1 className="lp-hero-title">
          Mange gratuitement.<br />Crée du contenu.
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
          <div className="step">
            <div className="step-num">1</div>
            <h3>Trouve un restaurant</h3>
            <p>Utilise ta géolocalisation pour voir les établissements proches de toi et leur seuil d'abonnés minimum.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>Envoie ta candidature</h3>
            <p>Partage ton profil et tes statistiques. Le restaurant valide ta demande sous 48h.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
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
          <div className="restaurants-controls">
            <button
              className={`btn btn-sm ${sortBy === 'followers' ? 'btn-active' : 'btn-ghost'}`}
              onClick={() => setSortBy('followers')}
            >
              Par abonnés requis
            </button>
            <button
              className={`btn btn-sm ${sortBy === 'distance' && userPos ? 'btn-active' : 'btn-ghost'}`}
              onClick={userPos ? () => setSortBy('distance') : locateMe}
              disabled={loading}
            >
              {loading ? 'Localisation…' : userPos ? 'Par distance' : '📍 Près de moi'}
            </button>
          </div>
        </div>
        {geoError && (
          <p className="geo-error">Géolocalisation refusée — tri par abonnés par défaut.</p>
        )}
        <div className="restaurant-grid">
          {restaurants.map((r) => (
            <div className="restaurant-card" key={r.id}>
              <div className="card-img-wrap">
                <img src={r.image} alt={r.name} className="card-img" />
                <div className="card-badge">
                  <span className="badge-icon">👥</span>
                  {formatFollowers(r.minFollowers)} abonnés min.
                </div>
              </div>
              <div className="card-body">
                <div className="card-meta">{r.cuisine} · {r.city}</div>
                <h3 className="card-title">{r.name}</h3>
                <p className="card-desc">{r.description}</p>
                {r.distance !== null && (
                  <p className="card-distance">📍 {r.distance < 1 ? '<1' : r.distance.toFixed(0)} km</p>
                )}
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
