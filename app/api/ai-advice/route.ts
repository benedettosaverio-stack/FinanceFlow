import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { profile } = await req.json()

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const prompt = `Tu es un analyste financier senior, concis et direct. Date du jour : ${today}. Profil de l'investisseur : ${profile}. En 3 phrases maximum, donne une lecture rapide des marchés et une recommandation concrète adaptée au profil. Style terminal, factuel, pas de markdown, pas d'émojis. Texte continu.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://finance-flow-omega-gilt.vercel.app',
      'X-Title': 'FinanceFlow',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-5-haiku',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || 'Analyse indisponible.'
  return NextResponse.json({ text })
}
