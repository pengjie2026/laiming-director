/**
 * 籁鸣导演 AI 功能 Cloudflare Worker
 * 功能：剧本生成 / 分镜规划 / 图像生成 / 视频生成 / 内容审核 / TTS配音
 * 版本: 1.0.0
 *
 * 部署步骤：
 * 1. cd ai-features
 * 2. wrangler login（如果未登录）
 * 3. wrangler secret put MINIMAX_API_KEY（粘贴 API Key）
 * 4. wrangler deploy
 */

const VERSION = '1.0.0';

// MiniMax API Base URL
const MINIMAX_BASE = 'https://api.minimaxi.com';

// ── CORS 通用头 ──────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── hex / base64 工具 ─────────────────────────────────────────────
function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ── MiniMax 通用请求 ─────────────────────────────────────────────
async function minimaxRequest(endpoint, body, env) {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return resp;
}

// ── 剧本生成 ─────────────────────────────────────────────────────
// POST /script
// Body: { theme, ageGroup, extraPrompt? }
async function handleScript(req, env, headers) {
  const { theme, ageGroup = '3-6', extraPrompt = '' } = await req.json();

  if (!theme) {
    return json({ error: 'theme is required' }, 400, headers);
  }

  const systemPrompt = `你是「籁鸣导演」平台的AI编剧专家，专为${ageGroup}岁儿童创作动画剧本。

请严格按以下格式输出剧本（JSON格式）：

{
  "title": "剧本标题",
  "ageGroup": "适用年龄",
  "duration": "预估时长",
  "theme": "教育主题（用顿号分隔）",
  "characters": [
    { "name": "角色名", "role": "主角/配角/反派", "description": "角色描述" }
  ],
  "acts": [
    {
      "act": "第X幕",
      "scenes": [
        {
          "sceneNum": "场景序号",
          "location": "场景地点",
          "time": "时间",
          "narration": "旁白（无则省略）",
          "dialogues": [
            { "character": "角色", "type": "台词/动作/表情", "content": "具体内容" }
          ],
          "cameraNote": "镜头语言说明"
        }
      ]
    }
  ],
  "eduValues": ["教育价值1", "教育价值2"],
  "tips": "分镜执行提示"
}`;

  const userPrompt = `请为${ageGroup}岁儿童创作一个关于"${theme}"的动画剧本。${extraPrompt}
要求：温馨有趣、积极向上，时长约5分钟，包含3幕结构（开端、发展、结局），每个场景标注镜头语言。`;

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/text/chatcompletion_v2`, {
    model: 'MiniMax-M2.7-highspeed',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_completion_tokens: 2000,
    temperature: 0.8,
  }, env);

  const data = await resp.json();
  console.log('[Worker] MiniMax /script raw response:', JSON.stringify(data).substring(0, 800));
  // 如果 MiniMax 返回 choices，直接返回整个 data（不额外包装），方便前端直接访问
  return json({ raw: data, model: 'MiniMax-M2.7-highspeed' }, 200, headers);
}

// ── 分镜规划 ─────────────────────────────────────────────────────
// POST /storyboard
// Body: { scene, style? }
async function handleStoryboard(req, env, headers) {
  const { scene, style = 'Q版卡通' } = await req.json();

  if (!scene) {
    return json({ error: 'scene is required' }, 400, headers);
  }

  const systemPrompt = `你是「籁鸣导演」平台的AI分镜规划师，专为儿童动画生成专业的分镜脚本。

请按以下JSON格式输出分镜规划：

{
  "totalShots": 总镜头数,
  "estimatedDuration": "预估总时长",
  "shots": [
    {
      "shotNum": "01",
      "shotType": "远景/全景/中景/近景/特写",
      "movement": "固定/推镜/拉镜/摇镜/跟镜",
      "icon": "推荐图标emoji",
      "description": "镜头画面描述",
      "duration": "镜头时长",
      "dialogue": "对话或旁白内容（无则空）",
      "cameraNote": "摄影指导"
    }
  ],
  "summary": "整体分镜节奏说明",
  "tips": "制作注意事项"
}`;

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/text/chatcompletion_v2`, {
    model: 'MiniMax-M2.7-highspeed',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请为以下动画场景生成详细分镜规划：${scene}，画风：${style}` },
    ],
    max_completion_tokens: 1500,
    temperature: 0.7,
  }, env);

  const data = await resp.json();
  return json({ data, model: 'MiniMax-M2.7-highspeed' }, 200, headers);
}

// ── 图像生成 ─────────────────────────────────────────────────────
// POST /image
// Body: { prompt, count?, style? }
async function handleImageGen(req, env, headers) {
  const { prompt, count = 1, style = 'cartoon', aspect_ratio = '1:1' } = await req.json();

  if (!prompt) {
    return json({ error: 'prompt is required' }, 400, headers);
  }

  // 追加画风提示
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

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/image_generation`, {
    model: 'image-01',
    prompt: fullPrompt,
    aspect_ratio: aspect_ratio,
    response_format: 'base64',
    num_images: Math.min(count, 9),
  }, env);

  // 处理非JSON响应（二进制图片）
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > 1000) {
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      return json({ images: [base64], model: 'image-01' }, 200, { ...headers, 'Content-Type': 'application/json' });
    }
    return json({ error: 'Image too small', size: buf.byteLength }, 500, headers);
  }

  const data = await resp.json();
  // 兼容不同返回格式
  const images = data.data?.image_base64 || data.data?.image_url_list || [data.data?.image_url].filter(Boolean);
  if (images && images.length > 0) {
    // 如果是URL，尝试拉取并转为base64
    const results = await Promise.all(images.map(async (img) => {
      if (img.startsWith('http')) {
        try {
          const r = await fetch(img);
          const buf = await r.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary);
        } catch { return img; }
      }
      return img;
    }));
    return json({ images: results, model: 'image-01' }, 200, headers);
  }
  return json({ data, model: 'image-01' }, 200, headers);
}

