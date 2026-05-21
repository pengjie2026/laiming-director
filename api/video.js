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

  const { prompt, image_base64, duration = 5 } = req.body;
  if (!prompt && !image_base64) {
    res.status(400).json({ error: 'prompt or image_base64 is required' }); return;
  }

  const body = { model: 'video-01', duration: Math.min(duration, 10) };
  if (image_base64) body.image_base64 = image_base64;
  else body.text = prompt;

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/video_generation`, body);
  const data = await resp.json();
  res.json({ data, model: 'video-01' });
}
