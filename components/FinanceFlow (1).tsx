'use client'

import { useState, useEffect, useCallback } from 'react'

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

const QUESTIONS = [
  { q: "Quel est ton horizon d'investissement ?", opts: ["Moins de 2 ans", "2 à 5 ans", "5 à 10 ans", "Plus de 10 ans"] },
  { q: "Si ton portefeuille perd 20% en un mois ?", opts: ["Je vends tout", "Je stresse mais j'attends", "Je reste calme", "Je rachète — opportunité !"] },
  { q: "Ton objectif principal ?", opts: ["Préserver mon capital", "Légèrement mieux que les livrets", "Croître significativement", "Maximiser, je prends le risque"] },
  { q: "Quelle part de ton épargne peux-tu bloquer ?", opts: ["Aucune", "Moins de 25%", "25% à 50%", "Plus de 50%"] },
  { q: "Ta situation financière ?", opts: ["Revenus irréguliers / étudiant", "Stables, peu d'épargne", "Stables, épargne en cours", "Confortables, patrimoine construit"] },
  { q: "Ton expérience en investissement ?", opts: ["Aucune", "Livret A / PEL", "PEA ou assurance-vie", "Bourse / ETF / crypto régulièrement"] }
]

const MARKET_ASSETS: MarketAsset[] = [
  { name: 'CAC 40', type: 'Indice', value: 7842, change: 1.23, trend: 'bull' },
  { name: 'S&P 500', type: 'Indice', value: 5318, change: 0.87, trend: 'bull' },
  { name: 'MSCI World', type: 'ETF', value: 448.20, change: 0.54, trend: 'bull', suffix: ' €' },
  { name: 'Bitcoin', type: 'Crypto', value: 68420, change: -2.10, trend: 'bear', suffix: ' $' },
  { name: 'Livret A', type: 'Livret', value: 3.0, change: 0, trend: 'neutral', suffix: '%' },
  { name: 'Or (XAU)', type: 'Matières 1ères', value: 2389, change: 0.31, trend: 'bull', suffix: ' $' },
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
    { label: 'Livrets', pct: 40, color: '#00ff88' },
    { label: 'Fonds euros', pct: 35, color: '#3388ff' },
    { label: 'ETF oblig.', pct: 15, color: '#ffaa00' },
    { label: 'ETF actions', pct: 10, color: '#ff3366' },
  ]
  if (profile === 'Équilibré') return [
    { label: 'ETF monde', pct: 40, color: '#3388ff' },
    { label: 'Fonds euros', pct: 25, color: '#00ff88' },
    { label: 'ETF oblig.', pct: 20, color: '#ffaa00' },
    { label: 'Liquidités', pct: 15, color: '#8888aa' },
  ]
  return [
    { label: 'ETF actions', pct: 55, color: '#ff3366' },
    { label: 'Small caps', pct: 20, color: '#ffaa00' },
    { label: 'Crypto', pct: 15, color: '#3388ff' },
    { label: 'Liquidités', pct: 10, color: '#8888aa' },
  ]
}

function getProfileDesc(profile: Profile) {
  if (profile === 'Prudent') return 'Tu privilégies la sécurité. Actifs peu volatils, rendement modeste mais prévisible.'
  if (profile === 'Équilibré') return 'Tu cherches l\'équilibre. Mix ETF + fonds euros pour du rendement sans trop de risque.'
  return 'Tu acceptes la volatilité pour maximiser le rendement long terme.'
}

