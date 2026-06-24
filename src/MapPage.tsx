import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import './MapPage.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const PHOTOS_PAR_CUISINE: Record<string, string> = {
  'japonais':   'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  'italien':    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  'français':   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  'française':  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  'mexicain':   'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  'libanais':   'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80',
  'burger':     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'poisson':    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80',
  'catalan':    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&q=80',
  'default':    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
}

function getPhoto(description: string): string {
  const desc = (description || '').toLowerCase()
  for (const [mot, url] of Object.entries(PHOTOS_PAR_CUISINE)) {
    if (desc.includes(mot)) return url
  }
  return PHOTOS_PAR_CUISINE['default']
}

const API = 'https://mon-api-rqm7.onrender.com'

type Restaurant = {
  id: number
  nom: string
  adresse: string
  description: string
  telephone: string
  statut: string
  lat: number | null
  lng: number | null
  image: string | null
}

type Offre = {
  id: number
  titre: string
  description: string
  contrepartie: string
  valeur_indicative: number | null
  places_restantes: number
  tranche_min: number | null
  tranche_max: number | null
}

function createCustomIcon(selected: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div class="map-marker ${selected ? 'map-marker--selected' : ''}">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
        ${selected ? '<div class="map-marker__ring"></div>' : ''}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

type Props = {
  utilisateur?: { id: number; nom: string; statut?: string } | null
  token?: string | null
}

export default function MapPage({ utilisateur, token }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [offres, setOffres] = useState<Offre[]>([])
  const [loadingOffres, setLoadingOffres] = useState(false)
  const [candidatureEnCours, setCandidatureEnCours] = useState<number | null>(null)
  const [msgMap, setMsgMap] = useState<Record<number, string>>({})
  const [avisResto, setAvisResto] = useState<{ moyenne: string | null; total: number } | null>(null)

  useEffect(() => {
    fetch('https://mon-api-rqm7.onrender.com/restaurants')
      .then(res => res.json())
      .then(data => setRestaurants(data))
  }, [])

  const filtered = restaurants.filter(r =>
    r.nom.toLowerCase().includes(search.toLowerCase()) ||
    r.adresse.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  )

  const avecCoords = filtered.filter(r => r.lat != null && r.lng != null && !isNaN(r.lat) && !isNaN(r.lng))

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [48.85, 2.35],
      zoom: 12,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const cluster = (L as any).markerClusterGroup({ maxClusterRadius: 50 })
    map.addLayer(cluster)
    clusterRef.current = cluster

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  // Zoom sur les résultats filtrés
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !search.trim() || avecCoords.length === 0) return

    if (avecCoords.length === 1) {
      map.flyTo([avecCoords[0].lat!, avecCoords[0].lng!], 14, { duration: 1.2 })
    } else {
      const bounds = L.latLngBounds(avecCoords.map(r => [r.lat!, r.lng!]))
      map.flyToBounds(bounds, { padding: [80, 80], duration: 1.2, maxZoom: 13 })
    }
  }, [search, avecCoords.length])

  // Sync markers — uniquement ceux avec coordonnées
  useEffect(() => {
    const cluster = clusterRef.current
    if (!cluster) return

    cluster.clearLayers()
    markersRef.current.clear()

    avecCoords.forEach(r => {
      const marker = L.marker([r.lat!, r.lng!], {
        icon: createCustomIcon(selectedId === r.id),
      })

      marker.on('click', () => {
        setSelectedId(r.id)
        mapInstanceRef.current?.flyTo([r.lat!, r.lng!], 15, { duration: 1.2 })
      })

      cluster.addLayer(marker)
      markersRef.current.set(r.id, marker)
    })
  }, [avecCoords, selectedId])

  useEffect(() => {
    if (selectedId == null) { setOffres([]); setAvisResto(null); return }
    setLoadingOffres(true)
    Promise.all([
      fetch(`${API}/offres`).then(r => r.json()),
      fetch(`${API}/restaurants/${selectedId}/avis`).then(r => r.json()),
    ]).then(([offresData, avisData]) => {
      setOffres(offresData.filter((o: Offre & { restaurants: { id: number } }) => o.restaurants?.id === selectedId))
      setAvisResto(avisData)
    }).finally(() => setLoadingOffres(false))
  }, [selectedId])

  async function candidater(offreId: number) {
    if (!token) return
    setCandidatureEnCours(offreId)
    try {
      const res = await fetch(`${API}/candidatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ offre_id: offreId }),
      })
      const data = await res.json()
      setMsgMap(m => ({ ...m, [offreId]: res.ok ? '✅ Candidature envoyée !' : (data.error || 'Erreur') }))
    } finally {
      setCandidatureEnCours(null)
    }
  }

  function focusRestaurant(r: Restaurant) {
    if (!r.lat || !r.lng) return
    setSelectedId(r.id)
    mapInstanceRef.current?.flyTo([r.lat, r.lng], 15, { duration: 1.2 })
  }

  function locateMe() {
    navigator.geolocation.getCurrentPosition(pos => {
      mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 1.5 })
    })
  }

  const selected = restaurants.find(r => r.id === selectedId)

  return (
    <div className="map-page">
      <aside className="map-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Restaurants<br />partenaires</h2>
          <p className="sidebar-sub">{restaurants.length} établissements</p>
          <div className="sidebar-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="sidebar-search"
              placeholder="Nom, adresse, cuisine…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-locate" onClick={locateMe}>
            📍 Me localiser
          </button>
        </div>

        <ul className="sidebar-list">
          {filtered.map(r => (
            <li
              key={r.id}
              className={`sidebar-item ${selectedId === r.id ? 'sidebar-item--active' : ''}`}
              onClick={() => focusRestaurant(r)}
            >
              <img src={r.image || getPhoto(r.description)} alt={r.nom} className="sidebar-item__img" />
              <div className="sidebar-item__info">
                <div className="sidebar-item__meta">{r.description || 'Restaurant'}</div>
                <div className="sidebar-item__name">{r.nom}</div>
                <div className="sidebar-item__followers">📍 {r.adresse}</div>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="sidebar-empty">Aucun restaurant trouvé.</li>
          )}
        </ul>
      </aside>

      <div className="map-container">
        <div ref={mapRef} className="map-canvas" />

        {selected && selected.lat && (
          <div className="map-popup map-popup--desktop">
            <button className="map-popup__close" onClick={() => setSelectedId(null)}>✕</button>
            <div className="map-popup__body">
              <div className="map-popup__meta">{selected.description}</div>
              <h3 className="map-popup__name">{selected.nom}</h3>
              <p className="map-popup__address">📍 {selected.adresse}</p>
              {avisResto && avisResto.total > 0 && (
                <p style={{ fontSize: 13, margin: '4px 0 0', color: '#f59e0b', fontWeight: 700 }}>
                  {'⭐'.repeat(Math.round(Number(avisResto.moyenne)))} {avisResto.moyenne}/5
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>({avisResto.total} avis)</span>
                </p>
              )}
              <div className="map-popup__offres-title">
                {loadingOffres ? 'Chargement des offres…' : offres.length === 0 ? 'Aucune offre disponible' : `${offres.length} offre${offres.length > 1 ? 's' : ''} disponible${offres.length > 1 ? 's' : ''}`}
              </div>
              {offres.map(o => (
                <div key={o.id} className="map-offre-card">
                  <div className="map-offre-titre">{o.titre}</div>
                  <div className="map-offre-meta">
                    {o.valeur_indicative && <span>🍽 {o.valeur_indicative} €</span>}
                    <span>📸 {o.contrepartie}</span>
                    <span>👥 {o.places_restantes} place{o.places_restantes > 1 ? 's' : ''}</span>
                  </div>
                  {msgMap[o.id] ? (
                    <p style={{ fontSize: 13, color: '#22c55e', margin: '6px 0 0' }}>{msgMap[o.id]}</p>
                  ) : utilisateur && token ? (
                    <button className="btn-candidate" disabled={candidatureEnCours === o.id} onClick={() => candidater(o.id)}>
                      {candidatureEnCours === o.id ? 'Envoi…' : 'Candidater →'}
                    </button>
                  ) : (
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '6px 0 0' }}>Connecte-toi pour candidater</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && selected.lat && (
        <div className="map-popup map-popup--mobile">
          <button className="map-popup__close" onClick={() => setSelectedId(null)}>✕</button>
          <div className="map-popup__body">
            <div className="map-popup__meta">{selected.description}</div>
            <h3 className="map-popup__name">{selected.nom}</h3>
            <p className="map-popup__address">📍 {selected.adresse}</p>
            {avisResto && avisResto.total > 0 && (
              <p style={{ fontSize: 13, margin: '4px 0 0', color: '#f59e0b', fontWeight: 700 }}>
                {'⭐'.repeat(Math.round(Number(avisResto.moyenne)))} {avisResto.moyenne}/5
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>({avisResto.total} avis)</span>
              </p>
            )}
            <div className="map-popup__offres-title">
              {loadingOffres ? 'Chargement des offres…' : offres.length === 0 ? 'Aucune offre disponible' : `${offres.length} offre${offres.length > 1 ? 's' : ''} disponible${offres.length > 1 ? 's' : ''}`}
            </div>
            {offres.map(o => (
              <div key={o.id} className="map-offre-card">
                <div className="map-offre-titre">{o.titre}</div>
                <div className="map-offre-meta">
                  {o.valeur_indicative && <span>🍽 {o.valeur_indicative} €</span>}
                  <span>📸 {o.contrepartie}</span>
                  <span>👥 {o.places_restantes} place{o.places_restantes > 1 ? 's' : ''}</span>
                </div>
                {msgMap[o.id] ? (
                  <p style={{ fontSize: 13, color: '#22c55e', margin: '6px 0 0' }}>{msgMap[o.id]}</p>
                ) : utilisateur && token ? (
                  <button className="btn-candidate" disabled={candidatureEnCours === o.id} onClick={() => candidater(o.id)}>
                    {candidatureEnCours === o.id ? 'Envoi…' : 'Candidater →'}
                  </button>
                ) : (
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '6px 0 0' }}>Connecte-toi pour candidater</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
