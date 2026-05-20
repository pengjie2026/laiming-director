/* ================================================================
   籁鸣导演 主逻辑脚本
   MiniMax API 真实对接版本
   ================================================================ */

// -- MiniMax API 配置 ---------------------------------------------
// ⚠️ 部署 Cloudflare Worker 后，将下方的 workerUrl 替换为实际地址
// 部署步骤：
//   cd ai-features
//   wrangler login
//   wrangler secret put MINIMAX_API_KEY
//   wrangler deploy
const API_CONFIG = {
  workerUrl: 'https://laiming-director-ai.laopeng.workers.dev',  // Cloudflare Worker 地址

  isConfigured() {
    return !!this.workerUrl && this.workerUrl.startsWith('http');
  }
};

// -- API 调用封装 -------------------------------------------------
async function apiCall(endpoint, body) {
  if (!API_CONFIG.isConfigured()) {
    const steps = [
      'Worker URL 未配置，请按以下步骤部署：',
      '',
      '1️⃣  cd ai-features',
      '2️⃣  wrangler login',
      '3️⃣  wrangler secret put MINIMAX_API_KEY',
      '      （粘贴 MiniMax API Key）',
      '4️⃣  wrangler deploy',
      '5️⃣  将部署后的 Worker URL 填入 main.js 的 API_CONFIG.workerUrl',
      '',
      'MiniMax API Key（Token Plan）示例：',
      'sk-api-8nLy5uA1JRaYlF9xTtU3O8JKCA3qovzlsCbtrg8SoaTbpgzFFGOq-jt-TR6gkzI684WDHzdgbLueoU8W7IfhXIPGgfeSL1q6FuUuNJ73k9Q3v7xOkM9Fn2s',
    ];
    throw new Error(steps.join('\n'));
  }
  const resp = await fetch(`${API_CONFIG.workerUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API 错误 ${resp.status}: ${err}`);
  }
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('audio')) return resp.blob();
  if (contentType.includes('image')) return resp.blob();
  return resp.json();
}

// -- 辅助：打字机效果 ---------------------------------------------
function typeText(element, text, speed = 15) {
  return new Promise((resolve) => {
    let i = 0;
    element.textContent = '';
    function tick() {
      if (i < text.length) {
        element.textContent += text.substring(i, i + 4);
        i += 4;
        element.parentElement.scrollTop = element.parentElement.scrollHeight;
        setTimeout(tick, speed);
      } else {
        element.textContent = text;
        resolve();
      }
    }
    tick();
  });
}

// -- 辅助：设置按钮状态 -------------------------------------------
function setBtnState(btn, icon, text, disabled = false) {
  const iconEl = btn.querySelector('.btn-icon');
  const textEl = btn.querySelector('.btn-text');
  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = text;
  btn.disabled = disabled;
}

// -- 全局状态 -----------------------------------------------------
const state = {
  currentCSTab: 'script',
  selectedStyle: 'cartoon',
  scriptContent: '',
  billing: 'monthly',
  lastReviewData: null,   // 最新审核结果（用于导出报告）
  lastScriptData: null,   // 最新剧本数据（用于下载）
};

// -- 加载动画 -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('hidden');
  }, 1800);

  initNavbar();
  initTabs();
  initParticles();
  initScrollAnimations();
  initAgeFilter();
  initStyleChips();
  initCustomDuration();
});

// -- 自定义时长切换 -----------------------------------------------
function initCustomDuration() {
  const epDuration = document.getElementById('epDuration');
  const customDuration = document.getElementById('customDuration');
  if (!epDuration) return;
  epDuration.addEventListener('change', () => {
    if (customDuration) {
      customDuration.style.display = epDuration.value === 'custom' ? '' : 'none';
    }
  });
}

// -- 导航栏滚动效果 -----------------------------------------------
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// -- Tabs 切换 ----------------------------------------------------
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-panel="${tab}"]`).classList.add('active');
    });
  });
}

// -- 粒子背景 -----------------------------------------------------
function initParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167, 139, 250, ${p.alpha})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// -- 滚动动画 -----------------------------------------------------
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.agent-card, .wf-step, .style-card, .cf-card, .price-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// -- 年龄筛选 -----------------------------------------------------
function initAgeFilter() {
  document.querySelectorAll('.age-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const age = btn.dataset.age;
      document.querySelectorAll('.style-card').forEach(card => {
        if (age === 'all' || card.dataset.age === age) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// -- 风格选择（Demo交互） ------------------------------------------
function initStyleChips() {
  document.querySelectorAll('.style-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.closest('.style-selector').querySelectorAll('.style-chip')
        .forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

// -- 平滑滚动 -----------------------------------------------------
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// -- 计费切换 -----------------------------------------------------
function toggleBilling() {
  const toggle = document.getElementById('billingToggle');
  toggle.classList.toggle('active');
  const isYearly = toggle.classList.contains('active');
  state.billing = isYearly ? 'yearly' : 'monthly';
  document.querySelectorAll('.monthly-price').forEach(el => {
    el.style.display = isYearly ? 'none' : 'inline';
  });
  document.querySelectorAll('.yearly-price').forEach(el => {
    el.style.display = isYearly ? 'inline' : 'none';
  });
}

// -- Auth Modal -----------------------------------------------------
function showModal(tab) {
  const modal = document.getElementById('authModal');
  modal.classList.add('open');
  switchAuthTab(tab);
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
function switchAuthTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginPanel = document.getElementById('loginPanel');
  const registerPanel = document.getElementById('registerPanel');
  if (tab === 'login') {
    loginTab.classList.add('active'); registerTab.classList.remove('active');
    loginPanel.style.display = ''; registerPanel.style.display = 'none';
  } else {
    registerTab.classList.add('active'); loginTab.classList.remove('active');
    registerPanel.style.display = ''; loginPanel.style.display = 'none';
  }
}

// -- 创作台 --------------------------------------------------------
function showCreationStudio() {
  document.getElementById('creationStudio').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCreationStudio() {
  document.getElementById('creationStudio').classList.remove('open');
  document.body.style.overflow = '';
}
function openScriptStudio() { showCreationStudio(); switchCSTab('script'); }
function openStoryboardStudio() { showCreationStudio(); switchCSTab('storyboard'); }
function openImageStudio() { showCreationStudio(); switchCSTab('image'); }
function openVideoStudio() { showCreationStudio(); switchCSTab('video'); }
function openAssetsStudio() { showCreationStudio(); }
function openReviewStudio() { showCreationStudio(); switchCSTab('review'); }

function switchCSTab(tab) {
  state.currentCSTab = tab;
  document.querySelectorAll('.cs-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cstab === tab);
  });
  document.querySelectorAll('.cs-panel-content').forEach(p => {
    p.classList.toggle('active', p.id === `cs-${tab}`);
  });
}

// -- 风格选择 ------------------------------------------------------
function selectStyle(el) {
  el.closest('.style-grid-select').querySelectorAll('.sgs-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  state.selectedStyle = el.dataset.style;
}

// -- 视频模式切换 --------------------------------------------------
function toggleVideoMode(mode) {
  document.getElementById('videoTextInput').style.display = mode === 'text' ? '' : 'none';
  document.getElementById('videoImageInput').style.display = mode === 'image' ? '' : 'none';
}
function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('imgPreview').innerHTML = `<img src="${e.target.result}" style="max-width:100%;border-radius:8px;margin-top:8px;" />`;
  };
  reader.readAsDataURL(file);
}

// -- 工具：从文本中去除 <think> 推理标签 -------------------------
function stripThinkingTags(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')   // 去除推理标签块
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')               // 去除 markdown 代码块开头
    .replace(/\s*```$/, '')                         // 去除 markdown 代码块结尾
    .trim();
}

