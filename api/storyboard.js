// POST /api/storyboard — 分镜规划

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

  const { scene, style = 'Q版卡通' } = req.body;
  if (!scene) { res.status(400).json({ error: 'scene is required' }); return; }

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/chat/completions`, {
    model: 'MiniMax-M2.7-highspeed',
    messages: [
      { role: 'system', content: '你是「籁鸣导演」平台的AI分镜规划师，专为儿童动画生成专业分镜脚本。请按JSON格式输出。' },
      { role: 'user', content: `请为以下动画场景生成详细分镜规划：${scene}，画风：${style}` },
    ],
    max_tokens: 1500,
    temperature: 0.7,
  });

  const data = await resp.json();
  res.json({ data, model: 'MiniMax-M2.7-highspeed' });
}
