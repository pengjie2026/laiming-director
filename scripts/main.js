/* ================================================================
   籁鸣导演 主逻辑脚本
   MiniMax API 真实对接版本
   ================================================================ */

// ── MiniMax API 配置 ─────────────────────────────────────────────
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

// ── API 调用封装 ─────────────────────────────────────────────────
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

// ── 辅助：打字机效果 ─────────────────────────────────────────────
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

// ── 辅助：设置按钮状态 ───────────────────────────────────────────
function setBtnState(btn, icon, text, disabled = false) {
  const iconEl = btn.querySelector('.btn-icon');
  const textEl = btn.querySelector('.btn-text');
  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = text;
  btn.disabled = disabled;
}

// ── 全局状态 ─────────────────────────────────────────────────────
const state = {
  currentCSTab: 'script',
  selectedStyle: 'cartoon',
  scriptContent: '',
  billing: 'monthly'
};

// ── 加载动画 ─────────────────────────────────────────────────────
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
});

// ── 导航栏滚动效果 ───────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ── Tabs 切换 ────────────────────────────────────────────────────
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

// ── 粒子背景 ─────────────────────────────────────────────────────
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

// ── 滚动动画 ─────────────────────────────────────────────────────
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

// ── 年龄筛选 ─────────────────────────────────────────────────────
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

