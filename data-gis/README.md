# 安居·罗盘 - 数据采集与 GIS

安居·罗盘的数据支撑模块，负责房源数据采集、GIS 地理空间分析及相关文档，为后端风控评估与前端可视化提供数据基础。

## 子模块

| 子模块 | 目录 | 说明 |
| ---- | ---- | ---- |
| 数据爬虫 | `crawler/` | 采集安居客等平台的房源数据（`anjuke_spider.py`） |
| GIS 服务 | `gis-service/` | 地理空间分析接口（FastAPI + PostGIS），详见其 README |
| 数据 | `data/` | 原始数据与处理结果 |
| 文档 | `docs/` | GIS 接口文档等（`GIS-API.md`） |

## 技术栈

- Python 3.6+
- FastAPI / uvicorn
- PostgreSQL + PostGIS
- psycopg2

## 快速开始

### 数据爬虫

```bash
cd data-gis/crawler
python anjuke_spider.py
```

### GIS 服务

```bash
cd data-gis/gis-service
pip install -r requirements.txt
python app.py
```

GIS 服务环境配置参考 `gis-service/.env.example`，详细说明见 `gis-service/README.md`。
