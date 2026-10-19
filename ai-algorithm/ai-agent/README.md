# 安居·罗盘 - AI 智能体服务

基于大模型（DeepSeek API）的 AI 智能体服务，为安居·罗盘提供租房咨询对话、聊天记录风险分析与综合报告生成能力，供主后端服务调用。

## 技术栈

- Spring Boot 3.1.12
- Java 17
- DeepSeek API（HTTP 调用）

## 功能

- AI 租房咨询对话
- 聊天记录风险分析（反诈检测）
- 房源综合评估报告生成

## 配置说明

配置文件：`application.yml`

| 配置项 | 说明 |
| ---- | ---- |
| `server.port` | 服务端口（默认 8081） |
| `ai.api.url` | DeepSeek API 地址 |
| `ai.api.key` | DeepSeek API Key（请替换为你自己的 Key） |
| `ai.api.model` | 使用的模型名称 |
| `image-group.url` | 视觉算法服务地址 |
| `commute-service.url` | GIS 通勤服务地址 |

## 快速启动

```bash
cd ai-algorithm/ai-agent
mvn spring-boot:run
```

服务默认端口：`8081`

## 接口

| 接口 | 方法 | 说明 |
| ---- | ---- | ---- |
| `/ai/chat` | POST | AI 对话 |
| `/ai/analyze-chat` | POST | 分析聊天记录（反诈检测） |
| `/ai/generate-report` | POST | 生成综合报告 |
| `/ai/health` | GET | 健康检查（含 API 调用统计） |
| `/health` | GET | 根路径健康检查 |

## 目录结构

```
ai-agent/
├── src/
│   └── main/java/com/aiagent/
│       ├── config/       # 配置
│       ├── controller/   # 接口层
│       ├── dto/          # 请求/响应对象
│       └── service/      # 业务层
├── pom.xml
└── application.yml       # 服务配置
```
