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

  const { content, mode = 'review' } = req.body;
  if (!content) { res.status(400).json({ error: 'content is required' }); return; }

  // mode: 'review' = 内容审核, 'optimize' = 优化建议
  const isOptimize = mode === 'optimize';

  const systemPrompt = isOptimize
    ? `你是一位资深的儿童动画剧本编辑。请对提供的剧本进行专业分析，给出具体、可执行的优化建议。

请严格按以下JSON格式输出（使用英文键名）：
{
  "score": 85,
  "summary": "整体评价摘要",
  "strengths": ["优点1", "优点2"],
  "concerns": [
    {
      "type": "minor",
      "title": "问题标题",
      "body": "详细说明和修改建议"
    }
  ],
  "suggestions": [
    {
      "title": "优化维度标题",
      "body": "具体优化建议内容"
    }
  ]
}

注意事项：
1. score 为 0-100 的整数
2. strengths 至少列出 2 个优点
3. concerns 如无可留空数组
4. suggestions 是核心输出，必须包含结构完整度、节奏优化、对白自然度、适龄评估、画面感等维度的具体建议
5. 只输出JSON，不要任何其他文字`
    : `你是一个严格的内容安全审核员，为儿童动画平台「籁鸣导演」工作。

请严格按以下JSON格式输出审核结果（使用英文键名）：
{
  "score": 95,
  "grade": "A级 - 优秀儿童动画剧本",
  "canProceed": true,
  "summary": "审核总结",
  "checks": [
    {
      "item": "检查项名称",
      "status": "pass",
      "detail": "检查详情",
      "suggestion": "改进建议（如通过可省略）"
    }
  ]
}

checks 必须包含以下检查项：
1. 暴力内容 - 检查是否有暴力、打斗、危险行为示范
2. 色情内容 - 检查是否有不当身体描写
3. 恐怖内容 - 检查是否有惊吓、恐怖元素
4. 歧视性内容 - 检查是否有性别、种族、身体歧视
5. 语言文明 - 检查用语是否文明、是否有脏话
6. 价值观导向 - 检查是否符合社会主义核心价值观
7. 心理安全 - 检查是否会造成儿童心理不适
8. 适龄性 - 检查内容是否适合目标年龄段

status 取值：pass（通过）/ warn（警告）/ fail（不通过）
只输出JSON，不要任何其他文字。`;

  const resp = await minimaxRequest(`${MINIMAX_BASE}/v1/chat/completions`, {
    model: 'MiniMax-M2.7-highspeed',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请${isOptimize ? '分析并给出优化建议' : '审核'}以下内容：\n\n${content.substring(0, 4000)}` },
    ],
    max_tokens: 2000,
    temperature: 0.3,
  });

  const data = await resp.json();

  // 清理 markdown 代码块和 thinking 标签
  const choices = data?.choices;
  if (choices && choices.length > 0) {
    let content = choices[0]?.message?.content || '';
    content = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();
    choices[0].message.content = content;
  }

  res.json({ data, model: 'MiniMax-M2.7-highspeed', mode });
}
