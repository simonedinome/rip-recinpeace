export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, mimeType } = req.body || {};
  if (!audio) return res.status(400).json({ error: 'No audio' });

  const buffer = Buffer.from(audio, 'base64');
  const form = new FormData();
  form.append('file', new File([buffer], 'audio.webm', { type: mimeType || 'audio/webm' }));
  form.append('model', 'whisper-1');
  form.append('language', 'it');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    const data = await response.json();
    res.json({ text: data.text || '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
