import { useState } from 'react'
import { BASE } from './config'

const API = BASE

type Props = {
  onRetour: () => void
  onConnexion: (u: { id: number; nom: string; email: string; role: string }) => void
}

export default function InscriptionRestaurateur({ onRetour, onConnexion }: Props) {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    nom_etablissement: '',
    adresse: '',
    siret: '',
    telephone: '',
    description: '',
  })
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErreur('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch(`${API}/auth/inscription-restaurateur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await r.json()
      if (!r.ok) { setErreur(data.error); setLoading(false); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur))
      setSucces(true)
      setTimeout(() => {
        onConnexion(data.utilisateur)
        onRetour()
      }, 2000)
    } catch {
      setErreur('Erreur réseau, réessaie.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', padding: '0 0 80px' }}>
      <nav className="lp-nav">
        <span className="lp-logo">Pop Fluence</span>
        <button className="btn btn-ghost btn-sm" onClick={onRetour}>← Retour</button>
      </nav>

      <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>
          Rejoindre Pop Fluence
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
          Inscris ton restaurant et commence à recevoir des créateurs de contenu à ta table.
          Ton dossier sera examiné par notre équipe sous 48h.
        </p>

        {succes ? (
          <div style={{
            background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12,
            padding: '24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</p>
            <p style={{ fontWeight: 700, color: '#15803d', fontSize: '1.1rem' }}>Inscription envoyée !</p>
            <p style={{ color: '#166534', marginTop: 8 }}>
              Notre équipe va examiner ton dossier et revenir vers toi sous 48h. Bienvenue !
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: -8 }}>
              👤 Tes informations
            </p>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
              Ton prénom et nom
              <input value={form.nom} onChange={set('nom')} placeholder="Jean Dupont" required
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
              Adresse e-mail
              <input type="email" value={form.email} onChange={set('email')} placeholder="contact@monrestaurant.fr" required
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
              Mot de passe
              <input type="password" value={form.mot_de_passe} onChange={set('mot_de_passe')} placeholder="8 caractères minimum" required
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
            </label>

            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: 8, marginBottom: -8 }}>
              🍽️ Ton établissement
            </p>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
              Nom de l'établissement
              <input value={form.nom_etablissement} onChange={set('nom_etablissement')} placeholder="Le Petit Bistrot" required
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
              Adresse complète
              <input value={form.adresse} onChange={set('adresse')} placeholder="12 rue de la Paix, 75001 Paris" required
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
              Numéro SIRET <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(14 chiffres)</span>
              <input value={form.siret} onChange={set('siret')} placeholder="12345678901234" maxLength={14} required
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', letterSpacing: 2 }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
              Téléphone <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optionnel)</span>
              <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="01 23 45 67 89"
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 600, fontSize: '0.9rem' }}>
              Description de ton restaurant <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optionnel)</span>
              <textarea value={form.description} onChange={set('description')} placeholder="Cuisine française traditionnelle dans un cadre chaleureux…" rows={3}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', resize: 'vertical' }} />
            </label>

            {erreur && (
              <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>{erreur}</p>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Envoi en cours…' : 'Envoyer ma demande d\'inscription'}
            </button>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              En t'inscrivant tu acceptes nos <a href="#">CGU</a> et notre <a href="#">politique de confidentialité</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
