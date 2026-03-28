const NOTION_API = 'https://api.notion.com/v1';
const MAX_RETRIES = 3;

async function notionPost(endpoint, body, retries = 0) {
  const res = await fetch(`${NOTION_API}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429 && retries < MAX_RETRIES) {
    const delay = (parseInt(res.headers.get('retry-after') || '2', 10) + retries) * 1000;
    await new Promise(r => setTimeout(r, delay));
    return notionPost(endpoint, body, retries + 1);
  }

  return res;
}

function splitText(text, maxLen) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLen) chunks.push(text.slice(i, i + maxLen));
  return chunks.length ? chunks : [''];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { transcript, summary, duration } = req.body || {};
  if (!transcript) return res.status(400).json({ error: 'No transcript' });

  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) return res.status(500).json({ error: 'NOTION_DATABASE_ID not configured' });

  const now = new Date();
  const title = `Sessione ${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

  const children = [
    summary && {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ type: 'text', text: { content: summary.slice(0, 2000) } }],
        icon: { emoji: '🤖' },
        color: 'purple_background',
      },
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Trascrizione' } }] },
    },
    ...splitText(transcript, 2000).map(chunk => ({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: chunk } }] },
    })),
    duration && {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: `Durata: ${Math.round(duration / 60000)} min` },
          annotations: { color: 'gray' },
        }],
      },
    },
  ].filter(Boolean);

  try {
    const response = await notionPost('/pages', {
      parent: { database_id: databaseId },
      properties: {
        title: { title: [{ type: 'text', text: { content: title } }] },
      },
      children,
    });
    const data = await response.json();
    if (data.object === 'error') return res.status(500).json({ error: data.message });
    res.json({ ok: true, pageId: data.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
