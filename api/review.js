// POST /api/review — 内容审核

const MINIMAX_BASE = 'https://api.minimax.chat';

async function minimaxRequest(url, body) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error('MINIMAX_API_KEY is not set');
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `MiniMax API ${resp.status}`);
  }
  return resp;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.end('ok'); return; }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const { content } = req.body;
  if (!content) { res.status(400).json({ error: 'content is required' }); return; }

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/chat/completions`, {
    model: 'MiniMax-M2.7-highspeed',
    messages: [
      { role: 'system', content: '你是一个严格的内容安全审核员，为儿童动画平台「籁鸣导演」工作。请按JSON格式审核。' },
      { role: 'user', content: `请审核以下剧本内容是否符合儿童动画标准：\n\n${content.substring(0, 4000)}` },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const data = await resp.json();
  res.json({ data, model: 'MiniMax-M2.7-highspeed' });
}
