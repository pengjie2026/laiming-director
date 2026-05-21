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

  const { theme, ageGroup = '6-12', extraContext = '' } = body;
  if (!theme) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'theme is required' }));
  }

  const extraPrompt = extraContext ? `\n附加信息：${extraContext}` : '';
  const systemPrompt = `你是一位专业的儿童动画剧本创作大师，曾参与多部央视少儿节目的剧本编写。
擅长创作3-12岁儿童动画剧本，通过生动有趣的故事情节传递正能量和基础知识。

核心创作理念：
1. 故事必须有趣，能吸引儿童注意力
2. 正面角色勇于挑战并获得成长
3. 反派角色要有可爱的一面，最终被感化而非消灭
4. 每集故事有明确的教育重点，但绝不说教
5. 旁白语言优美，帮助儿童理解画面

请从儿童视角创作剧本，角色台词要口语化、简洁，适合儿童理解和模仿。

JSON输出必须满足以下要求：
1. 使用标准JSON格式
2. 字符串值内不能包含未转义的控制字符
3. 数组和对象可以嵌套，但必须结构完整
4. 确保所有字符串值中的特殊字符已正确转义
5. JSON必须完整可解析，不能截断

请严格按以下JSON格式输出剧本：

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

要求：
1. 温馨有趣、积极向上
2. 时长约5分钟
3. 包含3幕结构（开端、发展、结局）
4. 每个场景标注镜头语言
5. 【必须】只输出上述JSON格式，不要任何其他文字说明`;

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
        max_tokens: 16000,
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
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
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