const S: Record<string, React.CSSProperties> = {
  page: { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)', overflowY: 'auto', padding: '1.25rem 1rem calc(env(safe-area-inset-bottom, 0px) + 80px)', WebkitOverflowScrolling: 'touch' },
  h1: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' },
  sub: { fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#8888aa', marginBottom: '1.5rem' },
  card: { background: '#12121a', border: '1px solid #ffffff18', borderRadius: 16, padding: '1.25rem', marginBottom: '1rem' },
  label: { fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: '#8888aa', letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: '0.4rem', display: 'block' },
  input: { background: '#1a1a26', border: '1px solid #ffffff22', color: '#e8e8f0', fontFamily: 'DM Mono, monospace', fontSize: '16px', padding: '0.75rem 1rem', borderRadius: 10, outline: 'none', width: '100%' },
  btnPrimary: { padding: '0.9rem 1.5rem', borderRadius: 12, background: '#00ff88', color: '#000', fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: 'pointer', width: '100%', marginTop: '0.75rem' },
  btnSecondary: { padding: '0.75rem 1.25rem', borderRadius: 12, background: 'none', border: '1px solid #ffffff22', color: '#8888aa', fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' },
  mono: { fontFamily: 'DM Mono, monospace' },
}

function BottomNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const tabs = [
    { id: 'quiz' as Page, label: 'Profil', icon: '◈' },
    { id: 'dashboard' as Page, label: 'Marché', icon: '◉' },
    { id: 'suivi' as Page, label: 'Suivi', icon: '◫' },
  ]
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#0a0a0f',
      borderTop: '1px solid #ffffff12',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 100,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setPage(t.id)} style={{
          flex: 1, padding: '0.75rem 0.5rem', background: 'none', border: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
          cursor: 'pointer', transition: 'all 0.2s',
          color: page === t.id ? '#00ff88' : '#5555aa',
        }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{t.icon}</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: 1, textTransform: 'uppercase' }}>{t.label}</span>
          {page === t.id && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00ff88', marginTop: -2 }} />}
        </button>
      ))}
    </nav>
  )
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{
      position: 'sticky', top: 0, background: '#0a0a0f',
      borderBottom: '1px solid #ffffff08',
      padding: 'calc(env(safe-area-inset-top, 0px) + 0.75rem) 1rem 0.75rem',
      zIndex: 50, display: 'flex', alignItems: 'center', gap: '0.75rem'
    }}>
      <img src="/logo.svg" alt="FinanceFlow" style={{ width: 28, height: 28, borderRadius: 8 }} />
      <div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#e8e8f0' }}>{title}</div>
        {subtitle && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: '#5555aa' }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function QuizPage({ onComplete }: { onComplete: (p: Profile) => void }) {
  const [step, setStep] = useState(() => typeof window !== 'undefined' ? parseInt(localStorage.getItem('ff_quiz_step') || '0') : 0)
  const [answers, setAnswers] = useState<number[]>(() => {
    if (typeof window === 'undefined') return []
    const s = localStorage.getItem('ff_quiz_answers')
    return s ? JSON.parse(s) : []
  })
  const [done, setDone] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('ff_profile'))
  const [profile, setProfile] = useState<Profile>(() => (typeof window !== 'undefined' ? localStorage.getItem('ff_profile') as Profile : null) || 'Équilibré')

  const select = (idx: number) => {
    const next = [...answers]; next[step] = idx; setAnswers(next)
    if (typeof window !== 'undefined') localStorage.setItem('ff_quiz_answers', JSON.stringify(next))
  }

  const next = () => {
    if (step < QUESTIONS.length - 1) {
      const s = step + 1; setStep(s)
      if (typeof window !== 'undefined') localStorage.setItem('ff_quiz_step', String(s))
    } else {
      const score = answers.reduce((s, a) => s + a, 0)
      const p = getProfile(score, QUESTIONS.length * 3)
      setProfile(p); setDone(true)
      if (typeof window !== 'undefined') { localStorage.setItem('ff_profile', p); localStorage.removeItem('ff_quiz_step'); localStorage.removeItem('ff_quiz_answers') }
      onComplete(p)
    }
  }

  const reset = () => {
    setStep(0); setAnswers([]); setDone(false)
    if (typeof window !== 'undefined') { localStorage.removeItem('ff_profile'); localStorage.removeItem('ff_quiz_step'); localStorage.removeItem('ff_quiz_answers') }
  }

  const profileColor = profile === 'Prudent' ? '#00ff88' : profile === 'Équilibré' ? '#3388ff' : '#ff3366'

  if (done) return (
    <>
      <TopBar title="Mon profil" subtitle={`// investisseur ${profile.toLowerCase()}`} />
      <div style={S.page}>
        <div style={{ ...S.card, borderColor: profileColor + '40' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: profileColor + '15', border: `1px solid ${profileColor}40`, borderRadius: 50, padding: '0.35rem 1rem', marginBottom: '1rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: profileColor, boxShadow: `0 0 6px ${profileColor}` }} />
            <span style={{ ...S.mono, fontSize: '0.75rem', color: profileColor, fontWeight: 500 }}>PROFIL {profile.toUpperCase()}</span>
          </div>
          <p style={{ ...S.mono, fontSize: '0.85rem', color: '#8888aa', lineHeight: 1.7, marginBottom: '1.25rem' }}>{getProfileDesc(profile)}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {getAllocs(profile).map(a => (
              <div key={a.label} style={{ background: '#1a1a26', borderRadius: 10, padding: '0.85rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, ...S.mono, color: a.color }}>{a.pct}%</div>
                <div style={{ fontSize: '0.7rem', color: '#8888aa', marginTop: '0.2rem', letterSpacing: 1 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={reset} style={{ ...S.btnSecondary, width: '100%', marginTop: '0.5rem' }}>Refaire le questionnaire</button>
      </div>
    </>
  )

  const q = QUESTIONS[step]
  const pct = ((step + 1) / QUESTIONS.length * 100).toFixed(0)

  return (
    <>
      <TopBar title="Profil investisseur" subtitle={`question ${step + 1} / ${QUESTIONS.length}`} />
      <div style={S.page}>
        <div style={{ height: 3, background: '#1a1a26', borderRadius: 2, marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, #00ff88, #3388ff)', borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
        <div style={S.card}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '1.25rem' }}>{q.q}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {q.opts.map((o, i) => (
              <button key={i} onClick={() => select(i)} style={{
                background: answers[step] === i ? '#00ff8812' : '#1a1a26',
                border: `1px solid ${answers[step] === i ? '#00ff88' : '#ffffff18'}`,
                color: answers[step] === i ? '#00ff88' : '#8888aa',
                borderRadius: 12, padding: '1rem', cursor: 'pointer',
                fontSize: '0.9rem', ...S.mono, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                transition: 'all 0.15s', minHeight: 56,
              }}>
                <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: answers[step] === i ? '#00ff88' : '#ffffff10', color: answers[step] === i ? '#000' : '#8888aa', borderRadius: 4, minWidth: 22, textAlign: 'center', flexShrink: 0 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {o}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ ...S.btnSecondary, flex: 1 }}>← Retour</button>}
          <button onClick={next} disabled={answers[step] === undefined} style={{ ...S.btnPrimary, flex: 2, marginTop: 0, opacity: answers[step] === undefined ? 0.4 : 1 }}>
            {step === QUESTIONS.length - 1 ? 'Voir mon profil' : 'Suivant →'}
          </button>
        </div>
      </div>
    </>
  )
}

function DashboardPage({ profile }: { profile: Profile }) {
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [assets, setAssets] = useState(MARKET_ASSETS)

  const refreshAssets = useCallback(() => {
    setAssets(MARKET_ASSETS.map(a => ({ ...a, change: parseFloat((a.change + (Math.random() - 0.5) * 0.3).toFixed(2)) })))
  }, [])

  const loadAI = useCallback(async () => {
    setAiLoading(true); setAiText('')
    try {
      const res = await fetch('/api/ai-advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) })
      const data = await res.json()
      const text: string = data.text || ''
      let i = 0
      const iv = setInterval(() => { if (i >= text.length) { clearInterval(iv); setAiLoading(false); return } setAiText(text.slice(0, ++i)) }, 15)
    } catch { setAiText('Analyse indisponible.'); setAiLoading(false) }
  }, [profile])

  useEffect(() => { refreshAssets(); loadAI() }, [refreshAssets, loadAI])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <TopBar title="Marché du jour" subtitle={`// ${today}`} />
      <div style={S.page}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button onClick={() => { refreshAssets(); loadAI() }} style={{ ...S.btnSecondary, padding: '0.5rem 1rem', fontSize: '0.8rem' }}>↻ Actualiser</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
          {[
            { label: 'CAC 40', value: '7 842', change: '+1.23%', color: '#00ff88' },
            { label: 'Bitcoin', value: '68 420$', change: '-2.10%', color: '#ff3366' },
            { label: 'Livret A', value: '3.00%', change: 'Stable', color: '#3388ff' },
            { label: 'Or', value: '2 389$', change: '+0.31%', color: '#ffaa00' },
          ].map(k => (
            <div key={k.label} style={{ ...S.card, marginBottom: 0, borderTop: `2px solid ${k.color}`, padding: '0.9rem' }}>
              <div style={{ ...S.label, marginBottom: '0.4rem' }}>{k.label}</div>
              <div style={{ ...S.mono, fontSize: '1.2rem', fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ ...S.mono, fontSize: '0.75rem', color: k.color, marginTop: '0.15rem' }}>{k.change}</div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #ffffff10', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...S.mono, fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase' as const }}>Actifs</span>
            <span style={{ ...S.mono, fontSize: '0.6rem', color: '#00ff88', background: '#00ff8812', border: '1px solid #00ff8830', padding: '0.15rem 0.5rem', borderRadius: 50 }}>LIVE</span>
          </div>
          {assets.map((a, i) => (
            <div key={a.name} style={{ padding: '0.85rem 1rem', borderBottom: i < assets.length - 1 ? '1px solid #ffffff08' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.15rem' }}>{a.name}</div>
                <div style={{ ...S.mono, fontSize: '0.65rem', color: '#5555aa' }}>{a.type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...S.mono, fontSize: '0.9rem' }}>{a.suffix === '%' ? a.value.toFixed(2) + '%' : a.value.toLocaleString('fr-FR') + (a.suffix || '')}</div>
                <div style={{ ...S.mono, fontSize: '0.75rem', color: a.change >= 0 ? '#00ff88' : '#ff3366' }}>{a.change >= 0 ? '+' : ''}{a.change.toFixed(2)}%</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...S.card, minHeight: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <span style={{ ...S.mono, fontSize: '0.65rem', color: '#3388ff', background: '#3388ff15', border: '1px solid #3388ff30', padding: '0.2rem 0.6rem', borderRadius: 50, letterSpacing: 1 }}>IA · ANALYSE</span>
            <span style={{ ...S.mono, fontSize: '0.65rem', color: '#5555aa' }}>profil {profile}</span>
          </div>
          <p style={{ ...S.mono, fontSize: '0.85rem', color: aiLoading || !aiText ? '#5555aa' : '#e8e8f0', lineHeight: 1.7 }}>
            {aiText || 'Chargement...'}
            {aiLoading && <span style={{ display: 'inline-block', width: 2, height: 13, background: '#00ff88', marginLeft: 2, verticalAlign: 'middle', animation: 'blink 0.8s infinite' }} />}
          </p>
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        </div>
      </div>
    </>
  )
}

function SuiviPage() {
  const [placements, setPlacements] = useState<Placement[]>([])
  const [form, setForm] = useState({ name: '', type: 'Livret réglementé', invested: '', current: '' })
  const [adding, setAdding] = useState(false)

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
    setAdding(false)
  }

  const del = (i: number) => save(placements.filter((_, idx) => idx !== i))

  const total = placements.reduce((s, p) => s + p.current, 0)
  const invested = placements.reduce((s, p) => s + p.invested, 0)
  const gain = total - invested
  const gainPct = invested > 0 ? ((gain / invested) * 100).toFixed(2) : '0'

  return (
    <>
      <TopBar title="Mes placements" subtitle="// suivi du patrimoine" />
      <div style={S.page}>
        <div style={{ ...S.card, background: 'linear-gradient(135deg, #00ff8808, #3388ff08)', borderColor: '#00ff8820', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={S.label}>Patrimoine total</div>
              <div style={{ ...S.mono, fontSize: '1.8rem', fontWeight: 700, color: '#00ff88' }}>{total.toLocaleString('fr-FR')} €</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={S.label}>Performance</div>
              <div style={{ ...S.mono, fontSize: '1rem', color: gain >= 0 ? '#00ff88' : '#ff3366' }}>
                {invested > 0 ? `${gain >= 0 ? '+' : ''}${gainPct}%` : '—'}
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => setAdding(!adding)} style={{ ...S.btnPrimary, marginBottom: '1rem' }}>
          {adding ? '✕ Annuler' : '+ Ajouter un placement'}
        </button>

        {adding && (
          <div style={{ ...S.card }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div><label style={S.label}>Nom</label><input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ex: Livret A, CW8..." /></div>
              <div>
                <label style={S.label}>Type</label>
                <select style={S.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {PLACEMENT_TYPES.map(t => <option key={t} value={t} style={{ background: '#12121a' }}>{t}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Montant investi (€)</label><input style={S.input} type="number" inputMode="decimal" value={form.invested} onChange={e => setForm({ ...form, invested: e.target.value })} placeholder="1000" /></div>
              <div><label style={S.label}>Valeur actuelle (€)</label><input style={S.input} type="number" inputMode="decimal" value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} placeholder="1050" /></div>
            </div>
            <button onClick={add} style={S.btnPrimary}>Confirmer</button>
          </div>
        )}

        {placements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#5555aa', ...S.mono, fontSize: '0.85rem' }}>
            Aucun placement.<br />Ajoute ton premier actif ↑
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {placements.map((p, i) => {
              const g = p.current - p.invested
              const pct = ((g / p.invested) * 100).toFixed(2)
              return (
                <div key={i} style={{ ...S.card, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ ...S.mono, fontSize: '0.65rem', color: '#5555aa', letterSpacing: 1 }}>{p.type.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ ...S.mono, fontSize: '0.95rem', fontWeight: 500 }}>{p.current.toLocaleString('fr-FR')} €</div>
                    <div style={{ ...S.mono, fontSize: '0.75rem', color: g >= 0 ? '#00ff88' : '#ff3366' }}>{g >= 0 ? '+' : ''}{pct}%</div>
                  </div>
                  <button onClick={() => del(i)} style={{ background: 'none', border: '1px solid #ffffff15', color: '#5555aa', fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

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
    <div style={{ background: '#0a0a0f', minHeight: '100dvh' }}>
      {page === 'quiz' && <QuizPage onComplete={p => { setProfile(p); setTimeout(() => setPage('dashboard'), 300) }} />}
      {page === 'dashboard' && <DashboardPage profile={profile} />}
      {page === 'suivi' && <SuiviPage />}
      <BottomNav page={page} setPage={setPage} />
    </div>
  )
}
