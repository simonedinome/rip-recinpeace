export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { hash } = req.body || {};
  if (!hash || typeof hash !== 'string') return res.status(400).json({ ok: false });

  const expected = process.env.APP_PASSWORD_HASH;
  if (!expected) return res.status(500).json({ ok: false, error: 'Auth not configured' });

  res.json({ ok: hash.toLowerCase() === expected.toLowerCase() });
}
