'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Page = 'quiz' | 'dashboard' | 'suivi'
type Trend = 'bull' | 'bear' | 'neutral'
type Profile = 'Prudent' | 'Équilibré' | 'Dynamique'

interface Placement {
  name: string
  type: string
  invested: number
  current: number
}

interface MarketAsset {
  name: string
  type: string
  value: number
  change: number
  trend: Trend
  suffix?: string
}

// ─── DATA ────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    q: "Quel est ton horizon d'investissement ?",
    opts: ["Moins de 2 ans — besoin de liquidité rapide", "2 à 5 ans — moyen terme", "5 à 10 ans — long terme", "Plus de 10 ans — très long terme"]
  },
  {
    q: "Si ton portefeuille perd 20% en un mois, tu fais quoi ?",
    opts: ["Je vends tout immédiatement", "Je suis stressé mais j'attends", "Je reste calme, c'est normal", "Je rachète à la baisse — opportunité !"]
  },
  {
    q: "Quel est ton objectif principal ?",
    opts: ["Préserver mon capital avant tout", "Obtenir un rendement légèrement supérieur aux livrets", "Faire croître mon patrimoine significativement", "Maximiser le rendement, je prends le risque"]
  },
  {
    q: "Quelle part de ton épargne peux-tu bloquer ?",
    opts: ["Aucune — j'ai besoin d'accès immédiat", "Moins de 25% de mon épargne", "25% à 50% de mon épargne", "Plus de 50% — j'ai une épargne de précaution solide"]
  },
  {
    q: "Quelle est ta situation financière actuelle ?",
    opts: ["Revenus irréguliers / étudiant", "Revenus stables, peu d'épargne constituée", "Revenus stables, épargne en cours de constitution", "Revenus confortables, patrimoine déjà construit"]
  },
  {
    q: "Quelle est ton expérience en investissement ?",
    opts: ["Aucune — je débute complètement", "J'ai un Livret A / PEL", "J'ai déjà un PEA ou une assurance-vie", "J'investis en bourse / ETF / crypto régulièrement"]
  }
]

const MARKET_ASSETS: MarketAsset[] = [
  { name: 'CAC 40', type: 'Indice', value: 7842, change: 1.23, trend: 'bull' },
  { name: 'S&P 500', type: 'Indice', value: 5318, change: 0.87, trend: 'bull' },
  { name: 'MSCI World (CW8)', type: 'ETF', value: 448.20, change: 0.54, trend: 'bull', suffix: ' €' },
  { name: 'Bitcoin', type: 'Crypto', value: 68420, change: -2.10, trend: 'bear', suffix: ' $' },
  { name: 'Livret A', type: 'Livret', value: 3.0, change: 0, trend: 'neutral', suffix: '%' },
  { name: 'Or (XAU)', type: 'Matières premières', value: 2389, change: 0.31, trend: 'bull', suffix: ' $' },
  { name: 'OAT 10 ans', type: 'Obligataire', value: 3.12, change: -0.08, trend: 'bear', suffix: '%' },
]

const PLACEMENT_TYPES = ['Livret réglementé', 'ETF', 'Action', 'Crypto', 'PEA', 'Assurance-vie', 'Autre']

function getProfile(score: number, max: number): Profile {
  const r = score / max
  if (r < 0.33) return 'Prudent'
  if (r < 0.66) return 'Équilibré'
  return 'Dynamique'
}

function getAllocs(profile: Profile) {
  if (profile === 'Prudent') return [
    { label: 'Livrets réglementés', pct: 40, color: 'var(--accent)' },
    { label: 'Fonds euros', pct: 35, color: 'var(--blue)' },
    { label: 'ETF obligataires', pct: 15, color: 'var(--amber)' },
    { label: 'ETF actions', pct: 10, color: 'var(--red)' },
  ]
  if (profile === 'Équilibré') return [
    { label: 'ETF monde (MSCI)', pct: 40, color: 'var(--blue)' },
    { label: 'Fonds euros', pct: 25, color: 'var(--accent)' },
    { label: 'ETF obligataires', pct: 20, color: 'var(--amber)' },
    { label: 'Liquidités', pct: 15, color: 'var(--text2)' },
  ]
  return [
    { label: 'ETF actions monde', pct: 55, color: 'var(--red)' },
    { label: 'ETF small caps', pct: 20, color: 'var(--amber)' },
    { label: 'Crypto (BTC/ETH)', pct: 15, color: 'var(--blue)' },
    { label: 'Liquidités', pct: 10, color: 'var(--text2)' },
  ]
}