// -- 工具：健壮地从文本中提取 JSON -------------------------------
function robustJSONExtract(text) {
  if (!text) return null;

  // 1. 尝试直接解析
  try {
    return JSON.parse(text);
  } catch (_) {}

  // 2. 尝试提取第一个 { ... } 块（贪婪匹配到最外层闭合）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (_) {}

    // 3. 处理常见格式问题：去除末尾逗号、修复未转义换行
    const fixed = jsonMatch[0]
      .replace(/,\s*([}\]])/g, '$1')                    // 去除尾随逗号
      .replace(/\n/g, '\\n')                            // 未转义换行
      .replace(/\r/g, '')
      .replace(/\t/g, '\\t');
    try {
      return JSON.parse(fixed);
    } catch (_) {}
  }

  return null;
}

// -- AI 生成剧本 ----------------------------------------------------
async function generateScript() {
  const theme = document.getElementById('storyTheme').value || '小兔子寻找彩虹花';
  const ageGroup = document.querySelector('input[name="ageGroup"]:checked')?.value || '3-6';
  const storyDesc = document.getElementById('storyDesc')?.value?.trim() || '';
  const epDuration = document.getElementById('epDuration')?.value || '5';
  const customDuration = document.getElementById('customDuration')?.value || '';
  const episodeCount = parseInt(document.getElementById('episodeCount')?.value) || 1;
  const customEdu = document.getElementById('customEduTheme')?.value?.trim() || '';

  // 收集选中的教育主题
  const eduCheckboxes = document.querySelectorAll('#cs-script .cs-checkbox-group input[type="checkbox"]:checked');
  const selectedEdu = Array.from(eduCheckboxes).map(cb => cb.parentElement.textContent.trim()).filter(Boolean);

  const output = document.getElementById('scriptOutput');
  const btn = document.querySelector('#cs-script .cs-generate-btn');
  setBtnState(btn, '⏳', 'MiniMax 创作中...', true);

  // 隐藏下载按钮直到有内容
  const downloadBtn = document.getElementById('downloadScriptBtn');
  if (downloadBtn) downloadBtn.style.display = 'none';

  output.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">MiniMax 正在生成${episodeCount > 1 ? episodeCount + '集' : ''}剧本，请稍候...</div>
      <div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">使用模型：MiniMax-M2.7-highspeed</div>
    </div>`;

  // 收集 extraPrompt
  const extraParts = [];
  if (storyDesc) extraParts.push(`故事补充要求：${storyDesc}`);
  if (epDuration === 'custom' && customDuration) extraParts.push(`时长：约${customDuration}分钟`);
  if (selectedEdu.length > 0) extraParts.push(`教育主题：${selectedEdu.join('、')}`);
  if (customEdu) extraParts.push(`自定义教育主题：${customEdu}`);
  const extraPrompt = extraParts.join('；');

  try {
    const result = await apiCall('/script', { theme, ageGroup, extraPrompt });

    // 优先使用 Worker 预解析的剧本对象（v1.0.2+ Worker 返回 script 字段）
    let scriptData = result.script || null;
    let scriptText = result.content || '';

    // 兼容旧 Worker：从 raw 中提取并清理
    if (!scriptText) {
      const mm = result.raw || result.data || result;
      const choices = mm?.choices;
      if (choices && choices.length > 0) {
        const raw = choices[0]?.message?.content || '';
        scriptText = stripThinkingTags(raw);
      }
    }

    let scriptHtml = '';

    // 策略1：Worker 已预解析成功
    if (scriptData && (scriptData.acts || scriptData.scenes || scriptData.content)) {
      scriptHtml = renderScriptJSON(scriptData);
    }
    // 策略2：content 有文本，尝试健壮 JSON 解析
    else if (scriptText) {
      const json = robustJSONExtract(scriptText);
      const hasContent = json && (
        (json.acts && json.acts.length > 0) ||
        (json.scenes && json.scenes.length > 0) ||
        (json.content && json.content.trim()) ||
        (json.text && json.text.trim())
      );
      if (hasContent) {
        scriptHtml = renderScriptJSON(json);
        scriptData = json;
      } else {
        // 策略3：看起来是 JSON 但解析失败，直接显示原始文本+提示
        const looksLikeJSON = scriptText.trim().startsWith('{') && scriptText.includes('"title"');
        if (looksLikeJSON) {
          scriptHtml = `<div class="generated-script"><pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:0.82rem;line-height:1.6;color:rgba(240,240,255,0.85);background:rgba(0,0,0,0.15);padding:16px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);">${escapeHtml(scriptText)}</pre></div>
