# 安居·罗盘

**基于 GIS 通勤圈与多模态 AI 的租房风险评估系统**（大学生计算机设计大赛项目）

## 项目简介

安居·罗盘是一个租房风控 AI 平台，综合地理信息（GIS 通勤圈）、多模态 AI 算法（图像视觉 + 大模型）与房源数据采集，为租房用户提供风险识别与评估服务。

## 目录结构

```
anjuluopan/
├── backend/            # 后端服务（Spring Boot 3.1.12 / Java 17）
│   ├── src/            #   MyBatis-Plus + MySQL/PostgreSQL + JWT
│   ├── pom.xml
│   └── README.md       #   后端说明
├── frontend/           # 前端（Vue 3 + ECharts，CDN 引入，无需构建）
│   ├── index.html      #   页面入口
│   ├── main.js / style.css / components/
│   └── house-images/   #   房源示例图片与数据分析图
├── ai-algorithm/       # AI 算法模块
│   ├── ai-agent/       #   AI 智能体服务（Java / Spring Boot，调用 DeepSeek API，端口 8081）
│   └── vision/         #   视觉算法（Python，OCR/图像分析，Flask）
├── data-gis/           # 数据采集与 GIS 服务（Python）
│   ├── crawler/        #   房源数据爬虫
│   ├── gis-service/    #   GIS 通勤圈计算服务（Flask）
│   ├── data/           #   原始数据
│   └── docs/           #   数据/GIS 文档
├── database/           # 数据库脚本（MySQL dump）
├── .gitignore
└── LICENSE
```

## 技术栈

| 模块 | 技术 |
| ---- | ---- |
| backend | Spring Boot 3.1.12、Java 17、MyBatis-Plus 3.5.5、MySQL、PostgreSQL、JWT |
| frontend | Vue 3（CDN）、Vue Router、ECharts 5 |
| ai-agent | Spring Boot、DeepSeek API |
| vision | Python、Flask、OCR/图像处理 |
| data-gis | Python、爬虫、GIS 服务 |

## 快速启动

### 1. 数据库

将 `database/` 下的 SQL 文件导入 MySQL，并确保各服务配置的数据库连接信息正确。

### 2. 后端服务（backend）

```bash
cd backend
mvn spring-boot:run
```

配置位于 `backend/src/main/resources/application.yml`。

### 3. AI 智能体服务（ai-algorithm/ai-agent）

```bash
cd ai-algorithm/ai-agent
mvn spring-boot:run
```

配置位于 `ai-algorithm/ai-agent/application.yml`（**请将 `ai.api.key` 替换为你自己的 API Key**）。

### 4. 视觉算法（ai-algorithm/vision）

```bash
cd ai-algorithm/vision/Vision
pip install -r requirements.txt
python main.py
```

### 5. GIS 服务与爬虫（data-gis）

```bash
cd data-gis/gis-service
pip install -r requirements.txt
python app.py
```

GIS 服务配置参考 `.env.example`。

### 6. 前端（frontend）

纯静态页面（Vue 3 通过 CDN 引入），直接用浏览器打开 `frontend/index.html`，或使用任意静态服务器托管。

## 参与贡献

1. Fork 本仓库
2. 新建功能分支（`Feat_xxx`）
3. 提交代码
4. 发起 Pull Request

## License

[MIT](LICENSE)
