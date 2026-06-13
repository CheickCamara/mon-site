import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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

type Restaurant = {
  id: number
  nom: string
  adresse: string
  description: string
  telephone: string
  statut: string
  lat: number | null
  lng: number | null
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
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    fetch('http://localhost:3001/restaurants')
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
    const map = mapInstanceRef.current
    if (!map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    avecCoords.forEach(r => {
      const marker = L.marker([r.lat!, r.lng!], {
        icon: createCustomIcon(selectedId === r.id),
      }).addTo(map)

      marker.on('click', () => {
        setSelectedId(r.id)
        map.flyTo([r.lat!, r.lng!], 15, { duration: 1.2 })
      })

      markersRef.current.set(r.id, marker)
    })
  }, [avecCoords, selectedId])

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
              <div className="sidebar-item__info">
                <div className="sidebar-item__meta">{r.description}</div>
                <div className="sidebar-item__name">{r.nom}</div>
                <div className="sidebar-item__followers">{r.adresse}</div>
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
          <div className="map-popup">
            <button className="map-popup__close" onClick={() => setSelectedId(null)}>✕</button>
            <div className="map-popup__body">
              <div className="map-popup__meta">{selected.description}</div>
              <h3 className="map-popup__name">{selected.nom}</h3>
              <p className="map-popup__address">📍 {selected.adresse}</p>
              {selected.telephone && <p className="map-popup__desc">{selected.telephone}</p>}
              {selected.statut && <p className="map-popup__desc">Statut : {selected.statut}</p>}
              <div className="map-popup__footer">
                <button className="btn-candidate">Je candidate</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