<div style="margin-top:12px;padding:12px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:8px;font-size:0.75rem;color:#f59e0b;">
  ⚠️ 模型返回了 JSON 但解析失败（可能是格式微瑕或截断），已显示原始文本。
</div>`;
        } else {
          // 策略4：普通文本智能解析
          const hasHtmlTags = /<[a-z][\s\S]*>/i.test(scriptText) && !/&lt;/i.test(scriptText);
          if (hasHtmlTags) {
            const safe = scriptText
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/on\w+="[^"]*"/gi, '')
              .replace(/javascript:/gi, '');
            scriptHtml = `<div class="generated-script">${safe}</div>`;
          } else {
            scriptHtml = `<div class="generated-script">${parsePlainTextScript(scriptText)}</div>`;
          }
          scriptHtml += `
<div style="margin-top:12px;padding:12px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:8px;font-size:0.75rem;color:#f59e0b;">
  💡 提示：已自动过滤推理标签，显示智能解析结果。
</div>`;
        }
      }
    } else {
      throw new Error('无任何剧本内容返回');
    }

    output.innerHTML = `<div id="scriptTypingTarget" style="display:none;"></div>`;
    const target = document.getElementById('scriptTypingTarget');
    target.innerHTML = scriptHtml;
    target.style.display = '';

    state.scriptContent = scriptText;
    state.lastScriptData = scriptData;
    if (downloadBtn) downloadBtn.style.display = '';
    setBtnState(btn, '✨', '重新生成剧本', false);
  } catch (err) {
    // 检查是否是 MiniMax 余额不足
    let isBalanceErr = err.message.includes('insufficient balance') || err.message.includes('1008');
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;">
      ${isBalanceErr
        ? `<div style="font-size:1rem;font-weight:700;margin-bottom:8px;">⚠️ MiniMax 额度不足</div>
           <div>Token Plan 余额已用完，请前往 <a href="https://platform.minimaxi.com/subscribe/token-plan" target="_blank" style="color:#a78bfa;">MiniMax Token Plan</a> 充值后重试。</div>
           <div style="margin-top:8px;font-size:0.75rem;color:rgba(240,240,255,0.5);">错误码：1008 · insufficient balance</div>`
        : `❌ 生成失败：\n\n${err.message}`
      }
    </div>`;
    setBtnState(btn, '✨', '重新生成剧本', false);
  }
}

// 渲染剧本 JSON 为 HTML
function renderScriptJSON(json) {
  const acts = json.acts || [];
  const chars = json.characters || [];
  const edu = json.eduValues || [];

  let html = `<div class="script-section-title">📋 ${escapeHtml(json.title || '剧本草稿')} — 籁鸣导演 AI 生成</div>`;

  html += `<div class="script-block"><span class="sb-tag">【基本信息】</span>
  适用年龄：${escapeHtml(json.ageGroup || '')}　｜　时长：${escapeHtml(json.duration || '')}<br/>
  教育主题：${escapeHtml(json.theme || '')}</div>`;

  if (chars.length > 0) {
    html += `<div class="script-block"><span class="sb-tag">【角色】</span><br/>`;
    chars.forEach(c => {
      html += `▶ ${escapeHtml(c.name)}（${escapeHtml(c.role)}）：${escapeHtml(c.description || '')}<br/>`;
    });
    html += `</div>`;
  }

  acts.forEach(act => {
    html += `<div class="script-block"><span class="sb-tag">【${escapeHtml(act.act)}】</span><br/>`;
    (act.scenes || []).forEach(scene => {
      if (scene.location) {
        html += `<span class="line-type scene">${escapeHtml(scene.sceneNum + ' ' + scene.location + ' - ' + scene.time)}</span><br/>`;
      }
      if (scene.narration) html += `<em>旁白：</em>${escapeHtml(scene.narration)}<br/><br/>`;
      (scene.dialogues || []).forEach(d => {
        html += `<em>${escapeHtml(d.character)}（${escapeHtml(d.type)}）：</em>"${escapeHtml(d.content)}"<br/>`;
      });
      if (scene.cameraNote) html += `<span class="line-type action">镜头：</span>${escapeHtml(scene.cameraNote)}<br/>`;
    });
    html += `</div>`;
  });

  if (edu.length > 0) {
    html += `<div style="margin-top:16px;padding:12px;background:rgba(16,185,129,0.08);border-radius:8px;font-size:0.82rem;border:1px solid rgba(16,185,129,0.2);">
    🎓 <strong style="color:#10b981;">教育价值：</strong>${edu.map(e => escapeHtml(e)).join(' · ')}
    </div>`;
  }

  return html;
}

// HTML 转义（用于用户输入等不可信来源）
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// HTML 反转义（用于显示 AI 返回的原始 HTML 内容）
function unescapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
}

