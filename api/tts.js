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

function hexToUint8Array(hex) {
  return new Uint8Array(hex.match(/../g).map(b => parseInt(b, 16)));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.end('ok'); return; }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const {
    text,
    voice_id = 'Chinese (Mandarin)_Lyrical_Voice',
    speed = 1.0,
    model = 'speech-2.8-hd',
  } = req.body;
  if (!text) { res.status(400).json({ error: 'text is required' }); return; }

  const validModels = ['speech-2.8-hd', 'speech-2.8-turbo'];
  const selectedModel = validModels.includes(model) ? model : 'speech-2.8-hd';

  let resp;
  try {
    resp = await minimaxRequest(`${MINIMAX_BASE}/v1/t2a_v2`, {
      model: selectedModel,
      text,
      stream: false,
      voice_setting: { voice_id, speed, vol: 1.0, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3' },
    });
  } catch (err) {
    res.status(500).json({ error: err.message }); return;
  }

  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > 100) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(Buffer.from(buf));
      return;
    }
  }

  const data = await resp.json();
  const audioHex = data.data?.audio;
  if (audioHex) {
    const bytes = hexToUint8Array(audioHex);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(Buffer.from(bytes));
    return;
  }

  res.json({ data });
}
