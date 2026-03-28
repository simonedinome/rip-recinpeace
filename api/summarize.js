const SYSTEM_PROMPT = `Sei un assistente che analizza trascrizioni di riunioni e sessioni di lavoro.
Dato il testo, produci un riassunto strutturato in italiano con queste sezioni:
- **Argomenti trattati**: elenco puntato dei temi principali
- **Decisioni prese**: elenco puntato delle decisioni (scrivi "Nessuna" se non ci sono)
- **Action items**: elenco puntato con responsabile se nominato (scrivi "Nessuno" se non ci sono)
- **Domande aperte**: domande emerse ma non risolte (scrivi "Nessuna" se non ci sono)
Rispondi solo con il riassunto in Markdown, senza premesse o testo aggiuntivo.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { transcript } = req.body || {};
  if (!transcript) return res.status(400).json({ error: 'No transcript' });

  const model = process.env.SUMMARY_MODEL || 'google/gemini-2.5-flash';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: transcript },
        ],
      }),
    });
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';
    res.json({ summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
