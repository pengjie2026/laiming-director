# 籁鸣导演 (LaiMing Director)

> **儿童AIGC动画创作平台** — 让每个孩子的童话梦想，成为专业级动画

[![GitHub Pages](https://img.shields.io/badge/部署-GitHub%20Pages-brightgreen)](https://pengjie2026.github.io/laiming-director)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎬 产品简介

**籁鸣导演**是专注于儿童动画创作领域的AIGC垂直服务平台，对标「即梦」「liblib」「OiiOii」在儿童动画领域的垂直细分应用。

- 🤖 **7大专业AI Agent** — 艺术总监/编剧/角色设计/分镜/场景/剪辑/音效
- 🎨 **140+ 儿童动画画风** — Q版卡通/绘本/日式/3D/国风/粘土
- 🛡️ **广电标准内容审核** — 专业儿童内容安全合规审核
- 📝 **全流程工作流** — 剧本→分镜→生图→视频→剪辑→配音
- 🔗 **MiniMax深度对接** — 图像+视频生成一站式

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/pengjie2026/laiming-director.git

# 进入项目目录
cd laiming-director

# 直接在浏览器打开（纯静态）
open index.html
```

## 📁 项目结构

```
laiming-director/
├── index.html              # 主页面（Landing Page + 创作台）
├── styles/
│   └── main.css            # 主样式（CSS变量 + 响应式）
├── scripts/
│   └── main.js             # 交互逻辑 + AI Demo
├── docs/
│   └── product-specification.md  # 产品方案文档
└── README.md
```

## 🎯 核心功能

### 1. 智能剧本创作
- 创意构思辅助：输入关键词，AI扩展完整故事大纲
- 专业剧本写作：标准动画剧本格式
- 教育价值提炼：自动提炼友谊/勇气等教育属性

### 2. 分镜设计系统
- 剧本自动转换为带镜头描述的分镜脚本
- 镜头语言指导：推/拉/摇/特写
- 九宫格参考图生成

### 3. 视觉风格生成（MiniMax）
- 140+ 儿童动画专属画风
- 九宫格批量对比生图
- 角色一致性跨镜头控制

### 4. 动画视频生成（MiniMax）
- 文生视频 & 图生视频
- 3s/5s/10s 多档位
- 专业运镜控制

### 5. 儿童内容安全审核
- 广电少儿节目标准
- 5维度自动检测
- AI修改建议 + 合规报告

## 🎨 技术栈

- **前端**：纯 HTML5 + CSS3 + JavaScript（原生，无框架）
- **样式**：CSS自定义属性 + Grid + Flexbox + 响应式
- **动画**：CSS动画 + Canvas粒子背景
- **AI对接**：MiniMax API（剧本/生图/视频）

## 📋 产品文档

详细产品方案见 [docs/product-specification.md](docs/product-specification.md)

## 🌐 在线访问

[https://pengjie2026.github.io/laiming-director](https://pengjie2026.github.io/laiming-director)

## 📄 License

MIT License © 2026 籁鸣导演团队
