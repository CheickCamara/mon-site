import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapPage.css'

// Fix Leaflet default icon paths (broken with Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

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
    address: '24 Rue du Faubourg Saint-Honoré, Paris',
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
    address: '12 Rue Montorgueil, Paris',
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
    address: '8 Rue Auguste Comte, Lyon',
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
    address: '3 Quai du Port, Marseille',
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
    address: '17 Place du Parlement, Bordeaux',
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
    address: '55 Rue des Abbesses, Paris',
  },
]

function formatFollowers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)
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

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const filtered = RESTAURANTS.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.city.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  )

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [46.8, 2.3],
      zoom: 6,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
  }, [])

  // Zoom sur les résultats filtrés quand la recherche change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !search.trim() || filtered.length === 0) return

    if (filtered.length === 1) {
      map.flyTo([filtered[0].lat, filtered[0].lng], 14, { duration: 1.2 })
    } else {
      const bounds = L.latLngBounds(filtered.map(r => [r.lat, r.lng]))
      map.flyToBounds(bounds, { padding: [80, 80], duration: 1.2, maxZoom: 13 })
    }
  }, [search, filtered.length])

  // Sync markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    filtered.forEach(r => {
      const marker = L.marker([r.lat, r.lng], {
        icon: createCustomIcon(selectedId === r.id),
      }).addTo(map)

      marker.on('click', () => {
        setSelectedId(r.id)
        map.flyTo([r.lat, r.lng], 13, { duration: 1.2 })
      })

      markersRef.current.set(r.id, marker)
    })
  }, [filtered, selectedId])

  function focusRestaurant(r: typeof RESTAURANTS[0]) {
    setSelectedId(r.id)
    mapInstanceRef.current?.flyTo([r.lat, r.lng], 14, { duration: 1.2 })
  }

  function locateMe() {
    navigator.geolocation.getCurrentPosition(pos => {
      mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 12, { duration: 1.5 })
    })
  }

  const selected = RESTAURANTS.find(r => r.id === selectedId)

  return (
    <div className="map-page">
      {/* Sidebar */}
      <aside className="map-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Restaurants<br />partenaires</h2>
          <p className="sidebar-sub">{filtered.length} établissements</p>
          <div className="sidebar-search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="sidebar-search"
              placeholder="Ville, cuisine, nom…"
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
              <img src={r.image} alt={r.name} className="sidebar-item__img" />
              <div className="sidebar-item__info">
                <div className="sidebar-item__meta">{r.cuisine} · {r.city}</div>
                <div className="sidebar-item__name">{r.name}</div>
                <div className="sidebar-item__followers">
                  👥 {formatFollowers(r.minFollowers)} abonnés min.
                </div>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="sidebar-empty">Aucun restaurant trouvé.</li>
          )}
        </ul>
      </aside>

      {/* Map */}
      <div className="map-container">
        <div ref={mapRef} className="map-canvas" />

        {/* Popup flottante sur sélection */}
        {selected && (
          <div className="map-popup">
            <button className="map-popup__close" onClick={() => setSelectedId(null)}>✕</button>
            <img src={selected.image} alt={selected.name} className="map-popup__img" />
            <div className="map-popup__body">
              <div className="map-popup__meta">{selected.cuisine} · {selected.city}</div>
              <h3 className="map-popup__name">{selected.name}</h3>
              <p className="map-popup__address">📍 {selected.address}</p>
              <p className="map-popup__desc">{selected.description}</p>
              <div className="map-popup__footer">
                <span className="map-popup__badge">👥 {formatFollowers(selected.minFollowers)} abonnés min.</span>
                <button className="btn-candidate">Je candidate</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
