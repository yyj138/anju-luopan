# GIS 微服务 - 安居罗盘

## 项目简介
提供房源数据的地理空间分析接口，包括附近房源查询、分组统计、热力图生成等。基于 FastAPI + PostGIS 实现。

## 技术栈
- Python 3.6+
- FastAPI
- uvicorn
- PostgreSQL 18 + PostGIS 3.6
- psycopg2

## 环境要求
- 已部署 PostgreSQL + PostGIS 数据库，并导入房源数据（表 `house_geo`）
- Python 3.6 或更高版本

## 快速部署

1. 克隆代码到服务器：
   ```bash
   git clone <repository_url>
   cd data-gis/gis-service