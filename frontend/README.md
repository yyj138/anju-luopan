# 安居·罗盘 - 前端应用

安居·罗盘租房风险评估平台的用户界面，基于 Vue 3 与 ECharts 构建的响应式单页应用。

## 技术栈

- Vue 3（CDN 引入，无需构建工具）
- Vue Router 4
- ECharts 5
- Font Awesome 图标库

## 页面功能

| 页面 | 说明 |
| ---- | ---- |
| 首页 | 平台概览与入口 |
| 找房 | 房源浏览、搜索与详情 |
| 数据分析 | 房源数据可视化（租金分布、热力图等） |
| AI 对话 | 与 AI 助手对话，获取租房咨询与风险提示 |
| 个性化推荐 | 基于用户画像的房源推荐 |
| 关于 | 项目介绍 |

## 快速启动

前端为纯静态页面，无需安装依赖与构建，直接使用浏览器打开即可：

```bash
cd frontend
# 方式一：直接打开
start index.html

# 方式二：使用任意静态服务器
python -m http.server 8000
```

访问 `http://localhost:8000` 即可使用。

后端接口地址请根据部署环境在 `global.js` 中配置。

## 目录结构

```
frontend/
├── index.html                  # 页面入口
├── main.js                     # 应用入口脚本
├── global.js                   # 全局配置
├── style.css                   # 全局样式
├── components/                 # 页面组件
│   ├── HomePage.js
│   ├── FindHousePage.js
│   ├── AnalysisPage.js
│   ├── AIChatPage.js
│   ├── PersonalizedRecommendationPage.js
│   ├── AboutPage.js
│   ├── AvatarUploader.js
│   └── MainLayout.js
└── house-images/               # 房源示例图片与数据分析图
```
