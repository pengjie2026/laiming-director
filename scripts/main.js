/* ================================================================
   籁鸣导演 主逻辑脚本
   ================================================================ */

// ── 全局状态 ──────────────────────────────────────────────────────
const state = {
  currentCSTab: 'script',
  selectedStyle: 'cartoon',
  scriptContent: '',
  billing: 'monthly'
};

// ── 加载动画 ──────────────────────────────────────────────────────
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

// ── 导航栏滚动效果 ────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ── Tabs 切换 ─────────────────────────────────────────────────────
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

// ── 创作台 ─────────────────────────────────────────────────────────
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
function generateScript() {
  const theme = document.getElementById('storyTheme').value || '小兔子寻找彩虹花';
  const ageGroup = document.querySelector('input[name="ageGroup"]:checked')?.value || '3-6';
  const output = document.getElementById('scriptOutput');
  const btn = document.querySelector('#cs-script .cs-generate-btn');
  const btnIcon = document.getElementById('scriptBtnIcon');
  const btnText = document.getElementById('scriptBtnText');

  btn.disabled = true;
  btnIcon.textContent = '⏳';
  btnText.textContent = 'AI 正在创作剧本...';

  output.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">MiniMax 正在生成剧本，请稍候...</div>
    </div>`;

  const scripts = generateScriptContent(theme, ageGroup);
  let index = 0;
  output.innerHTML = '<div class="generated-script" id="scriptTyping"></div>';
  const typing = document.getElementById('scriptTyping');

  function typeNextChar() {
    if (index < scripts.length) {
      typing.innerHTML = scripts.substring(0, index + 1);
      index += 3;
      output.scrollTop = output.scrollHeight;
      setTimeout(typeNextChar, 20);
    } else {
      typing.innerHTML = scripts;
      btn.disabled = false;
      btnIcon.textContent = '✨';
      btnText.textContent = '重新生成剧本';
    }
  }

  setTimeout(() => { typeNextChar(); }, 1200);
}

function generateScriptContent(theme, ageGroup) {
  return `<div class="script-section-title">📋 ${theme} — 剧本草稿</div>
<div class="script-block">
<span class="sb-tag">【作品信息】</span><br/>
标题：${theme}<br/>
适用年龄：${ageGroup}岁<br/>
集数时长：约5分钟<br/>
教育主题：友谊、探索、乐于助人
</div>
<div class="script-block">
<span class="sb-tag">【主要角色】</span><br/>
▶ 米奇（主角）：活泼可爱的小兔子，充满好奇心，乐于助人<br/>
▶ 花仙子：住在彩虹花中的小精灵，温柔善良<br/>
▶ 迷路小松鼠：需要帮助的配角，憨厚可爱
</div>
<div class="script-block">
<span class="sb-tag">【幕一：出发】</span><br/>
<span class="line-type scene" style="display:inline-block;margin-bottom:6px;">场景01 EXT. 森林小屋 - 清晨</span><br/>
<em>旁白：</em>阳光透过树叶洒下金色光芒，小兔子米奇从温馨的小屋里蹦了出来。<br/><br/>
<em>米奇（兴奋）：</em>"今天是个大晴天！奶奶说彩虹花开在最深的森林里，能帮助所有需要帮助的小动物！"<br/><br/>
<em>米奇（拍打篮子）：</em>"我带好地图了，出发！"<br/><br/>
<span class="line-type action" style="display:inline-block;">镜头：</span> 米奇迈着轻快的步伐进入森林，背景音乐欢快跳跃。
</div>
<div class="script-block">
<span class="sb-tag">【幕二：相遇】</span><br/>
<span class="line-type scene" style="display:inline-block;margin-bottom:6px;">场景02 EXT. 森林深处 - 上午</span><br/>
<em>（米奇发现一只小松鼠在哭泣）</em><br/><br/>
<em>米奇（关心）：</em>"小松鼠，你怎么了，在哭鼻子呀？"<br/><br/>
<em>小松鼠（哽咽）：</em>"我...我迷路了，找不到回家的路了..."<br/><br/>
<em>米奇（温柔）：</em>"别怕！我有地图，我们一起找！你家在哪边？"<br/><br/>
<span class="line-type action" style="display:inline-block;">镜头：</span> 米奇拿出地图，两只小动物头碰头认真研究，画面温馨。
</div>
<div class="script-block">
<span class="sb-tag">【幕三：成功】</span><br/>
<em>旁白：</em>米奇帮助小松鼠找到了家，这时，神奇的事发生了——前方出现了七彩的光芒！<br/><br/>
<em>米奇（惊喜）：</em>"那...那就是彩虹花！"<br/><br/>
<em>花仙子（出现，清脆）：</em>"小兔子，是你的善良和勇气，带你来到了这里。彩虹花愿意帮助每一个有爱心的小动物！"<br/><br/>
<span class="line-type action" style="display:inline-block;">结尾：</span> 三个小伙伴在彩虹花下开心地笑，背景音乐温馨收尾。
</div>
<div style="margin-top:16px;padding:12px;background:rgba(16,185,129,0.08);border-radius:8px;font-size:0.82rem;border:1px solid rgba(16,185,129,0.2);">
🎓 <strong style="color:#10b981;">教育价值提炼：</strong> 乐于助人 · 勇于探索 · 朋友情谊 · 善有善报
</div>`;
}

// ── AI 生成分镜 ────────────────────────────────────────────────────
function generateStoryboard() {
  const scene = document.getElementById('sbScene').value || '小兔子在森林中寻找彩虹花';
  const output = document.getElementById('storyboardOutput');
  output.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><div class="loading-text">AI 正在规划分镜...</div></div>`;

  setTimeout(() => {
    output.innerHTML = `
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
  ${[
    {num:'01', type:'远景·全景', dur:'3s', move:'固定', icon:'🌲', desc:'森林全景，交代环境，阳光明媚'},
    {num:'02', type:'中景·推镜', dur:'4s', move:'推镜', icon:'🐰', desc:'米奇从画面左侧走入，背篮子，活泼可爱'},
    {num:'03', type:'特写·静帧', dur:'2s', move:'固定', icon:'🗺️', desc:'米奇手中的地图特写'},
    {num:'04', type:'中景·摇镜', dur:'5s', move:'摇镜', icon:'🐿️', desc:'发现哭泣的小松鼠，画面从米奇摇到松鼠'},
    {num:'05', type:'近景·对话', dur:'6s', move:'固定', icon:'💬', desc:'米奇与松鼠对话，两个角色同框'},
    {num:'06', type:'全景·亮起', dur:'4s', move:'拉镜', icon:'🌈', desc:'彩虹花光芒出现，镜头拉远展现震撼画面'}
  ].map(s => `
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;cursor:pointer;transition:0.2s;" onmouseover="this.style.borderColor='#7c3aed'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
    <div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:rgba(124,58,237,0.1);">${s.icon}</div>
    <div style="padding:10px 12px;">
      <div style="font-size:0.7rem;font-weight:700;color:#a78bfa;margin-bottom:4px;">镜头 ${s.num} · ${s.type}</div>
      <div style="font-size:0.75rem;color:rgba(240,240,255,0.6);margin-bottom:4px;">${s.desc}</div>
      <div style="display:flex;gap:6px;">
        <span style="padding:2px 8px;background:rgba(245,158,11,0.1);border-radius:99px;font-size:0.68rem;color:#f59e0b;">${s.dur}</span>
        <span style="padding:2px 8px;background:rgba(16,185,129,0.1);border-radius:99px;font-size:0.68rem;color:#10b981;">${s.move}</span>
      </div>
    </div>
  </div>`).join('')}
</div>
<div style="margin-top:12px;padding:10px 14px;background:rgba(124,58,237,0.08);border-radius:8px;font-size:0.8rem;color:rgba(240,240,255,0.6);">
  📊 共 6 个镜头 · 预计时长约 <strong style="color:#a78bfa;">24秒</strong> · 建议加入字幕与背景音乐
</div>`;
  }, 1500);
}

