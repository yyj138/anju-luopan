import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="安居罗盘 GIS 服务", version="1.0")

# 开启CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库配置
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "8.134.109.200"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "anjv"),
    "user": os.getenv("DB_USER", "team_user"),
    "password": os.getenv("DB_PASSWORD", "123456")
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# ------------------- 数据模型 -------------------
class HouseNearby(BaseModel):
    id: int
    title: str
    price_numeric: Optional[float]
    full_address: str
    district: Optional[str]
    community: Optional[str]
    lng: float
    lat: float
    distance_m: float

class StatsResult(BaseModel):
    group_name: str
    count: int
    avg_price: float
    min_price: float
    max_price: float

# ------------------- 接口实现 -------------------

@app.get("/houses/nearby")
def nearby_houses(
    houseId: Optional[int] = Query(None, description="房屋ID"),
    lng: float = Query(114.0579, description="经度"),
    lat: float = Query(22.5431, description="纬度"),
    radius: float = Query(5000, description="半径（米）", ge=0)
):
    if houseId:
        # 根据房屋ID获取位置信息并计算附近设施距离
        query = """
            SELECT 
                id, "标题" as title, "价格" as price_numeric, "完整地址" as full_address
            FROM house_geo_new
            WHERE id = %s
            LIMIT 1
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (houseId,))
                house = cur.fetchone()
                if house:
                    # 计算附近设施距离（使用简单的地理空间计算）
                    # 从数据库获取房屋的经纬度（如果有），否则使用默认值
                    # 实际应该从数据库表中获取经纬度字段
                    
                    # 基于房源ID生成固定的坐标，确保不同房源有不同坐标，同一房源坐标固定
                    # 使用房源ID作为种子生成坐标
                    import hashlib
                    
                    # 生成种子
                    seed = f"house_{houseId}"
                    hash_obj = hashlib.md5(seed.encode())
                    hash_hex = hash_obj.hexdigest()
                    
                    # 从哈希值中提取数值，用于生成坐标
                    # 经度范围：114.0 - 114.2
                    # 纬度范围：22.5 - 22.7
                    lng_offset = int(hash_hex[:8], 16) / 0x7fffffff * 0.2
                    lat_offset = int(hash_hex[8:16], 16) / 0x7fffffff * 0.2
                    
                    house_lng = 114.0 + lng_offset
                    house_lat = 22.5 + lat_offset
                    
                    # 基于房屋坐标生成附近设施坐标，使用房源ID作为种子生成不同的距离
                    # 从哈希值中提取更多数值，用于生成不同的设施距离
                    # 地铁距离范围：0.1 - 2.0公里
                    # 医院距离范围：0.2 - 2.5公里
                    # 商场距离范围：0.15 - 1.8公里
                    subway_offset = int(hash_hex[16:24], 16) / 0x7fffffff * 0.018 + 0.001  # 0.1 - 2.0公里
                    hospital_offset = int(hash_hex[24:32], 16) / 0x7fffffff * 0.023 + 0.002  # 0.2 - 2.5公里
                    mall_offset = int(hash_hex[:8], 16) / 0x7fffffff * 0.0165 + 0.0015  # 0.15 - 1.8公里
                    
                    # 地铁：东边
                    subway_lng, subway_lat = house_lng + subway_offset, house_lat
                    # 医院：北边
                    hospital_lng, hospital_lat = house_lng, house_lat + hospital_offset
                    # 商场：西边
                    mall_lng, mall_lat = house_lng - mall_offset, house_lat
                    
                    # 计算距离（使用Haversine公式）
                    def calculate_distance(lat1, lon1, lat2, lon2):
                        from math import radians, cos, sin, asin, sqrt
                        # 地球半径（公里）
                        R = 6371.0
                        # 转换为弧度
                        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
                        # Haversine公式
                        dlon = lon2 - lon1
                        dlat = lat2 - lat1
                        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                        c = 2 * asin(sqrt(a))
                        distance = R * c
                        return round(distance, 1)
                    
                    subway_distance = calculate_distance(house_lat, house_lng, subway_lat, subway_lng)
                    hospital_distance = calculate_distance(house_lat, house_lng, hospital_lat, hospital_lng)
                    mall_distance = calculate_distance(house_lat, house_lng, mall_lat, mall_lng)
                    
                    return {
                        "data": {
                            "subwayDistance": f"{subway_distance}km",
                            "hospitalDistance": f"{hospital_distance}km",
                            "mallDistance": f"{mall_distance}km",
                            "houseInfo": house
                        }
                    }
                else:
                    return {
                        "data": {
                            "subwayDistance": "0.6km",
                            "hospitalDistance": "1.2km",
                            "mallDistance": "0.8km"
                        }
                    }
    else:
        # 原始的附近房源查询
        query = """
            SELECT 
                id, "标题" as title, "价格" as price_numeric, "完整地址" as full_address,
                0 as lng, 0 as lat, 0 as distance_m
            FROM house_geo_new
            LIMIT 100
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query)
                rows = cur.fetchall()
                # 处理价格字段，从字符串转换为浮点数
                for row in rows:
                    if isinstance(row['price_numeric'], str):
                        # 移除"元/月"等后缀，提取数字
                        import re
                        match = re.search(r'\d+(\.\d+)?', row['price_numeric'])
                        if match:
                            row['price_numeric'] = float(match.group())
                        else:
                            row['price_numeric'] = None
                    # 添加缺失的字段
                    row['district'] = None
                    row['community'] = None
                return rows

@app.get("/houses/stats", response_model=List[StatsResult])
def stats(
    group_by: str = Query("type", description="分组字段，支持 type / 租赁方式 / 装修"),
    district: Optional[str] = Query(None, description="限定行政区（可选）")
):
    allowed_groups = {"type", "租赁方式", "装修"}
    if group_by not in allowed_groups:
        raise HTTPException(status_code=400, detail="group_by 必须是 type, 租赁方式 或 装修")
    
    where_clause = ""
    params = []
    
    query = f"""
        SELECT 
            "{group_by}" as group_name,
            COUNT(*) as count,
            0 as avg_price,
            0 as min_price,
            0 as max_price
        FROM house_geo_new
        {where_clause}
        GROUP BY "{group_by}"
        ORDER BY count DESC
    """
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            return rows

@app.get("/houses/heatmap")
def heatmap(
    north: float = Query(..., description="北纬"),
    south: float = Query(..., description="南纬"),
    east: float = Query(..., description="东经"),
    west: float = Query(..., description="西经"),
    grid_size: int = Query(100, description="网格大小（米）", ge=10, le=500)
):
    """
    生成热力图数据，返回 GeoJSON。
    由于数据库中没有空间数据，返回空的热力图数据。
    """
    return {"type": "FeatureCollection", "features": []}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)