function getProfileDesc(profile: Profile) {
  if (profile === 'Prudent') return '// Tu privilégies la sécurité et la disponibilité de ton capital. Ton portefeuille mise sur des actifs peu volatils avec un rendement modeste mais prévisible.'
  if (profile === 'Équilibré') return '// Tu cherches un équilibre entre croissance et protection. Un mix ETF + fonds euros t\'offre du rendement sur le long terme sans trop d\'exposition au risque.'
  return '// Tu acceptes la volatilité pour maximiser le rendement long terme. Un portefeuille orienté actions et ETF est adapté à ton profil.'
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100,
      backdropFilter: 'blur(12px)'
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: 2, fontWeight: 500 }}>
        FINANCE<span style={{ color: 'var(--text2)' }}>FLOW</span>
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {(['quiz', 'dashboard', 'suivi'] as Page[]).map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            background: page === p ? '#00ff8812' : 'none',
            border: page === p ? '1px solid #00ff8830' : '1px solid transparent',
            color: page === p ? 'var(--accent)' : 'var(--text2)',
            fontFamily: 'var(--sans)', fontSize: '0.8rem',
            padding: '0.4rem 0.9rem', borderRadius: 6,
            letterSpacing: 1, textTransform: 'uppercase',
            transition: 'all 0.2s'
          }}>
            {p === 'quiz' ? 'Profil' : p === 'dashboard' ? 'Marché' : 'Suivi'}
          </button>
        ))}
      </div>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
        boxShadow: '0 0 8px var(--accent)', animation: 'pulse 2s infinite'
      }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </nav>
  )
}

