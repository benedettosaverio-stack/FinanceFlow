import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { profile } = await req.json()

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const prompt = `Tu es un analyste financier senior, concis et direct. Date du jour : ${today}. 
Profil de l'investisseur : ${profile}.

En 4 phrases maximum, donne :
1. Une lecture rapide des marchés du moment (tendances générales : actions, taux, matières premières)
2. Un point de vigilance ou une opportunité selon le contexte actuel
3. Une recommandation concrète et actionnable adaptée au profil ${profile}

Ton style : terminal, factuel, pas de markdown, pas d'émojis, pas de listes. Texte continu. Commence directement l'analyse.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || 'Analyse temporairement indisponible.'
    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({
      text: `// ${today} — Les marchés mondiaux évoluent dans un contexte de normalisation monétaire. Restez discipliné sur votre allocation cible et évitez les mouvements impulsifs sur les actifs volatils. Pour un profil ${profile} : maintenez vos positions core et profitez des replis pour renforcer progressivement.`
    })
  }
}