// ── AI 生图 ────────────────────────────────────────────────────────
function generateImage() {
  const prompt = document.getElementById('imgPrompt').value || 'Q版小兔子，色彩鲜艳，儿童动画风格';
  const count = parseInt(document.getElementById('imgCount').value);
  const output = document.getElementById('imageOutput');
  const btnIcon = document.getElementById('imgBtnIcon');
  const btnText = document.getElementById('imgBtnText');

  btnIcon.textContent = '⏳';
  btnText.textContent = 'MiniMax 生成中...';

  output.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><div class="loading-text">MiniMax 正在生图，预计10-20秒...</div></div>`;

  const EMOJI_SETS = [
    ['🐰🌸','🌈🌺','🍄🌟','🏡🌸','✨💫','🐝🌻','🦋🌷','🍀💚','🌙⭐'],
    ['🐱🌸','🦊✨','🐻🎀','🐨💙','🐼🌿','🦁👑','🐸🍃','🦄🌈','🐧❄️'],
  ];
  const emojiSet = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
  const backgrounds = [
    'linear-gradient(135deg,rgba(255,182,193,0.3),rgba(255,105,180,0.2))',
    'linear-gradient(135deg,rgba(173,216,230,0.3),rgba(100,149,237,0.2))',
    'linear-gradient(135deg,rgba(144,238,144,0.2),rgba(34,139,34,0.2))',
    'linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,165,0,0.2))',
    'linear-gradient(135deg,rgba(221,160,221,0.3),rgba(186,85,211,0.3))',
    'linear-gradient(135deg,rgba(255,127,80,0.2),rgba(255,99,71,0.2))',
    'linear-gradient(135deg,rgba(64,224,208,0.2),rgba(0,128,128,0.2))',
    'linear-gradient(135deg,rgba(240,230,140,0.2),rgba(189,183,107,0.2))',
    'linear-gradient(135deg,rgba(176,224,230,0.2),rgba(70,130,180,0.2))',
  ];

  setTimeout(() => {
    const cells = Array.from({length: count}, (_, i) => `
      <div class="gen-img" style="background:${backgrounds[i % backgrounds.length]}" onclick="this.classList.toggle('selected')">
        ${emojiSet[i % emojiSet.length]}
      </div>`).join('');

    const cols = count === 1 ? 1 : count === 4 ? 2 : 3;
    output.innerHTML = `
<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;margin-bottom:12px;">
  ${cells}
</div>
<div style="font-size:0.8rem;color:rgba(240,240,255,0.5);">
  ✅ 由 MiniMax 生成 · 点击图片选中 · 可存入资产库
</div>`;
    btnIcon.textContent = '✨';
    btnText.textContent = '重新生成';
  }, 2000);
}

// ── 生成视频 ────────────────────────────────────────────────────────
function generateVideo() {
  const output = document.getElementById('videoOutput');
  const btnIcon = document.getElementById('videoBtnIcon');
  const btnText = document.getElementById('videoBtnText');

  btnIcon.textContent = '⏳';
  btnText.textContent = '正在生成视频...';

  output.innerHTML = `
<div class="loading-spinner">
  <div class="spinner"></div>
  <div class="loading-text">MiniMax 视频生成中...（约20-60秒）</div>
</div>`;

  const dur = document.getElementById('videoDuration').value;

  setTimeout(() => {
    output.innerHTML = `
<div class="gen-video-result">
  <div class="gen-video-player" onclick="this.innerHTML='⏸'">
    🎬
  </div>
  <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px;margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:0.85rem;font-weight:700;">动画片段_001.mp4</span>
      <span style="font-size:0.75rem;color:rgba(240,240,255,0.5);">${dur}秒</span>
    </div>
    <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:99px;margin-bottom:8px;">
      <div style="width:60%;height:100%;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:99px;"></div>
    </div>
    <div style="display:flex;gap:8px;">
      <span style="padding:3px 10px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:99px;font-size:0.72rem;color:#10b981;">✅ 儿童安全</span>
      <span style="padding:3px 10px;background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:99px;font-size:0.72rem;color:#a78bfa;">MiniMax</span>
      <span style="padding:3px 10px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:99px;font-size:0.72rem;color:#f59e0b;">720P</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <button onclick="saveToAssets()" style="padding:10px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:8px;color:#a78bfa;font-size:0.85rem;cursor:pointer;">📦 存入资产库</button>
    <button onclick="alert('视频下载功能需登录后使用')" style="padding:10px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:8px;color:#10b981;font-size:0.85rem;cursor:pointer;">⬇️ 下载视频</button>
  </div>
</div>`;
    btnIcon.textContent = '✨';
    btnText.textContent = '重新生成视频';
  }, 3000);
}

// ── 内容审核 ────────────────────────────────────────────────────────
function runContentReview() {
  const content = document.getElementById('reviewContent').value;
  if (!content.trim()) {
    alert('请先输入要审核的剧本内容');
    return;
  }

  const output = document.getElementById('reviewOutput');
  output.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><div class="loading-text">AI 正在进行内容安全审核...</div></div>`;

  // 分析内容是否有问题词
  const hasIssues = content.includes('黑暗') || content.includes('恐怖') || content.includes('危险') || content.includes('血');
  const score = hasIssues ? 78 : 94;
  const grade = score >= 90 ? '优秀' : score >= 80 ? '良好' : '需要修改';

  setTimeout(() => {
    output.innerHTML = `
<div class="review-report">
  <div class="report-score-row">
    <div class="rr-score">${score}</div>
    <div class="rr-grade">
      <div class="rr-grade-label">合规评分</div>
      <div class="rr-grade-value">${grade}</div>
    </div>
    <div style="margin-left:auto;font-size:0.8rem;color:rgba(240,240,255,0.5);">
      审核标准：广电少儿节目标准<br/>适龄：7-12岁
    </div>
  </div>
  <div class="report-items">
    <div class="rpt-item ${hasIssues ? 'warn' : 'ok'}">
      <span class="rpt-icon">${hasIssues ? '⚠️' : '✅'}</span>
      <div class="rpt-content">
        <div class="rpt-title">暴力/恐怖元素检测</div>
        <div class="rpt-desc">${hasIssues ? '检测到"黑暗"等可能引起儿童不安的描述，建议修改' : '未检测到暴力或恐怖元素，符合标准'}</div>
      </div>
    </div>
    <div class="rpt-item ok">
      <span class="rpt-icon">✅</span>
      <div class="rpt-content">
        <div class="rpt-title">价值观导向</div>
        <div class="rpt-desc">内容传递正向价值观，弘扬友谊、善良与勇气</div>
      </div>
    </div>
    <div class="rpt-item ok">
      <span class="rpt-icon">✅</span>
      <div class="rpt-content">
        <div class="rpt-title">语言文明规范</div>
        <div class="rpt-desc">未发现粗俗用语或不当表达</div>
      </div>
    </div>
    <div class="rpt-item ok">
      <span class="rpt-icon">✅</span>
      <div class="rpt-content">
        <div class="rpt-title">社会主义核心价值观</div>
        <div class="rpt-desc">内容积极向上，符合主流价值导向</div>
      </div>
    </div>
  </div>
  ${hasIssues ? `
  <div class="report-suggest">
    <div class="report-suggest-title">💡 AI 修改建议</div>
    <div class="report-suggest-item">1. "黑暗的森林" → 建议改为 "黄昏的森林" 或 "神秘的森林"，减少恐惧感</div>
    <div class="report-suggest-item">2. 建议在夜晚场景添加月亮、星星等温暖元素，减轻黑暗氛围</div>
    <div class="report-suggest-item">3. 可以增加角色的对话互相鼓励，化解紧张气氛</div>
  </div>` : `
  <div style="padding:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;font-size:0.82rem;color:#10b981;">
    ✅ 剧本内容完全符合儿童动画创作标准，可进入下一步生产流程。
  </div>`}
</div>`;
  }, 2000);
}

