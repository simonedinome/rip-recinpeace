export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, mimeType } = req.body || {};
  if (!audio) return res.status(400).json({ error: 'No audio' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: { data: audio, format: (mimeType || 'audio/webm').split('/')[1] },
            },
            {
              type: 'text',
              text: 'Trascrivi questo audio in italiano. Rispondi solo con la trascrizione, senza commenti o aggiunte.',
            },
          ],
        }],
      }),
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
