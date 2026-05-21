const MINIMAX_BASE = 'https://api.minimax.chat';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.end('ok');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'MINIMAX_API_KEY is not set in environment variables' }));
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
  }

  const {
    theme = '',
    ageGroup = '6-12',
    storyDesc = '',
    eduThemes = '',
    episodeCount = 1,
    duration = '5分钟',
  } = body;

  const systemPrompt = `你是一位资深儿童动画编剧和AI提示词工程师。
你的任务是根据用户提供的创作需求，生成一段高质量、结构化的AI提示词（prompt），
该提示词将被发送给另一个AI模型来生成儿童动画剧本。

生成的提示词必须：
1. 完整描述故事主题、核心冲突、角色设定、叙事风格
2. 明确目标受众年龄和心理特征
3. 指定教育价值导向（不说教，融入剧情）
4. 给出叙事节奏建议（开端→发展→高潮→结局）
5. 包含分幕结构要求和每幕要点
6. 用中文书写，语气专业但不生硬
7. 输出为可直接使用的纯文本提示词（不要JSON、不要代码块、不要额外说明）
8. 长度控制在300-600字`;

  const userPrompt = `请根据以下信息生成一份AI提示词：

【故事主题】${theme}
【目标年龄】${ageGroup}岁儿童
【故事描述】${storyDesc || '（由你自由发挥创意）'}
【教育主题】${eduThemes || '友谊合作、探索成长'}
【集数】${episodeCount}集${episodeCount > 1 ? '连续剧' : ''}
【单集时长】${duration}

请直接输出一段连续的自然语言提示词文本（不要任何格式化标记、不要JSON、不要代码块、不要列举要点编号）。
提示词应当能够引导另一个AI生成完整的儿童动画剧本。`;

  let data;
  try {
    const resp = await fetch(`${MINIMAX_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7-highspeed',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });
    data = await resp.json();
    if (!resp.ok) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ error: data.error?.message || `MiniMax API ${resp.status}` }));
    }
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err.message }));
  }

  let promptText = '';
  const choices = data?.choices;
  if (choices && choices.length > 0) {
    promptText = choices[0]?.message?.content || '';
    // 清理可能残留的 markdown 和 thinking 标签
    promptText = promptText
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .replace(/^["']|["']$/g, '')  // 去除可能的首尾引号
      .trim();
  }

  return res.end(JSON.stringify({
    prompt: promptText,
    model: 'MiniMax-M2.7-highspeed',
  }));
}