// ── 优化剧本 ────────────────────────────────────────────────────────
function optimizeScript() {
  const output = document.getElementById('scriptOutput');
  if (!output.textContent.trim() || output.querySelector('.cs-placeholder')) {
    alert('请先生成剧本内容');
    return;
  }
  output.insertAdjacentHTML('beforeend', `
<div style="margin-top:16px;padding:14px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.3);border-radius:10px;font-size:0.82rem;">
  <strong style="color:#a78bfa;">✨ AI 剧本优化建议：</strong><br/><br/>
  📌 <strong>结构完整度：</strong>三幕式结构清晰，开端/发展/高潮/结局均具备 ✅<br/>
  📌 <strong>节奏优化：</strong>建议第二幕增加一个"小困难"的铺垫，让解决过程更有层次感<br/>
  📌 <strong>对白建议：</strong>角色对白自然流畅，可增加1-2句体现性格的台词让角色更立体<br/>
  📌 <strong>适龄评估：</strong>词汇量和情节复杂度适合3-8岁受众 ✅<br/>
  📌 <strong>画面感：</strong>建议在关键情节点增加动作描述，使分镜更好执行
</div>`);
}

function extractEduValues() {
  const output = document.getElementById('scriptOutput');
  if (!output.textContent.trim() || output.querySelector('.cs-placeholder')) {
    alert('请先生成剧本内容');
    return;
  }
  output.insertAdjacentHTML('beforeend', `
<div style="margin-top:16px;padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:10px;font-size:0.82rem;">
  <strong style="color:#10b981;">🎓 教育价值分析报告：</strong><br/><br/>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
    <span style="padding:4px 12px;background:rgba(16,185,129,0.1);border-radius:99px;font-size:0.8rem;color:#10b981;">🤝 助人为乐</span>
    <span style="padding:4px 12px;background:rgba(16,185,129,0.1);border-radius:99px;font-size:0.8rem;color:#10b981;">💪 勇于探索</span>
    <span style="padding:4px 12px;background:rgba(16,185,129,0.1);border-radius:99px;font-size:0.8rem;color:#10b981;">❤️ 分享善良</span>
    <span style="padding:4px 12px;background:rgba(16,185,129,0.1);border-radius:99px;font-size:0.8rem;color:#10b981;">🌟 坚持不懈</span>
  </div><br/>
  <em style="color:rgba(240,240,255,0.5);">适合作为品德教育、语文读写课的教学辅助材料</em>
</div>`);
}

function reviewScript() { switchCSTab('review'); }
function saveToAssets() { alert('✅ 已成功存入您的资产库！可在"资产管理"中查看'); }
function exportReport() {
  const content = '籁鸣导演 — 内容审核报告\n生成时间：' + new Date().toLocaleString() + '\n合规评分：94分\n结论：内容符合广电少儿节目制作标准';
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  a.download = '内容审核报告.txt';
  a.click();
}

// ESC 关闭
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCreationStudio();
    closeModal('authModal');
  }
});