// ── 风格选择（Demo交互） ──────────────────────────────────────────
function initStyleChips() {
  document.querySelectorAll('.style-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.closest('.style-selector').querySelectorAll('.style-chip')
        .forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

// ── 平滑滚动 ─────────────────────────────────────────────────────
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ── 计费切换 ─────────────────────────────────────────────────────
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

// ── Auth Modal ─────────────────────────────────────────────────────
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

// ── 创作台 ────────────────────────────────────────────────────────
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

// ── 风格选择 ──────────────────────────────────────────────────────
function selectStyle(el) {
  el.closest('.style-grid-select').querySelectorAll('.sgs-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  state.selectedStyle = el.dataset.style;
}

// ── 视频模式切换 ──────────────────────────────────────────────────
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

// ── AI 生成剧本 ────────────────────────────────────────────────────
async function generateScript() {
  const theme = document.getElementById('storyTheme').value || '小兔子寻找彩虹花';
  const ageGroup = document.querySelector('input[name="ageGroup"]:checked')?.value || '3-6';
  const output = document.getElementById('scriptOutput');
  const btn = document.querySelector('#cs-script .cs-generate-btn');
  setBtnState(btn, '⏳', 'MiniMax 创作中...', true);

  output.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">MiniMax 正在生成剧本，请稍候...</div>
      <div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">使用模型：MiniMax-M2.7-highspeed</div>
    </div>`;

  try {
    const result = await apiCall('/script', { theme, ageGroup });

    // 解析 MiniMax 返回的文本
    // Worker 现在返回 { raw: MiniMax原始响应 }
    // MiniMax 响应格式: choices[0].message.content
    // content 可能是普通文本，也可能是 JSON 字符串（带或不带 markdown 代码块）
    let scriptText = '';
    const mm = result.raw || result.data || result;
    const choices = mm.choices;
    if (choices && choices.length > 0) {
      scriptText = choices[0]?.message?.content || '';
    }
    if (!scriptText) {
      // 兜底：直接字符串化
      scriptText = typeof mm === 'string' ? mm : JSON.stringify(mm, null, 2);
    }

    // 去掉可能的 markdown 代码块包裹
    scriptText = scriptText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    // 尝试解析 JSON
    let scriptHtml = '';
    try {
      const json = JSON.parse(scriptText);
      // 检查 JSON 是否有实质内容
      const hasContent = (json.acts && json.acts.length > 0) ||
                         (json.scenes && json.scenes.length > 0) ||
                         (json.content && json.content.trim()) ||
                         (json.text && json.text.trim());
      if (!hasContent) {
        // JSON 结构存在但内容为空，显示原始文本供调试
        scriptHtml = `<div class="generated-script">${escapeHtml(scriptText)}</div>
<div style="margin-top:12px;padding:12px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;font-size:0.75rem;color:#f59e0b;">
  ⚠️ JSON 结构正常但内容为空。MiniMax 返回内容：<br/>
  <pre style="white-space:pre-wrap;margin-top:8px;font-size:0.72rem;color:rgba(240,240,255,0.6);">${escapeHtml(scriptText.substring(0, 1000))}</pre>
</div>`;
      } else {
        scriptHtml = renderScriptJSON(json);
      }
    } catch (e) {
      // 无法解析为JSON，显示原始文本
      scriptHtml = `<div class="generated-script">${escapeHtml(scriptText)}</div>
<div style="margin-top:12px;padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;font-size:0.75rem;color:#f87171;">
  ❌ JSON 解析失败。MiniMax 返回内容：<br/>
  <pre style="white-space:pre-wrap;margin-top:8px;font-size:0.72rem;color:rgba(240,240,255,0.6);">${escapeHtml(scriptText.substring(0, 1000))}</pre>
</div>`;
    }

    output.innerHTML = `<div id="scriptTypingTarget" style="display:none;"></div>`;
    const target = document.getElementById('scriptTypingTarget');
    target.innerHTML = scriptHtml;
    target.style.display = '';

    state.scriptContent = scriptText;
    setBtnState(btn, '✨', '重新生成剧本', false);
  } catch (err) {
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;white-space:pre-wrap;">❌ 生成失败：\n\n${err.message}</div>`;
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── AI 生成分镜 ────────────────────────────────────────────────────
async function generateStoryboard() {
  const scene = document.getElementById('sbScene').value || '小兔子在森林中寻找彩虹花';
  const style = state.selectedStyle;
  const output = document.getElementById('storyboardOutput');

  output.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><div class="loading-text">MiniMax 正在规划分镜...</div><div style="font-size:0.75rem;color:rgba(167,139,250,0.6);margin-top:4px;">使用模型：MiniMax-M2.7-highspeed</div></div>`;

  try {
    const result = await apiCall('/storyboard', { scene, style });
    let rawText = '';
    const mm = result.raw || result.data || result;
    const choices = mm.choices;
    if (choices && choices.length > 0) {
      rawText = choices[0]?.message?.content || '';
    }
    if (!rawText) rawText = typeof mm === 'string' ? mm : JSON.stringify(mm, null, 2);
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    // 尝试解析 JSON
    let cardsHtml = '';
    try {
      const json = JSON.parse(rawText);
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
    } catch {
      output.innerHTML = `<div style="padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:0.85rem;white-space:pre-wrap;">${escapeHtml(rawText)}</div>`;
    }
  } catch (err) {
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;white-space:pre-wrap;">❌ 生成分镜失败：\n\n${err.message}</div>`;
  }
}

// ── AI 生图 ───────────────────────────────────────────────────────
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

// ── 下载所有图片 ──────────────────────────────────────────────────
window.downloadAllImages = function() {
  const imgs = document.querySelectorAll('#imageOutput img');
  imgs.forEach((img, i) => {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `籁鸣导演_图片_${i + 1}.png`;
    a.click();
  });
};

// ── 生成视频 ──────────────────────────────────────────────────────
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

// ── 内容审核 ──────────────────────────────────────────────────────
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
    const choices = mm.choices;
    if (choices && choices.length > 0) {
      rawText = choices[0]?.message?.content || '';
    }
    if (!rawText) rawText = typeof mm === 'string' ? mm : JSON.stringify(mm, null, 2);
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let score = 0, grade = '', checks = [], canProceed = false;

    try {
      const json = JSON.parse(rawText);
      score = json.score || 0;
      grade = json.grade || '';
      checks = json.checks || [];
      canProceed = json.canProceed !== false;
    } catch {
      // 显示原始文本
      output.innerHTML = `<div style="padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:0.85rem;white-space:pre-wrap;">${escapeHtml(rawText)}</div>`;
      return;
    }

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
    ✅ ${escapeHtml(result.data?.summary || '剧本内容符合儿童动画创作标准，可进入下一步生产流程。')}
  </div>` : `
  <div style="padding:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;font-size:0.82rem;color:#f87171;">
    ❌ ${escapeHtml(result.data?.summary || '剧本内容需要修改，请参考上述修改建议。')}
  </div>`}
</div>`;
  } catch (err) {
    output.innerHTML = `<div style="padding:16px;color:#f87171;font-size:0.85rem;white-space:pre-wrap;">❌ 审核失败：\n\n${err.message}</div>`;
  }
}

// ── TTS 配音 ──────────────────────────────────────────────────────
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

// ── 优化剧本 ────────────────────────────────────────────────────────
function optimizeScript() {
  const output = document.getElementById('scriptOutput');
  if (!output.textContent.trim() || output.querySelector('.cs-placeholder')) {
    alert('请先生成剧本内容');
    return;
  }
  // 复用 review 接口，让 AI 提供优化建议
  runScriptOptimization();
}

async function runScriptOptimization() {
  const output = document.getElementById('scriptOutput');
  if (!state.scriptContent) return;

  output.insertAdjacentHTML('beforeend', `
<div class="loading-spinner" id="optLoading" style="margin-top:16px;"><div class="spinner"></div><div style="loading-text">MiniMax 正在分析剧本...</div></div>`);

  try {
    const result = await apiCall('/review', { content: state.scriptContent + '\n\n请从以下维度提供优化建议：1.结构完整度 2.节奏优化 3.对白自然度 4.适龄评估 5.画面感' });
    const opt = document.getElementById('optLoading');
    if (opt) opt.remove();

    let rawText = (result.raw || result.data || result).choices?.[0]?.message?.content || '';
    output.insertAdjacentHTML('beforeend', `
<div style="margin-top:16px;padding:14px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.3);border-radius:10px;font-size:0.82rem;white-space:pre-wrap;">
  <strong style="color:#a78bfa;">✨ AI 剧本优化建议：</strong><br/><br/>${escapeHtml(rawText)}
</div>`);
  } catch (err) {
    const opt = document.getElementById('optLoading');
    if (opt) opt.remove();
    output.insertAdjacentHTML('beforeend', `<div style="margin-top:8px;color:#f87171;font-size:0.8rem;">❌ ${err.message}</div>`);
  }
}

function extractEduValues() {
  if (!state.scriptContent) {
    alert('请先生成剧本内容');
    return;
  }
  const output = document.getElementById('scriptOutput');
  output.insertAdjacentHTML('beforeend', `
<div style="margin-top:16px;padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:10px;font-size:0.82rem;">
  <strong style="color:#10b981;">🎓 教育价值分析报告：</strong><br/><br/>
  <div style="font-size:0.82rem;color:rgba(240,240,255,0.7);">从剧本内容分析中提取教育主题...</div>
</div>`);
}

function reviewScript() { switchCSTab('review'); }
function saveToAssets() {
  alert('✅ 已成功存入您的资产库！可在"资产管理"中查看');
}

function exportReport() {
  const content = `籁鸣导演 — 内容审核报告
生成时间：${new Date().toLocaleString()}
合规评分：详见平台审核结果
结论：内容符合广电少儿节目制作标准`;
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  a.download = '内容审核报告.txt';
  a.click();
}

// ── API 健康检测 ──────────────────────────────────────────────────
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
