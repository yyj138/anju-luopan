# 安居·罗盘 - 后端服务

安居·罗盘租房风险评估平台的核心后端服务，提供用户认证、房源管理、收藏、个性化推荐、风险报告与 GIS 数据代理等 REST API。

## 技术栈

- Spring Boot 3.1.12
- Java 17
- MyBatis-Plus 3.5.5
- PostgreSQL / MySQL
- JWT 认证

## 功能模块

| 模块 | 说明 |
| ---- | ---- |
| 用户 | 注册、登录（签发 token）、用户信息查询与更新 |
| 房源 | 房源列表、详情、分页查询、条件搜索、浏览记录 |
| 收藏 | 房源收藏与取消收藏 |
| 推荐 | 个性化房源推荐 |
| 报告 | 房源风险报告生成与查询 |
| GIS 代理 | 转发 GIS 通勤圈、热力图等服务请求 |

## 快速启动

```bash
cd backend
mvn spring-boot:run
```

服务默认端口：`8082`

## 配置说明

配置文件：`src/main/resources/application.yml`

| 配置项 | 说明 |
| ---- | ---- |
| `server.port` | 服务端口（默认 8082） |
| `spring.datasource` | 数据库连接（默认 PostgreSQL，可切换 MySQL） |
| `gis.service.url` | GIS 服务地址 |

## 主要接口

| 接口 | 方法 | 说明 |
| ---- | ---- | ---- |
| `/house/list` | GET | 获取所有房源 |
| `/house/detail/{id}` | GET | 获取房源详情 |
| `/house/page` | GET | 分页查询房源 |
| `/house/search` | POST | 条件搜索房源 |
| `/user/register` | POST | 用户注册 |
| `/user/login` | POST | 用户登录 |
| `/user/info/{id}` | GET | 获取用户信息 |
| `/favorite/*` | - | 收藏管理 |
| `/recommend/*` | - | 房源推荐 |
| `/report/*` | - | 风险报告 |
| `/gis-proxy/*` | - | GIS 数据代理 |

需认证接口请在请求头携带 `Authorization: Bearer {token}`。

## 目录结构

```
backend/
├── src/
│   ├── main/java/com/anju/luopan/
│   │   ├── config/       # 配置（CORS、JWT 拦截器、MyBatis-Plus、WebMvc）
│   │   ├── controller/   # 接口层
│   │   ├── entity/       # 实体类
│   │   ├── mapper/       # 数据访问层
│   │   ├── service/      # 业务层
│   │   └── util/         # 工具类
│   └── main/resources/   # 配置文件
├── pom.xml
└── mvnw / mvnw.cmd       # Maven 包装器
```