// ─── QUIZ PAGE ────────────────────────────────────────────────────────────────
function QuizPage({ onComplete }: { onComplete: (profile: Profile) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [profile, setProfile] = useState<Profile>('Équilibré')

  const select = (idx: number) => {
    const next = [...answers]
    next[step] = idx
    setAnswers(next)
  }

  const next = () => {
    if (step < QUESTIONS.length - 1) { setStep(s => s + 1); return }
    const score = answers.reduce((s, a) => s + a, 0)
    const p = getProfile(score, QUESTIONS.length * 3)
    setProfile(p)
    setDone(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ff_profile', p)
    }
    onComplete(p)
  }

  const profileColor = profile === 'Prudent' ? 'var(--accent)' : profile === 'Équilibré' ? 'var(--blue)' : 'var(--red)'

  if (done) return (
    <div style={{ padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ton profil</h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text2)' }}>// analyse complète — profil généré</p>
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
          background: '#00ff8812', border: '1px solid #00ff8840',
          borderRadius: 50, padding: '0.5rem 1.25rem', marginBottom: '1.5rem'
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500 }}>
            PROFIL {profile.toUpperCase()}
          </span>
        </div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
          Tu es un investisseur <span style={{ color: profileColor }}>{profile}</span>
        </h2>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          {getProfileDesc(profile)}
        </p>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
          Allocation recommandée
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {getAllocs(profile).map(a => (
            <div key={a.label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--mono)', color: a.color }}>{a.pct}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '0.25rem', letterSpacing: 1, textTransform: 'uppercase' }}>{a.label}</div>
            </div>
          ))}
        </div>
        <button onClick={() => window.dispatchEvent(new CustomEvent('ff-navigate', { detail: 'dashboard' }))}
          style={{ padding: '0.7rem 1.5rem', borderRadius: 8, background: 'var(--accent)', color: '#000', fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          Voir le marché du jour →
        </button>
      </div>
    </div>
  )

  const q = QUESTIONS[step]
  const pct = ((step + 1) / QUESTIONS.length * 100).toFixed(0)

  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ton profil investisseur</h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text2)' }}>// questionnaire d'analyse — 6 questions</p>
      </div>
      <div style={{ height: 2, background: 'var(--bg3)', borderRadius: 2, margin: '1.5rem 0', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, var(--accent), var(--blue))', borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text2)', marginBottom: '1rem' }}>
        Question {step + 1} sur {QUESTIONS.length}
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '1.8rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', lineHeight: 1.5 }}>{q.q}</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {q.opts.map((o, i) => (
            <button key={i} onClick={() => select(i)} style={{
              background: answers[step] === i ? '#00ff8812' : 'var(--bg3)',
              border: `1px solid ${answers[step] === i ? 'var(--accent)' : 'var(--border)'}`,
              color: answers[step] === i ? 'var(--accent)' : 'var(--text2)',
              borderRadius: 8, padding: '1rem 1.25rem', cursor: 'pointer',
              fontSize: '0.9rem', fontFamily: 'var(--mono)', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              transition: 'all 0.2s'
            }}>
              <span style={{
                fontSize: '0.7rem', padding: '0.2rem 0.5rem',
                background: answers[step] === i ? 'var(--accent)' : 'var(--border)',
                color: answers[step] === i ? '#000' : 'var(--text2)',
                borderRadius: 4, minWidth: 24, textAlign: 'center'
              }}>{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            padding: '0.7rem 1.5rem', borderRadius: 8, background: 'none',
            border: '1px solid var(--border2)', color: 'var(--text2)',
            fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 600
          }}>← Retour</button>
        )}
        <button onClick={next} disabled={answers[step] === undefined} style={{
          padding: '0.7rem 1.5rem', borderRadius: 8,
          background: answers[step] !== undefined ? 'var(--accent)' : 'var(--bg3)',
          color: answers[step] !== undefined ? '#000' : 'var(--text2)',
          fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 600,
          border: 'none', opacity: answers[step] === undefined ? 0.4 : 1,
          cursor: answers[step] === undefined ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}>{step === QUESTIONS.length - 1 ? 'Voir mon profil →' : 'Suivant →'}</button>
      </div>
    </div>
  )
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ profile }: { profile: Profile }) {
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [assets, setAssets] = useState(MARKET_ASSETS)

  const refreshAssets = useCallback(() => {
    setAssets(MARKET_ASSETS.map(a => ({
      ...a,
      change: parseFloat((a.change + (Math.random() - 0.5) * 0.3).toFixed(2)),
      trend: a.change > 0.2 ? 'bull' : a.change < -0.2 ? 'bear' : 'neutral' as Trend
    })))
  }, [])

  const loadAI = useCallback(async () => {
    setAiLoading(true)
    setAiText('')
    try {
      const res = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      })
      const data = await res.json()
      let i = 0
      const text: string = data.text || ''
      const iv = setInterval(() => {
        if (i >= text.length) { clearInterval(iv); setAiLoading(false); return }
        setAiText(text.slice(0, ++i))
      }, 15)
    } catch {
      setAiText('// Analyse temporairement indisponible. Vérifiez votre connexion.')
      setAiLoading(false)
    }
  }, [profile])

  useEffect(() => {
    refreshAssets()
    loadAI()
  }, [refreshAssets, loadAI])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const kpis = [
    { label: 'CAC 40', value: '7 842', change: '+1.23%', cls: 'green' },
    { label: 'Bitcoin', value: '68 420$', change: '-2.10%', cls: 'red' },
    { label: 'Livret A', value: '3.00%', change: 'Stable', cls: 'blue' },
    { label: 'Or', value: '2 389$', change: '+0.31%', cls: 'amber' },
  ]
  const kpiAccent: Record<string, string> = { green: 'var(--accent)', red: 'var(--red)', blue: 'var(--blue)', amber: 'var(--amber)' }

  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Marché du jour</h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text2)' }}>
            // {today} — {time}
          </p>
        </div>
        <button onClick={() => { refreshAssets(); loadAI() }} style={{
          background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)',
          fontFamily: 'var(--mono)', fontSize: '0.75rem', padding: '0.4rem 0.9rem',
          borderRadius: 6, cursor: 'pointer'
        }}>↻ Actualiser</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.1rem',
            borderTop: `2px solid ${kpiAccent[k.cls]}`
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--mono)', color: kpiAccent[k.cls] }}>{k.value}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', marginTop: '0.25rem', color: k.cls === 'red' ? 'var(--red)' : 'var(--accent)' }}>{k.change}</div>
          </div>
        ))}
      </div>

      {/* AI Advice */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--blue)', background: '#3388ff15', border: '1px solid #3388ff30', padding: '0.25rem 0.75rem', borderRadius: 50, letterSpacing: 1 }}>IA · ANALYSE</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text2)' }}>profil {profile}</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem', color: aiLoading || !aiText ? 'var(--text2)' : 'var(--text)', lineHeight: 1.7 }}>
          {aiText || 'Chargement de l\'analyse IA...'}
          {aiLoading && <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'middle', animation: 'blink 0.8s infinite' }} />}
        </div>
        <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
      </div>

      {/* Market table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: 1 }}>ACTIFS SUIVIS</h3>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--accent)', background: '#00ff8812', border: '1px solid #00ff8830', padding: '0.2rem 0.6rem', borderRadius: 50, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            LIVE
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Actif', 'Type', 'Valeur', 'Variation', 'Tendance'].map(h => (
                  <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text2)', textAlign: 'left', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.name}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', padding: '0.8rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{a.name}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', padding: '0.8rem 1.25rem', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>{a.type}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', padding: '0.8rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                    {a.suffix === '%' ? a.value.toFixed(2) + '%' : a.value.toLocaleString('fr-FR') + (a.suffix || '')}
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', padding: '0.8rem 1.25rem', borderBottom: '1px solid var(--border)', color: a.change >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                    {a.change >= 0 ? '+' : ''}{a.change.toFixed(2)}%
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', padding: '0.8rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{
                      fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: 4, fontWeight: 500,
                      background: a.trend === 'bull' ? '#00ff8815' : a.trend === 'bear' ? '#ff336615' : '#ffffff08',
                      color: a.trend === 'bull' ? 'var(--accent)' : a.trend === 'bear' ? 'var(--red)' : 'var(--text2)',
                      border: `1px solid ${a.trend === 'bull' ? '#00ff8830' : a.trend === 'bear' ? '#ff336630' : 'var(--border)'}`
                    }}>
                      {a.trend === 'bull' ? '↑ Hausse' : a.trend === 'bear' ? '↓ Baisse' : '→ Stable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── SUIVI PAGE ───────────────────────────────────────────────────────────────
function SuiviPage() {
  const [placements, setPlacements] = useState<Placement[]>([])
  const [form, setForm] = useState({ name: '', type: 'Livret réglementé', invested: '', current: '' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ff_placements')
      if (saved) setPlacements(JSON.parse(saved))
    }
  }, [])

  const save = (data: Placement[]) => {
    setPlacements(data)
    if (typeof window !== 'undefined') localStorage.setItem('ff_placements', JSON.stringify(data))
  }

  const add = () => {
    if (!form.name || !form.invested || !form.current) return
    save([...placements, { name: form.name, type: form.type, invested: parseFloat(form.invested), current: parseFloat(form.current) }])
    setForm({ name: '', type: 'Livret réglementé', invested: '', current: '' })
  }

  const del = (i: number) => save(placements.filter((_, idx) => idx !== i))

  const total = placements.reduce((s, p) => s + p.current, 0)
  const invested = placements.reduce((s, p) => s + p.invested, 0)
  const gain = total - invested
  const gainPct = invested > 0 ? ((gain / invested) * 100).toFixed(2) : '0'

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)',
    fontFamily: 'var(--mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem',
    borderRadius: 6, outline: 'none', width: '100%'
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text2)',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block'
  }

  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Mes placements</h1>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text2)' }}>// suivi manuel de ton patrimoine</p>
      </div>

      {/* Total card */}
      <div style={{
        background: 'linear-gradient(135deg, #00ff8808, #3388ff08)',
        border: '1px solid #00ff8820', borderRadius: 12, padding: '1.25rem',
        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Patrimoine total</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>{total.toLocaleString('fr-FR')} €</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Performance</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.95rem', color: gain >= 0 ? 'var(--accent)' : 'var(--red)' }}>
            {invested > 0 ? `${gain >= 0 ? '+' : ''}${gainPct}%` : '—'}
          </div>
        </div>
      </div>

      {/* Add form */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Ajouter un placement</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>Nom</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ex: Livret A, CW8..." />
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {PLACEMENT_TYPES.map(t => <option key={t} value={t} style={{ background: 'var(--bg2)' }}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Montant investi (€)</label>
            <input style={inputStyle} type="number" value={form.invested} onChange={e => setForm({ ...form, invested: e.target.value })} placeholder="1000" />
          </div>
          <div>
            <label style={labelStyle}>Valeur actuelle (€)</label>
            <input style={inputStyle} type="number" value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} placeholder="1050" />
          </div>
        </div>
        <button onClick={add} style={{ padding: '0.7rem 1.5rem', borderRadius: 8, background: 'var(--accent)', color: '#000', fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>+ Ajouter</button>
      </div>

      {/* List */}
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Portefeuille</div>
      {placements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
          Aucun placement ajouté.<br />Commence par ajouter ton premier actif ↑
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {placements.map((p, i) => {
            const g = p.current - p.invested
            const pct = ((g / p.invested) * 100).toFixed(2)
            return (
              <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase' }}>{p.type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '1rem', fontWeight: 500 }}>{p.current.toLocaleString('fr-FR')} €</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: g >= 0 ? 'var(--accent)' : 'var(--red)' }}>{g >= 0 ? '+' : ''}{pct}%</div>
                </div>
                <button onClick={() => del(i)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)' }}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function FinanceFlow() {
  const [page, setPage] = useState<Page>('quiz')
  const [profile, setProfile] = useState<Profile>('Équilibré')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ff_profile') as Profile | null
      if (saved) setProfile(saved)
    }
    const handler = (e: CustomEvent) => setPage(e.detail as Page)
    window.addEventListener('ff-navigate', handler as EventListener)
    return () => window.removeEventListener('ff-navigate', handler as EventListener)
  }, [])

  return (
    <>
      <Nav page={page} setPage={setPage} />
      {page === 'quiz' && <QuizPage onComplete={setProfile} />}
      {page === 'dashboard' && <DashboardPage profile={profile} />}
      {page === 'suivi' && <SuiviPage />}
    </>
  )
}