// ── 视频生成 ─────────────────────────────────────────────────────
// POST /video
// Body: { prompt?, image_base64?, duration?, model? }
async function handleVideoGen(req, env, headers) {
  const { prompt, image_base64, duration = 5, model = 'hailuo-2.3' } = await req.json();

  if (!prompt && !image_base64) {
    return json({ error: 'prompt or image_base64 is required' }, 400, headers);
  }

  // MiniMax 视频生成 API（Video-01）
  // 注意：实际模型名称需根据API文档确认
  const videoModel = 'video-01';

  const body = {
    model: videoModel,
    duration: Math.min(duration, 10),
  };

  if (image_base64) {
    body.image_base64 = image_base64;
  } else {
    body.text = prompt;
  }

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/video_generation`, body, env);

  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > 100) {
      return new Response(buf, {
        headers: { ...headers, 'Content-Type': 'video/mp4', 'Content-Disposition': 'inline' },
      });
    }
  }

  const data = await resp.json();
  return json({ data, model: videoModel }, 200, headers);
}

// ── 内容审核 ─────────────────────────────────────────────────────
// POST /review
// Body: { content }
async function handleReview(req, env, headers) {
  const { content } = await req.json();

  if (!content) {
    return json({ error: 'content is required' }, 400, headers);
  }

  const systemPrompt = `你是一个严格的内容安全审核员，专为儿童动画平台「籁鸣导演」工作。

请对以下剧本内容进行审核，返回JSON格式结果：

{
  "score": 总分(0-100),
  "grade": "优秀/良好/合格/需修改",
  "checks": [
    {
      "item": "检查项目",
      "status": "pass/warn/fail",
      "detail": "具体说明",
      "suggestion": "修改建议（fail时必须提供）"
    }
  ],
  "summary": "整体审核结论",
  "canProceed": true或false,
  "ageGroup": "建议适龄年龄"
}`;

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/text/chatcompletion_v2`, {
    model: 'MiniMax-M2.7-highspeed',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请审核以下剧本内容是否符合儿童动画标准：\n\n${content.substring(0, 4000)}` },
    ],
    max_completion_tokens: 1000,
    temperature: 0.3,
  }, env);

  const data = await resp.json();
  return json({ data, model: 'MiniMax-M2.7-highspeed' }, 200, headers);
}

// ── TTS 配音 ─────────────────────────────────────────────────────
// POST /tts
// Body: { text, voice_id?, speed?, model? }
async function handleTTS(req, env, headers) {
  const {
    text,
    voice_id = 'Chinese (Mandarin)_Lyrical_Voice',
    speed = 1.0,
    model = 'speech-2.8-hd',
  } = await req.json();

  if (!text) {
    return json({ error: 'text is required' }, 400, headers);
  }

  const validModels = ['speech-2.8-hd', 'speech-2.8-turbo'];
  const selectedModel = validModels.includes(model) ? model : 'speech-2.8-hd';

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/t2a_v2`, {
    model: selectedModel,
    text,
    stream: false,
    voice_setting: {
      voice_id,
      speed,
      vol: 1.0,
      pitch: 0,
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate: 128000,
      format: 'mp3',
    },
  }, env);

  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > 100) {
      return new Response(buf, {
        headers: { ...headers, 'Content-Type': 'audio/mpeg' },
      });
    }
    return json({ error: 'Audio too small', size: buf.byteLength }, 500, headers);
  }

  const data = await resp.json();
  const audioHex = data.data?.audio;
  if (audioHex) {
    const audioBytes = hexToUint8Array(audioHex);
    return new Response(audioBytes, {
      headers: { ...headers, 'Content-Type': 'audio/mpeg' },
    });
  }

  const audioUrl = data.data?.audio_url || data.audio_url;
  if (audioUrl) {
    const r = await fetch(audioUrl);
    const buf = await r.arrayBuffer();
    return new Response(buf, {
      headers: { ...headers, 'Content-Type': 'audio/mpeg' },
    });
  }

  return json({ data }, 200, headers);
}

// ── 工具函数 ─────────────────────────────────────────────────────
function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// ── 主入口 ────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/health') {
        return json({ status: 'ok', service: 'laiming-director-ai', version: VERSION }, 200, corsHeaders);
      }
      if (path === '/version') {
        return json({ version: VERSION }, 200, corsHeaders);
      }
      if (path === '/script') return handleScript(request, env, corsHeaders);
      if (path === '/storyboard') return handleStoryboard(request, env, corsHeaders);
      if (path === '/image') return handleImageGen(request, env, corsHeaders);
      if (path === '/video') return handleVideoGen(request, env, corsHeaders);
      if (path === '/review') return handleReview(request, env, corsHeaders);
      if (path === '/tts') return handleTTS(request, env, corsHeaders);

      return json({
        service: `laiming-director-ai v${VERSION}`,
        endpoints: ['/health', '/version', '/script', '/storyboard', '/image', '/video', '/review', '/tts'],
      }, 200, corsHeaders);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500, corsHeaders);
    }
  },
};
