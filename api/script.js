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

  const { theme, ageGroup = '6-12', extraPrompt = '', episodeCount = 1 } = body;
  if (!theme) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'theme is required' }));
  }

  const hasCustomPrompt = extraPrompt && extraPrompt.trim().length >= 50;
  const isMultiEpisode = parseInt(episodeCount) > 1;
  const episodeHint = isMultiEpisode
    ? `\n【重要】请创作${episodeCount}集连续剧，每集有独立的小故事但主线贯穿。输出格式中 acts 改为 episodes 数组，每项包含 episodeNumber、episodeTitle、acts 等字段。`
    : '';

  const systemPromptBase = `你是专业的儿童动画编剧。核心要求：
1. 故事有趣，吸引3-12岁儿童；角色口语化简洁
2. 3幕结构：开端→发展→结局；每场景含地点/时间/旁白/对话/镜头
3. 不说教，反派可被感化
4. 每个台词/动作标注角色、类型(台词/动作/表情)、内容
${isMultiEpisode ? `5. ${episodeCount}集连续剧：每集独立成章，主线贯穿` : ''}
【重要】若用户消息含"以下为用户提供的详细剧本创作方向"，必须严格遵照角色、情节，只负责充实扩展。`;

  const schemaSingle = `输出JSON格式：{"title":"","ageGroup":"","duration":"","theme":"","characters":[{"name":"","role":"主角/配角/反派","description":""}],"acts":[{"act":"第X幕","scenes":[{"sceneNum":"","location":"","time":"","narration":"","dialogues":[{"character":"","type":"台词/动作/表情","content":""}],"cameraNote":""}]}],"eduValues":[],"tips":""}`;

  const schemaMulti = `输出JSON格式：{"seriesTitle":"","ageGroup":"","totalEpisodes":${episodeCount},"theme":"","characters":[{"name":"","role":"","description":""}],"episodes":[{"episodeNumber":1,"episodeTitle":"","duration":"","acts":[{"act":"","scenes":[{"sceneNum":"","location":"","time":"","narration":"","dialogues":[{"character":"","type":"","content":""}],"cameraNote":""}]}]}],"eduValues":[],"tips":""}`;

  const systemPrompt = `${systemPromptBase}\n${isMultiEpisode ? schemaMulti : schemaSingle}`;

  // 当有详细自定义提示词时，将其作为主要创作方向
  let userPrompt;
  if (hasCustomPrompt) {
    userPrompt = `【以下为用户提供的详细剧本创作方向，请严格遵照执行】

${extraPrompt}

【补充技术要求】
- 目标受众：${ageGroup}岁儿童
- 故事主题关键词：${theme}
${isMultiEpisode ? `- 总集数：${episodeCount}集，每集独立成章又前后呼应
` : `- 单集剧本
`}- 时长：约5分钟${isMultiEpisode ? '/集' : ''}
- 结构：${isMultiEpisode ? '每' : ''}集包含3幕（开端→发展→结局）
- 每个场景必须包含：场景地点、时间、旁白、角色台词（含对话和动作）、镜头语言说明
- 角色台词要口语化、简洁，适合儿童理解和模仿
${isMultiEpisode ? '- 输出格式中 acts 改为 episodes 数组，每项包含 episodeNumber、episodeTitle、acts 等字段\n' : ''}- 【必须】只输出JSON格式，不要任何其他文字说明`;
  } else {
    const episodeInstruction = isMultiEpisode
      ? `请为${ageGroup}岁儿童创作${episodeCount}集关于"${theme}"的连载动画剧本。每集约5分钟，每集有独立的起承转合，同时整体有一条贯穿主线。`
      : `请为${ageGroup}岁儿童创作一个关于"${theme}"的动画剧本。`;

    userPrompt = `${episodeInstruction}${episodeHint}

要求：
1. 温馨有趣、积极向上
2. 时长约5分钟${isMultiEpisode ? '/集' : ''}
3. 包含3幕结构（开端、发展、结局）
4. 每个场景标注镜头语言
5. 【必须】只输出上述JSON格式，不要任何其他文字说明`;
  }

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
        max_tokens: isMultiEpisode ? Math.min(5000 * episodeCount, 20000) : 5000,
        temperature: 0.8,
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

  let cleanedContent = '';
  const choices = data?.choices;
  if (choices && choices.length > 0) {
    let rawContent = choices[0]?.message?.content || '';
    rawContent = rawContent
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();
    cleanedContent = rawContent;
  }

  let scriptData = null;
  try { scriptData = JSON.parse(cleanedContent); } catch (_) {}

  return res.end(JSON.stringify({
    raw: data,
    content: cleanedContent,
    script: scriptData,
    model: 'MiniMax-M2.7-highspeed',
  }));
}