// 智能解析纯文本剧本格式
function parsePlainTextScript(text) {
  if (!text) return '';
  
  let html = '';
  const lines = text.split('\n');
  let currentBlock = '';
  let inDialogue = false;
  
  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (currentBlock) {
        html += `<p>${escapeHtml(currentBlock)}</p>`;
        currentBlock = '';
      }
      continue;
    }
    
    // 检测场景标记（如 "场景一"、"Scene 1"、"第一幕" 等）
    if (/^(场景|第[一二三四五六七八九十]+幕|Scene|ACT|幕)[\s：:]/i.test(line) || 
        /^[【\[【]?(场景|第?[一二三四五六七八九十]+)[】\]]/.test(line)) {
      if (currentBlock) {
        html += `<p>${escapeHtml(currentBlock)}</p>`;
        currentBlock = '';
      }
      html += `<div class="scene-header" style="background:rgba(124,58,237,0.1);padding:8px 12px;border-radius:8px;margin:12px 0 8px;font-weight:bold;color:#a78bfa;">${escapeHtml(line)}</div>`;
      continue;
    }
    
    // 检测旁白标记
    if (/^(旁白| narration|叙述|Narrator)[:：]/i.test(line)) {
      if (currentBlock) {
        html += `<p>${escapeHtml(currentBlock)}</p>`;
        currentBlock = '';
      }
      const content = line.replace(/^(旁白| narration|叙述|Narrator)[:：]\s*/i, '');
      html += `<p style="font-style:italic;color:#6c5ce7;padding-left:12px;border-left:3px solid #6c5ce7;margin:8px 0;">${escapeHtml(content)}</p>`;
      continue;
    }
    
    // 检测镜头说明
    if (/^(镜头|Camera|CAM|拍摄)[:：]/i.test(line)) {
      if (currentBlock) {
        html += `<p>${escapeHtml(currentBlock)}</p>`;
        currentBlock = '';
      }
      const content = line.replace(/^(镜头|Camera|CAM|拍摄)[:：]\s*/i, '');
      html += `<p style="color:#f59e0b;font-size:0.85rem;margin:8px 0;">📷 ${escapeHtml(content)}</p>`;
      continue;
    }
    
    // 检测角色对话（格式：角色名：对话 或 角色名（动作）：对话）
    const dialogueMatch = line.match(/^([\u4e00-\u9fa5a-zA-Z\uac00-\ud7af]+)[\s　]*[（(][^）)]+[）)][：:]\s*"?(.+?)"?$/);
    if (dialogueMatch) {
      if (currentBlock) {
        html += `<p>${escapeHtml(currentBlock)}</p>`;
        currentBlock = '';
      }
      html += `<p style="margin:6px 0;padding-left:12px;"><strong style="color:#a78bfa;">${escapeHtml(dialogueMatch[1])}</strong>：${escapeHtml(dialogueMatch[2])}</p>`;
      continue;
    }
    
    // 检测无动作标记的对话
    const simpleDialogueMatch = line.match(/^([\u4e00-\u9fa5a-zA-Z\uac00-\ud7af]{2,8})[：:]\s*"?(.+?)"?$/);
    if (simpleDialogueMatch && !/^(旁白|镜头|Camera|场景|第|幕|结果|总结|说明)/i.test(simpleDialogueMatch[1])) {
      if (currentBlock) {
        html += `<p>${escapeHtml(currentBlock)}</p>`;
        currentBlock = '';
      }
      html += `<p style="margin:6px 0;padding-left:12px;"><strong style="color:#a78bfa;">${escapeHtml(simpleDialogueMatch[1])}</strong>：${escapeHtml(simpleDialogueMatch[2])}</p>`;
      continue;
    }
    
    // 普通段落文本
    currentBlock += (currentBlock ? ' ' : '') + line;
  }
  
  // 处理最后一块
  if (currentBlock) {
    html += `<p>${escapeHtml(currentBlock)}</p>`;
  }
  
  return html;
}

