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

  const { prompt, count = 1, style = 'cartoon', aspect_ratio = '1:1' } = req.body;
  if (!prompt) { res.status(400).json({ error: 'prompt is required' }); return; }

  const styleMap = {
    cartoon: 'Q版卡通风格，色彩鲜艳，儿童动画',
    anime: '日式动漫风格，明亮清新，适合儿童',
    watercolor: '水彩绘本风格，柔和温暖',
    pixel: '像素艺术风格，童趣可爱',
    ink: '国风水墨风格，典雅大气',
    comic: '美式漫画风格，线条分明',
  };
  const styleHint = styleMap[style] || styleMap.cartoon;
  const fullPrompt = `${prompt}，${styleHint}，高清，细节丰富，适合3-12岁儿童观看`;

  let resp;
  try {
    resp = await minimaxRequest(`${MINIMAX_BASE}/v1/image_generation`, {
      model: 'image-01',
      prompt: fullPrompt,
      aspect_ratio,
      response_format: 'base64',
      num_images: Math.min(count, 9),
    });
  } catch (err) {
    res.status(500).json({ error: err.message }); return;
  }

  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const buf = await resp.arrayBuffer();
    res.setHeader('Content-Type', contentType || 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(Buffer.from(buf));
    return;
  }

  const data = await resp.json();
  const images = data.data?.image_base64 || data.data?.image_url_list || [];
  res.json({ images, model: 'image-01' });
}
