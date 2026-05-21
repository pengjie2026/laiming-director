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

  const systemPrompt = `你的任务是把用户的简短故事描述转化为精炼的剧本生成提示词。规则：
1. 角色：用户提到的角色写清楚性格（用5-10字概括即可，不要写长篇人物小传）
2. 场景：根据故事描述具体化实验或其他场景的细节
3. 要求：忠转达用户的具体要求（风格、反转、对话比例等）
4. 不做的事：不要写"本剧共X集讲述XX故事"之类的产品说明；不要写分幕结构（那是AI写剧本时自己决定的）；不要写教育价值套话（如"传递友谊合作"）
5. 格式：自然段落，100-200字即可，不写标题，不要markdown，不要JSON`;

  const userName = theme.includes('和') ? theme.split('和')[0].trim() : theme;

  const userPrompt = `将以下信息转为精炼剧本提示词：
主题：${theme}
年龄：${ageGroup}岁
故事：${storyDesc || '（自由发挥创意）'}
${episodeCount > 1 ? `集数：${episodeCount}集` : ''}
${duration ? `时长：${duration}` : ''}

输出精炼提示词（直接输出，不要标题、不要说明文字）：`;

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
        max_tokens: 500,
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