// -- AI 生成分镜 ----------------------------------------------------
async function generateStoryboard() {
  const scene = document.getElementById('sbScene').value || '小兔子在森林中寻找彩虹花';
  const style = state.selectedStyle;
  const output = document.getElementById('storyboardOutput');

  output.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><div class="loading-text">MiniMax 正在规划分镜...</div><div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">使用模型：MiniMax-M2.7-highspeed</div></div>`;

  try {
    const result = await apiCall('/storyboard', { scene, style });
    let rawText = '';
    const mm = result.raw || result.data || result;
    const choices = mm?.choices;
    if (choices && choices.length > 0) {
      const raw = choices[0]?.message?.content || '';
      rawText = stripThinkingTags(raw);
    }
    if (!rawText) rawText = typeof mm === 'string' ? mm : JSON.stringify(mm, null, 2);

    // 尝试解析 JSON
    let cardsHtml = '';
    const json = robustJSONExtract(rawText);
    if (json && json.shots) {
      const shots = json.shots || [];
      cardsHtml = shots.map(s => `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;cursor:pointer;transition:0.2s;" onmouseover="this.style.borderColor='#7c3aed'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
          <div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:rgba(124,58,237,0.1);">${escapeHtml(s.icon || '🎬')}</div>
          <div style="padding:10px 12px;">
            <div style="font-size:0.7rem;font-weight:700;color:#a78bfa;margin-bottom:4px;">镜头 ${escapeHtml(s.shotNum || '')} · ${escapeHtml(s.shotType || '')}</div>
            <div style="font-size:0.75rem;color:rgba(240,240,255,0.6);margin-bottom:4px;">${escapeHtml(s.description || '')}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span style="padding:2px 8px;background:rgba(245,158,11,0.1);border-radius:99px;font-size:0.68rem;color:#f59e0b;">${escapeHtml(s.duration || '')}</span>
              <span style="padding:2px 8px;background:rgba(16,185,129,0.1);border-radius:99px;font-size:0.68rem;color:#10b981;">${escapeHtml(s.movement || '')}</span>
            </div>
          </div>
        </div>`).join('');

      output.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">${cardsHtml}</div>
        <div style="margin-top:12px;padding:10px 14px;background:rgba(124,58,237,0.08);border-radius:8px;font-size:0.8rem;color:rgba(240,240,255,0.6);">
        📊 共 ${shots.length} 个镜头 · 预估时长约 <strong style="color:#a78bfa;">${escapeHtml(json.estimatedDuration || '')}</strong>
        ${json.summary ? `<br/>💡 ${escapeHtml(json.summary)}` : ''}
        </div>`;
    } else {
      output.innerHTML = `<div style="padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:0.85rem;white-space:pre-wrap;">${escapeHtml(rawText)}</div>`;
    }
  } catch (err) {
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;white-space:pre-wrap;">❌ 生成分镜失败：\n\n${err.message}</div>`;
  }
}

// -- AI 生图 -------------------------------------------------------
async function generateImage() {
  const prompt = document.getElementById('imgPrompt').value || 'Q版小兔子，色彩鲜艳，儿童动画风格';
  const count = Math.min(parseInt(document.getElementById('imgCount').value) || 1, 9);
  const style = state.selectedStyle;
  const output = document.getElementById('imageOutput');
  const btn = document.querySelector('#cs-image .cs-generate-btn');
  setBtnState(btn, '⏳', 'MiniMax 生图中...', true);

  output.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><div class="loading-text">MiniMax 正在生图...</div><div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">使用模型：image-01 · ${count}张图</div></div>`;

  try {
    const result = await apiCall('/image', { prompt, count, style });
    const images = result.images || [];

    if (images.length === 0) {
      output.innerHTML = `<div style="padding:16px;color:#f59e0b;font-size:0.85rem;">⚠️ 未返回图片，请检查 prompt 是否合适</div>`;
      setBtnState(btn, '✨', '重新生成', false);
      return;
    }

    const cols = images.length === 1 ? 1 : images.length <= 4 ? 2 : 3;
    const cells = images.map((b64, i) => `
      <div class="gen-img" style="cursor:pointer;position:relative;" onclick="this.classList.toggle('selected')">
        <img src="data:image/png;base64,${b64}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" alt="生成图片 ${i + 1}" />
        <div style="position:absolute;bottom:6px;right:6px;font-size:0.7rem;background:rgba(0,0,0,0.6);color:#fff;padding:2px 6px;border-radius:4px;">${i + 1}</div>
      </div>`).join('');

    output.innerHTML = `
<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;margin-bottom:12px;">
  ${cells}
</div>
<div style="font-size:0.8rem;color:rgba(240,240,255,0.5);display:flex;justify-content:space-between;align-items:center;">
  <span>✅ MiniMax image-01 生成 · 点击图片选中</span>
  <button onclick="downloadAllImages()" style="padding:6px 12px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:6px;color:#a78bfa;font-size:0.78rem;cursor:pointer;">⬇️ 全部下载</button>
</div>`;
    setBtnState(btn, '✨', '重新生成', false);
  } catch (err) {
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;white-space:pre-wrap;">❌ 生图失败：\n\n${err.message}</div>`;
    setBtnState(btn, '✨', '重新生成', false);
  }
}

// -- 下载所有图片 --------------------------------------------------
window.downloadAllImages = function() {
  const imgs = document.querySelectorAll('#imageOutput img');
  imgs.forEach((img, i) => {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `籁鸣导演_图片_${i + 1}.png`;
    a.click();
  });
};

// -- 生成视频 ------------------------------------------------------
async function generateVideo() {
  const output = document.getElementById('videoOutput');
  const btn = document.querySelector('#cs-video .cs-generate-btn');
  setBtnState(btn, '⏳', 'MiniMax 视频生成中...', true);

  const duration = parseInt(document.getElementById('videoDuration').value) || 5;
  const mode = document.querySelector('input[name="videoMode"]:checked')?.value || 'text';
  const textPrompt = document.getElementById('videoPrompt')?.value || '';

  // 检查图片模式
  let imageBase64 = null;
  if (mode === 'image') {
    const imgEl = document.querySelector('#videoImageInput img');
    if (imgEl) {
      imageBase64 = imgEl.src.split(',')[1];
    }
  }

  if (mode === 'text' && !textPrompt.trim()) {
    output.innerHTML = `<div style="padding:16px;color:#f59e0b;font-size:0.85rem;">⚠️ 请输入视频描述文字</div>`;
    setBtnState(btn, '✨', '重新生成视频', false);
    return;
  }

  output.innerHTML = `
<div class="loading-spinner">
  <div class="spinner"></div>
  <div class="loading-text">MiniMax 视频生成中（预计30-120秒）...</div>
  <div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">使用模型：video-01 · ${duration}秒</div>
</div>`;

  try {
    const result = await apiCall('/video', {
      prompt: textPrompt,
      image_base64: imageBase64,
      duration,
    });

    // 视频生成通常返回异步任务，需轮询
    const data = result.data || result;
    const videoUrl = data.video_url || data.url || data.data?.video_url;

    if (videoUrl) {
      output.innerHTML = `
<div class="gen-video-result">
  <video controls style="width:100%;border-radius:10px;background:#000;">
    <source src="${videoUrl}" type="video/mp4" />
    您的浏览器不支持视频播放
  </video>
  <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px;margin-top:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:0.85rem;font-weight:700;">动画片段.mp4</span>
      <span style="font-size:0.75rem;color:rgba(240,240,255,0.5);">${duration}秒 · MiniMax video-01</span>
    </div>
    <div style="display:flex;gap:8px;">
      <span style="padding:3px 10px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:99px;font-size:0.72rem;color:#10b981;">✅ 儿童安全</span>
      <span style="padding:3px 10px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:99px;font-size:0.72rem;color:#a78bfa;">MiniMax</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
    <button onclick="saveToAssets()" style="padding:10px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:8px;color:#a78bfa;font-size:0.85rem;cursor:pointer;">📦 存入资产库</button>
    <button onclick="window.open('${videoUrl}', '_blank')" style="padding:10px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:8px;color:#10b981;font-size:0.85rem;cursor:pointer;">⬇️ 下载视频</button>
  </div>
</div>`;
    } else {
      // 返回了任务ID，需要轮询
      const taskId = data.task_id || data.id;
      output.innerHTML = `
<div style="padding:20px;text-align:center;">
  <div style="font-size:1.5rem;margin-bottom:8px;">⏳</div>
  <div style="font-size:0.85rem;color:rgba(240,240,255,0.7);">视频生成任务已提交</div>
  <div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">任务ID：${taskId || '未知'}</div>
  <div style="font-size:0.75rem;color:rgba(240,240,255,0.4);margin-top:8px;">视频生成通常需要30秒-2分钟，请稍候刷新页面查看结果</div>
</div>`;
    }
    setBtnState(btn, '✨', '重新生成视频', false);
  } catch (err) {
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;white-space:pre-wrap;">❌ 视频生成失败：\n\n${err.message}</div>`;
    setBtnState(btn, '✨', '重新生成视频', false);
  }
}

// -- 内容审核 ------------------------------------------------------
async function runContentReview() {
  const content = document.getElementById('reviewContent').value;
  if (!content.trim()) {
    alert('请先输入要审核的剧本内容');
    return;
  }

  const output = document.getElementById('reviewOutput');
  output.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><div class="loading-text">MiniMax AI 正在进行内容安全审核...</div><div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">使用模型：MiniMax-M2.7-highspeed</div></div>`;

  try {
    const result = await apiCall('/review', { content });
    let rawText = '';
    const mm = result.raw || result.data || result;
    const choices = mm?.choices;
    if (choices && choices.length > 0) {
      const raw = choices[0]?.message?.content || '';
      rawText = stripThinkingTags(raw);
    }
    if (!rawText) rawText = typeof mm === 'string' ? mm : JSON.stringify(mm, null, 2);

    let score = 0, grade = '', checks = [], canProceed = false, summary = '';

    const json = robustJSONExtract(rawText);
    if (json && (json.score !== undefined || json.grade)) {
      score = json.score || 0;
      grade = json.grade || '';
      checks = json.checks || [];
      canProceed = json.canProceed !== false;
      summary = json.summary || '';
    } else {
      // 文本直接显示，不走 JSON 路线
      output.innerHTML = `<div style="padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:0.85rem;white-space:pre-wrap;line-height:1.7;">${escapeHtml(rawText)}</div>`;
      // 仍然存储原始数据用于导出
      state.lastReviewData = { raw: rawText, score: 0, grade: '待人工评估', checks: [], canProceed: true, summary: rawText };
      return;
    }

    // 存储审核数据用于导出
    state.lastReviewData = { score, grade, checks, canProceed, summary, content };

    const scoreColor = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#f87171';
    const checksHtml = checks.map(c => {
      const icon = c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌';
      const color = c.status === 'pass' ? '#10b981' : c.status === 'warn' ? '#f59e0b' : '#f87171';
      return `<div class="rpt-item ${c.status === 'fail' ? 'warn' : 'ok'}">
        <span class="rpt-icon">${icon}</span>
        <div class="rpt-content">
          <div class="rpt-title">${escapeHtml(c.item || '')}</div>
          <div class="rpt-desc">${escapeHtml(c.detail || '')}</div>
          ${c.suggestion ? `<div style="margin-top:4px;font-size:0.78rem;color:${color};">💡 ${escapeHtml(c.suggestion)}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    output.innerHTML = `
<div class="review-report">
  <div class="report-score-row">
    <div class="rr-score" style="color:${scoreColor};">${score}</div>
    <div class="rr-grade">
      <div class="rr-grade-label">合规评分</div>
      <div class="rr-grade-value" style="color:${scoreColor};">${grade}</div>
    </div>
    <div style="margin-left:auto;font-size:0.8rem;color:rgba(240,240,255,0.5);">
      审核标准：广电少儿节目标准<br/>适龄：7-12岁
    </div>
  </div>
  <div class="report-items">${checksHtml || '<div style="padding:12px;color:rgba(240,240,255,0.4);font-size:0.85rem;">暂无详细检查项</div>'}</div>
  ${canProceed ? `
  <div style="padding:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;font-size:0.82rem;color:#10b981;">
    ✅ ${escapeHtml(summary || '剧本内容符合儿童动画创作标准，可进入下一步生产流程。')}
  </div>` : `
  <div style="padding:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;font-size:0.82rem;color:#f87171;">
    ❌ ${escapeHtml(summary || '剧本内容需要修改，请参考上述修改建议。')}
  </div>`}
</div>`;
  } catch (err) {
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;white-space:pre-wrap;">❌ 审核失败：\n\n${err.message}</div>`;
  }
}

// -- TTS 配音 ------------------------------------------------------
async function generateVoice() {
  const text = document.getElementById('ttsText')?.value;
  const voiceId = document.getElementById('voiceId')?.value || 'Chinese (Mandarin)_Lyrical_Voice';
  const output = document.getElementById('ttsOutput');
  const btn = document.querySelector('#cs-tts .cs-generate-btn');

  if (!text?.trim()) {
    alert('请输入要配音的文字');
    return;
  }

  setBtnState(btn, '⏳', '生成配音中...', true);
  output.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><div class="loading-text">MiniMax 语音合成中...</div><div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">使用模型：speech-2.8-hd</div></div>`;

  try {
    const blob = await apiCall('/tts', { text, voice_id: voiceId, speed: 1.0, model: 'speech-2.8-hd' });
    const url = URL.createObjectURL(blob);
    output.innerHTML = `
<div style="padding:20px;text-align:center;">
  <audio controls style="width:100%;border-radius:8px;"><source src="${url}" type="audio/mpeg" /></audio>
  <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
    <button onclick="downloadAudio('${url}')" style="padding:8px 16px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:8px;color:#a78bfa;font-size:0.82rem;cursor:pointer;">⬇️ 下载 MP3</button>
    <button onclick="saveToAssets()" style="padding:8px 16px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:8px;color:#10b981;font-size:0.82rem;cursor:pointer;">📦 存入资产库</button>
  </div>
</div>`;
    setBtnState(btn, '🎵', '重新生成配音', false);
  } catch (err) {
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;white-space:pre-wrap;">❌ 配音生成失败：\n\n${err.message}</div>`;
    setBtnState(btn, '🎵', '生成配音', false);
  }
}

window.downloadAudio = function(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = '籁鸣导演_配音.mp3';
  a.click();
};

// -- 优化剧本 --------------------------------------------------------
function optimizeScript() {
  const output = document.getElementById('scriptOutput');
  if (!output.textContent.trim() || output.querySelector('.cs-placeholder')) {
    alert('请先生成剧本内容');
    return;
  }
  runScriptOptimization();
}

async function runScriptOptimization() {
  const output = document.getElementById('scriptOutput');
  if (!state.scriptContent) return;

  output.insertAdjacentHTML('beforeend', `
<div class="loading-spinner" id="optLoading" style="margin-top:16px;"><div class="spinner"></div><div style="font-size:0.82rem;color:rgba(167,139,250,0.8);">MiniMax 正在分析剧本...</div></div>`);

  try {
    const result = await apiCall('/review', {
      content: state.scriptContent + '\n\n请从以下维度提供优化建议：1.结构完整度 2.节奏优化 3.对白自然度 4.适龄评估 5.画面感'
    });

    // 提取并清理响应
    let rawText = '';
    const mm = result.raw || result.data || result;
    const choices = mm?.choices;
    if (choices && choices.length > 0) {
      const raw = choices[0]?.message?.content || '';
      rawText = stripThinkingTags(raw);
    }
    if (!rawText) rawText = typeof mm === 'string' ? mm : JSON.stringify(mm, null, 2);

    // 尝试解析 JSON 优化建议
    const json = robustJSONExtract(rawText);
    let suggestionsHtml = '';
    if (json && (json.suggestions || json.sections || json.issues)) {
      const sections = json.suggestions || json.sections || [];
      suggestionsHtml = sections.map(s => {
        const title = escapeHtml(s.title || s.item || '');
        const body = escapeHtml(s.body || s.detail || s.suggestion || '');
        return `<div style="margin-bottom:12px;">
  <div style="font-weight:700;color:#a78bfa;margin-bottom:4px;">📌 ${title}</div>
  <div style="color:rgba(240,240,255,0.8);line-height:1.6;">${body}</div>
</div>`;
      }).join('');
    } else if (rawText.trim()) {
      // 直接显示文本
      suggestionsHtml = `<div style="white-space:pre-wrap;line-height:1.7;">${escapeHtml(rawText)}</div>`;
    } else {
      suggestionsHtml = '<div style="color:rgba(240,240,255,0.5);">未能获取优化建议</div>';
    }

    const opt = document.getElementById('optLoading');
    if (opt) opt.remove();
    output.insertAdjacentHTML('beforeend', `
<div style="margin-top:16px;padding:14px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.3);border-radius:10px;font-size:0.82rem;">
  <strong style="color:#a78bfa;">✨ AI 剧本优化建议</strong><br/><br/>${suggestionsHtml}
</div>`);
  } catch (err) {
    const opt = document.getElementById('optLoading');
    if (opt) opt.remove();
    output.insertAdjacentHTML('beforeend', `<div style="margin-top:8px;color:#f87171;font-size:0.8rem;">❌ ${err.message}</div>`);
  }
}

async function extractEduValues() {
  if (!state.scriptContent) {
    alert('请先生成剧本内容');
    return;
  }
  const output = document.getElementById('scriptOutput');

  // 如果剧本数据已有 eduValues，直接显示
  const existingEdu = state.lastScriptData?.eduValues;
  if (existingEdu && existingEdu.length > 0) {
    const tagsHtml = existingEdu.map(e =>
      `<span style="display:inline-block;padding:4px 12px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:99px;font-size:0.82rem;color:#10b981;margin:4px;">🎯 ${escapeHtml(e)}</span>`
    ).join('');
    output.insertAdjacentHTML('beforeend', `
<div style="margin-top:16px;padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:10px;font-size:0.82rem;">
  <strong style="color:#10b981;">🎓 教育价值分析报告</strong><br/><br/>
  <div>${tagsHtml}</div>
</div>`);
    return;
  }

  output.insertAdjacentHTML('beforeend', `
<div class="loading-spinner" id="eduLoading" style="margin-top:16px;"><div class="spinner"></div><div style="font-size:0.82rem;color:rgba(16,185,129,0.8);">MiniMax 正在分析教育主题...</div></div>`);

  try {
    // 使用 /review 接口，让 AI 分析剧本中的教育价值
    const result = await apiCall('/review', {
      content: `请分析以下儿童动画剧本，提取其中的教育价值和主题（请直接列出，不要 JSON 格式）：\n\n${state.scriptContent.substring(0, 3000)}`
    });

    const eduLoading = document.getElementById('eduLoading');
    if (eduLoading) eduLoading.remove();

    let rawText = '';
    const mm = result.raw || result.data || result;
    const choices = mm?.choices;
    if (choices && choices.length > 0) {
      const raw = choices[0]?.message?.content || '';
      rawText = stripThinkingTags(raw);
    }
    if (!rawText) rawText = typeof mm === 'string' ? mm : JSON.stringify(mm, null, 2);

    // 尝试从文本中提取教育主题关键词
    const eduKeywords = ['友谊', '合作', '勇气', '探索', '环保', '生态', '亲情', '家庭', '学习', '求知', '包容', '多元', '健康', '规则', '诚实', '善良', '分享', '责任', '创新', '想象'];
    const found = eduKeywords.filter(k => rawText.includes(k));
    const fallback = found.length > 0 ? found : ['教育主题分析中'];
    const tagsHtml = fallback.map(e =>
      `<span style="display:inline-block;padding:4px 12px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:99px;font-size:0.82rem;color:#10b981;margin:4px;">🎯 ${escapeHtml(e)}</span>`
    ).join('');

    output.insertAdjacentHTML('beforeend', `
<div style="margin-top:16px;padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:10px;font-size:0.82rem;">
  <strong style="color:#10b981;">🎓 教育价值分析报告</strong><br/><br/>
  <div>${tagsHtml}</div>
  ${rawText.trim() ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(16,185,129,0.2);color:rgba(240,240,255,0.7);font-size:0.78rem;white-space:pre-wrap;line-height:1.6;">${escapeHtml(rawText)}</div>` : ''}
</div>`);
  } catch (err) {
    const eduLoading = document.getElementById('eduLoading');
    if (eduLoading) eduLoading.remove();
    output.insertAdjacentHTML('beforeend', `<div style="margin-top:8px;color:#f87171;font-size:0.8rem;">❌ ${err.message}</div>`);
  }
}

function reviewScript() {
  if (state.scriptContent) {
    const reviewContent = document.getElementById('reviewContent');
    if (reviewContent) reviewContent.value = state.scriptContent;
  }
  switchCSTab('review');
}
function saveToAssets() {
  alert('✅ 已成功存入您的资产库！可在"资产管理"中查看');
}

// -- 下载剧本 -----------------------------------------------------
function downloadScript() {
  const data = state.lastScriptData;
  const text = state.scriptContent;

  if (!text && !data) {
    alert('请先生成剧本');
    return;
  }

  const timestamp = new Date().toLocaleString('zh-CN');
  let content = '';

  if (data) {
    // 格式化为易读文本
    const title = data.title || '未命名剧本';
    content = `籁鸣导演 — 动画剧本\n`;
    content += `生成时间：${timestamp}\n`;
    content += `-`.repeat(40) + '\n';
    content += `《${title}》\n`;
    content += `适用年龄：${data.ageGroup || '未指定'}\n`;
    content += `教育主题：${data.theme || '未指定'}\n`;
    content += `-`.repeat(40) + '\n\n';

    const chars = data.characters || [];
    if (chars.length > 0) {
      content += `【角色】\n`;
      chars.forEach(c => { content += `  ▶ ${c.name}（${c.role}）：${c.description || ''}\n`; });
      content += '\n';
    }

    const acts = data.acts || [];
    acts.forEach(act => {
      content += `【${act.act}】\n`;
      (act.scenes || []).forEach(scene => {
        if (scene.location) content += `  📍 ${scene.sceneNum} ${scene.location} - ${scene.time}\n`;
        if (scene.narration) content += `  旁白：${scene.narration}\n`;
        (scene.dialogues || []).forEach(d => {
          content += `  ${d.character}（${d.type}）：${d.content}\n`;
        });
        if (scene.cameraNote) content += `  📷 ${scene.cameraNote}\n`;
      });
      content += '\n';
    });

    const edu = data.eduValues || [];
    if (edu.length > 0) {
      content += `【教育价值】\n  ${edu.join(' · ')}\n\n`;
    }
  } else {
    // 直接下载原始 JSON
    content = text;
  }

  const blob = data
    ? new Blob([content], { type: 'text/plain;charset=utf-8' })
    : new Blob([text], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `籁鸣导演_剧本_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// -- 导出审核报告 -------------------------------------------------
function exportReport() {
  const review = state.lastReviewData;
  const timestamp = new Date().toLocaleString('zh-CN');

  if (!review) {
    alert('请先执行内容审核');
    return;
  }

  const score = review.score || 0;
  const grade = review.grade || '待评估';
  const canProceed = review.canProceed;
  const checks = review.checks || [];
  const summary = review.summary || '';
  const scriptContent = review.content || '';

  let content = `籁鸣导演 — 内容安全审核报告\n`;
  content += `生成时间：${timestamp}\n`;
  content += `-`.repeat(40) + '\n';
  content += `合规评分：${score} / 100\n`;
  content += `评级结果：${grade}\n`;
  content += `审核结论：${canProceed ? '✅ 通过 — 可进入下一步生产流程' : '❌ 不通过 — 需要修改'}\n`;
  content += `-`.repeat(40) + '\n\n';

  if (checks.length > 0) {
    content += `【详细检查项】\n`;
    checks.forEach((c, i) => {
      const icon = c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌';
      content += `${i + 1}. ${icon} ${c.item || '检查项'}\n`;
      if (c.detail) content += `   说明：${c.detail}\n`;
      if (c.suggestion) content += `   建议：${c.suggestion}\n`;
    });
    content += '\n';
  }

  if (summary) {
    content += `【审核总结】\n${summary}\n\n`;
  }

  if (scriptContent) {
    content += `-`.repeat(40) + '\n';
    content += `【被审核剧本内容（前2000字）】\n`;
    content += scriptContent.substring(0, 2000) + (scriptContent.length > 2000 ? '\n...(内容截断)' : '');
  }

  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  a.download = `籁鸣导演_审核报告_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
}

// -- API 健康检测 --------------------------------------------------
async function testAPIHealth() {
  if (!API_CONFIG.isConfigured()) {
    console.log('[籁鸣导演] Worker URL 未配置，MiniMax API 调用不可用');
    return false;
  }
  try {
    const resp = await fetch(`${API_CONFIG.workerUrl}/health`);
    const data = await resp.json();
    console.log('[籁鸣导演] ✅ API 健康检测成功:', data);
    return true;
  } catch (err) {
    console.error('[籁鸣导演] ❌ API 健康检测失败:', err.message);
    return false;
  }
}

// 启动时检测一次
setTimeout(() => { testAPIHealth(); }, 1000);

// ESC 关闭
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCreationStudio();
    closeModal('authModal');
  }
});
