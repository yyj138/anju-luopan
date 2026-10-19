(() => {
    const { globalState, demoHouses, addFavorite, removeFavorite, isFavorited } = window.Anju;

    // 获取房源列表（支持分页）
    async function getHouses(page = 1, size = 5) {
        try {
            // 使用 AbortController 实现超时功能
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 增加超时时间到10秒
            
            // 暂时不使用token，避免认证问题
            const response = await fetch(`${window.Anju.API_BASE_URL}/api/houses/page?page=${page}&size=${size}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`网络响应失败: ${response.status}`);
            }
            const data = await response.json();
            if (data.code === 200) {
                return data.data;
            } else {
                console.error('获取房源数据失败:', data.msg);
                return { list: window.Anju.demoHouses, total: window.Anju.demoHouses.length };
            }
        } catch (error) {
            console.error('获取房源数据失败:', error);
            // 后端服务不可用时，返回演示数据
            return { list: window.Anju.demoHouses, total: window.Anju.demoHouses.length };
        }
    }

    // 从datagis服务获取附近房源
    async function getNearbyHouses(lng, lat, radius = 1000) {
        try {
            // 验证经纬度有效性
            const parsedLng = Number(lng);
            const parsedLat = Number(lat);
            if (!Number.isFinite(parsedLng) || !Number.isFinite(parsedLat)) {
                console.error('无效的经纬度:', { lng, lat });
                return [];
            }
            
            // 使用 AbortController 实现超时功能
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 增加超时时间到10秒
            
            // 使用GIS微服务地址，设置适当的请求头
            const response = await fetch(`${window.Anju.GIS_API_BASE_URL}/houses/nearby?lng=${parsedLng}&lat=${parsedLat}&radius=${radius}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`网络响应失败: ${response.status}`);
            }
            const data = await response.json();
            
            // 检查数据格式
            let housesData = data;
            if (typeof data === 'object' && data !== null && 'data' in data) {
                // 如果返回的是对象且包含data字段，使用data.data
                housesData = data.data;
            }
            
            // 检查数据类型，确保是数组
            if (!Array.isArray(housesData)) {
                console.error('获取附近房源失败: 数据格式错误', data);
                return [];
            }
            
            // 转换数据格式，确保字段名与前端匹配
            return housesData.map(item => ({
                id: item.id,
                标题: item.title,
                价格: item.price_numeric ? `${item.price_numeric}元/月` : (item.price || '价格待定'),
                完整地址: item.full_address || item.address || '地址待定',
                面积: item.area ? `${item.area}平方米` : '面积待定',
                户型: item.house_type || item.layout || '户型待定',
                地铁: item.subway || item.metro || '地铁待定',
                楼层: item.floor || '楼层待定',
                装修: item.decoration || item.fitment || '装修待定',
                朝向: item.orientation || item.direction || '朝向待定',
                类型: item.house_category || item.type || '类型待定',
                封面图URL: item.image_url || item.cover_url || item.img || '',
                // 保留经纬度数据，确保是有效数字
                lng: Number.isFinite(Number(item.lng)) ? Number(item.lng) : (Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null),
                lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : (Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null)
            }));
        } catch (error) {
            console.error('获取附近房源失败:', error);
            // 返回演示数据，确保用户体验
            return window.Anju.demoHouses.map(house => ({
                id: house.id,
                标题: house.title,
                价格: `${house.rent}元/月`,
                完整地址: house.address,
                面积: `${house.area}㎡`,
                户型: '户型待定',
                地铁: '地铁待定',
                楼层: '楼层待定',
                装修: '装修待定',
                朝向: '朝向待定',
                类型: '类型待定',
                封面图URL: '',
                // 生成模拟经纬度
                lng: 114.0579 + (Math.random() - 0.5) * 0.05,
                lat: 22.5431 + (Math.random() - 0.5) * 0.05
            }));
        }
    }

    // 从datagis服务获取热力图数据
    async function getHeatmapData(north, south, east, west) {
        try {
            // 使用 AbortController 实现超时功能
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
            
            // 使用GIS微服务地址，设置适当的请求头
            const response = await fetch(`${window.Anju.GIS_API_BASE_URL}/houses/heatmap?north=${north}&south=${south}&east=${east}&west=${west}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`网络响应失败: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取热力图数据失败:', error);
            return { type: 'FeatureCollection', features: [] };
        }
    }

    // 从datagis服务获取房源统计数据
    async function getHousesStats(groupBy = 'district') {
        try {
            // 使用 AbortController 实现超时功能
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
            
            // 使用GIS微服务地址，设置适当的请求头
            const response = await fetch(`${window.Anju.GIS_API_BASE_URL}/houses/stats?group_by=${groupBy}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`网络响应失败: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取房源统计数据失败:', error);
            return [];
        }
    }

    // 找房源页面组件
    const FindHousePage = {
        template: `
            <div class="findhouse-page">
                <style scoped>
                    .compass {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        width: 60px;
                        height: 60px;
                        z-index: 99999; /* 大幅提高z-index确保显示在所有地图控件之上 */
                        pointer-events: none;
                        background: rgba(255, 255, 255, 0.9);
                        border: 2px solid #4caf50;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                        transform: translateZ(100px); /* 添加3D变换，提高层级 */
                    }
                    
                    .compass-rose {
                        width: 80%;
                        height: 80%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        transition: transform 0.1s ease-out;
                    }
                    
                    .compass-direction {
                        position: absolute;
                        font-weight: bold;
                        font-size: 12px;
                        color: #2c3e2f;
                    }
                    
                    .compass-direction.N {
                        top: 0;
                    }
                    
                    .compass-direction.E {
                        right: 0;
                    }
                    
                    .compass-direction.S {
                        bottom: 0;
                    }
                    
                    .compass-direction.W {
                        left: 0;
                    }
                </style>
                <div class="findhouse-container">
                    <div class="map-section">
                        <div class="map-wrapper">
                            <div class="search-bar">
                                <div class="search-input-wrapper">
                                    <i class="fas fa-search"></i>
                                    <input type="text" v-model="searchKeyword" placeholder="输入位置，支持地理编码" @keyup.enter="searchLocation" />
                                </div>
                                <button class="search-btn" @click="searchLocation">
                                    <i class="fas fa-location-arrow"></i>
                                    <span>搜索</span>
                                </button>
                            </div>
                            <div class="map-container">
                                <div id="mapContainer" ref="mapContainer" style="position: relative;">
                                    <div class="map-loading" v-if="!map">
                                        <i class="fas fa-spinner fa-spin"></i>
                                        <p>地图加载中...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="heatmap-container">
                            <div class="boxplot-container">
                                <iframe src="simple_boxplot_fixed.html" style="width: 100%; height: 600px; border: none;"></iframe>
                            </div>
                            <div class="heatmap-stats">
                                <div class="stat-item">
                                    <div class="stat-value">{{ livabilityIndex }}%</div>
                                    <div class="stat-label">宜居指数</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">{{ houses.length }}</div>
                                    <div class="stat-label">房源数量</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">{{ averageCommute }}km</div>
                                    <div class="stat-label">平均通勤</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="houses-section">
                        <div class="houses-main">
                            <div class="houses-header">
                                <h3>附近推荐房源</h3>
                                <span class="demo-tag" v-if="isUsingDemoData">演示数据</span>
                            </div>
                            <div v-if="isLoading" class="loading-state">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>加载中...</p>
                            </div>
                            <div v-else-if="houses.length === 0" class="empty-state">
                                <i class="fas fa-database"></i>
                                <p>暂无房源，请等待数据接入</p>
                            </div>
                            <div class="houses-grid">
                                <div v-for="house in houses" :key="house.id" class="house-card" @click="viewReport(house.id)"
                                     style="background: var(--bg-primary) !important; border-radius: 20px !important; padding: 20px 20px 14px 20px !important; border: 2px solid var(--border-color) !important; transition: 0.3s !important; position: relative !important; display: flex !important; flex-direction: row !important; gap: 24px !important; overflow: hidden !important; cursor: pointer !important;">
                                    <!-- 右上角收藏按钮 -->
                                    <button class="favorite-btn" @click.stop="toggleFavorite(house.id)" :class="{ active: isFav(house.id) }"
                                            style="position: absolute !important; top: 20px !important; right: 20px !important; z-index: 10 !important; padding: 10px 28px !important; border-radius: 16px !important; background-color: var(--bg-card) !important; border: 2px solid var(--border-color) !important; color: var(--accent) !important; font-size: 15px !important; font-weight: 600 !important; display: flex !important; align-items: center !important; gap: 8px !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;">
                                        <i :class="isFav(house.id) ? 'fas fa-heart' : 'far fa-heart'" style="font-size: 20px !important;"></i>
                                        <span>{{ isFav(house.id) ? '已收藏' : '收藏' }}</span>
                                    </button>
                                    
                                    <!-- 左侧图片 -->
                                    <div class="house-image"
                                         style="width: 170px !important; height: 170px !important; min-width: 170px !important; border-radius: 20px !important; background: linear-gradient(135deg, #f5f5f5, #e0e0e0) !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important;">
                                        <div class="image-placeholder" v-if="!house.封面图URL">
                                            <i class="fas fa-home"></i>
                                        </div>
                                        <img 
                                            v-else 
                                            :src="house.封面图URL" 
                                            alt="房源图片"
                                            loading="lazy"
                                            @load="imageLoaded"
                                            @error="imageError"
                                            style="width: 100% !important; height: 100% !important; object-fit: cover !important;"
                                        />
                                    </div>
                                    
                                    <!-- 右侧信息 -->
                                    <div class="house-info"
                                         style="flex: 1 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; padding: 0 !important; padding-right: 20px !important; min-height: 170px !important;">
                                        <div>
                                            <!-- 标题 -->
                                            <div class="house-title"
                                                 style="font-size: 21px !important; font-weight: 700 !important; color: #2c3e2f !important; margin-bottom: 10px !important; line-height: 1.35 !important; padding-right: 110px !important;">
                                                {{ house.标题 }}
                                            </div>
                                            
                                            <!-- 地址+地铁 - 分行显示，左对齐 -->
                                            <div class="house-address" style="margin-bottom: 14px !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important;">
                                                <div class="address-item"
                                                     style="font-size: 17px !important; color: rgba(44, 62, 47, 0.75) !important; margin-bottom: 6px !important; display: flex !important; align-items: center !important; gap: 10px !important; justify-content: flex-start !important;">
                                                    <i class="fas fa-map-marker-alt" style="font-size: 20px !important; color: var(--accent) !important;"></i>
                                                    <span>{{ house.完整地址 }}</span>
                                                </div>
                                                <div class="address-item"
                                                     style="font-size: 17px !important; color: rgba(44, 62, 47, 0.75) !important; display: flex !important; align-items: center !important; gap: 10px !important; justify-content: flex-start !important;">
                                                    <i class="fas fa-subway" style="font-size: 20px !important; color: var(--accent) !important;"></i>
                                                    <span>{{ house.地铁 }}</span>
                                                </div>
                                            </div>
                                            
                                            <!-- 面积/户型/楼层 - 缩小卡片，内容居中 -->
                                            <div class="house-details"
                                                 style="display: flex !important; gap: 14px !important; margin-bottom: 8px !important;">
                                                <div class="detail-item"
                                                     style="font-size: 17px !important; color: #2c3e2f !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 5px !important; padding: 8px 14px !important; background: rgba(255, 255, 255, 0.6) !important; border-radius: 14px !important; flex: 1 !important; white-space: nowrap !important;">
                                                    <i class="fas fa-ruler-combined" style="font-size: 20px !important; color: var(--accent) !important;"></i>
                                                    <span>{{ house.面积 }}</span>
                                                </div>
                                                <div class="detail-item"
                                                     style="font-size: 17px !important; color: #2c3e2f !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 5px !important; padding: 8px 14px !important; background: rgba(255, 255, 255, 0.6) !important; border-radius: 14px !important; flex: 1 !important; white-space: nowrap !important;">
                                                    <i class="fas fa-home" style="font-size: 20px !important; color: var(--accent) !important;"></i>
                                                    <span>{{ house.户型 }}</span>
                                                </div>
                                                <div class="detail-item"
                                                     style="font-size: 17px !important; color: #2c3e2f !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 5px !important; padding: 8px 14px !important; background: rgba(255, 255, 255, 0.6) !important; border-radius: 14px !important; flex: 1 !important; white-space: nowrap !important;">
                                                    <i class="fas fa-building" style="font-size: 20px !important; color: var(--accent) !important;"></i>
                                                    <span>{{ house.楼层 }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- 底部：标签+价格 -->
                                        <div class="house-bottom"
                                             style="display: flex !important; justify-content: space-between !important; align-items: flex-start !important; gap: 10px !important;">
                                            <div class="house-tags"
                                                 style="display: flex !important; gap: 8px !important; align-items: center !important; flex-wrap: nowrap !important; margin-top: 8px !important;">
                                                <span class="tag"
                                                      style="display: inline-block !important; padding: 6px 14px !important; border-radius: 18px !important; font-size: 14px !important; font-weight: 500 !important; background-color: rgba(255, 255, 255, 0.7) !important; color: var(--accent) !important; white-space: nowrap !important;">
                                                    {{ house.装修 }}
                                                </span>
                                                <span class="tag"
                                                      style="display: inline-block !important; padding: 6px 14px !important; border-radius: 18px !important; font-size: 14px !important; font-weight: 500 !important; background-color: rgba(255, 255, 255, 0.7) !important; color: var(--accent) !important; white-space: nowrap !important;">
                                                    {{ house.朝向 }}
                                                </span>
                                                <span class="tag"
                                                      style="display: inline-block !important; padding: 6px 14px !important; border-radius: 18px !important; font-size: 14px !important; font-weight: 500 !important; background-color: rgba(255, 255, 255, 0.7) !important; color: var(--accent) !important; white-space: nowrap !important;">
                                                    {{ house.类型 }}
                                                </span>
                                            </div>
                                            <div class="house-price"
                                                 style="font-size: 26px !important; font-weight: bold !important; color: var(--accent) !important; text-align: right !important; background: rgba(255, 255, 255, 0.6) !important; padding: 8px 20px !important; border-radius: 16px !important; white-space: nowrap !important; margin-right: -10px !important; margin-top: 8px !important;">
                                                {{ house.价格 }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 分页控件 -->
                            <div class="pagination" v-if="total > 0">
                                <button class="page-btn" @click="changePage(currentPage - 1)" :disabled="currentPage === 1">
                                    <i class="fas fa-chevron-left"></i> 上一页
                                </button>
                                <span class="page-info">
                                    第 {{ currentPage }} 页，共 {{ totalPages }} 页，总计 {{ total }} 条
                                </span>
                                <button class="page-btn" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">
                                    下一页 <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>

                        <div class="hot-houses-sidebar">
                            <div class="sidebar-header">
                                <i class="fas fa-fire"></i>
                                <h4>热推房源</h4>
                            </div>
                            <div class="hot-house-list">
                                <div v-for="(house, index) in hotHouses" :key="house.id" class="hot-house-card" @click="goToReport(house.id)">
                                    <div class="hot-house-rank">{{ index + 1 }}</div>
                                    <div class="hot-house-content">
                                        <div class="hot-house-title">{{ house.标题 }}</div>
                                        <div class="hot-house-info">
                                            <span class="hot-house-price">{{ house.价格 }}</span>
                                            <span class="hot-house-area">{{ house.面积 }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="sidebar-ad">
                                <div class="ad-badge">广告</div>
                                <div class="ad-content">
                                    <i class="fas fa-ad"></i>
                                    <p>优质房源推荐</p>
                                    <button>了解更多</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        data() {
                return {
                    houses: [],
                    searchKeyword: '',
                    isUsingDemoData: false,
                    isLoading: false,
                    currentPage: 1,
                    pageSize: 5, // 每页显示5个房源
                    total: 0,
                    loadedImages: 0,
                    map: null,
                    markers: [],
                    heatmap: null, // 热力图实例
                    // datagis服务相关状态
                    nearbyHouses: [],
                    allNearbyHouses: [], // 保存所有附近房源，用于分页
                    heatmapData: null,
                    housesStats: [],
                    isLoadingDatagis: false,
                    // 数据库房源相关状态
                    allHouses: [], // 保存所有数据库房源，用于分页
                    // 地图事件防抖计时器
                    moveTimer: null,
                    // 收藏状态
                    favoriteIds: [],
                    // 搜索状态
                    lastSearchLocation: null, // 保存最后搜索的位置
                    isSearching: false, // 是否正在搜索中
                    searchMarker: null, // 搜索位置的标记
                    // 图片查看模态框
                    showImageModal: false,
                    selectedImage: ''
                };
            },
        computed: {
            hotHouses() {
                return this.houses.slice(0, 3);
            },
            totalPages() {
                return Math.ceil(this.total / this.pageSize);
            },
            livabilityIndex() {
                // 根据房源数量和平均通勤距离计算宜居指数
                if (this.total === 0) return 0;
                
                // 获取平均通勤距离（转换为数字）
                const commuteDistance = parseFloat(this.averageCommute) || 0;
                
                // 计算通勤距离分数（通勤距离越短，分数越高）
                // 假设通勤距离在2-5公里之间，将其映射到0-10分
                const commuteScore = Math.max(0, Math.min(10, 15 - commuteDistance * 3));
                
                // 计算房源数量分数（房源数量越多，分数越高）
                // 将房源数量映射到0-10分
                const houseScore = Math.min(10, this.total / 5);
                
                // 设置权重：房源数量占30%，通勤距离占70%
                const finalScore = (houseScore * 0.3) + (commuteScore * 0.7);
                
                // 将分数映射到85-92之间
                const minIndex = 85;
                const maxIndex = 92;
                const normalizedIndex = minIndex + (finalScore / 10) * (maxIndex - minIndex);
                
                return Math.round(normalizedIndex);
            },
            averageCommute() {
                // 模拟计算平均通勤距离
                if (this.houses.length === 0) return 0;
                return (3 + Math.random() * 2).toFixed(1);
            }
        },
        async mounted() {
            // 初始化地图
            this.initMap();
            // 默认加载福田区的附近房源
            this.loadFutianHouses();
            // 页面加载时获取第一页房源（作为备选）
            await this.loadHouses();
        },
        methods: {
            // 加载福田区的附近房源
            loadFutianHouses() {
                console.log('默认加载福田区的附近房源');
                // 福田区的经纬度
                const futianLng = 114.057868;
                const futianLat = 22.543099;
                // 保存福田区为默认搜索位置
                this.lastSearchLocation = {
                    address: '深圳市福田区',
                    lng: futianLng,
                    lat: futianLat
                };
                // 调用后端搜索接口，根据"福田"关键词搜索房源
                this.searchHousesByDistrict('福田');
            },
            async loadHouses() {
                // 如果已经有搜索结果，不覆盖数据
                if (this.lastSearchLocation && this.lastSearchLocation.address) {
                    console.log('已有搜索结果，跳过默认房源加载');
                    return;
                }
                
                this.isLoading = true;
                try {
                    // 重置图片加载计数器
                    this.loadedImages = 0;
                    
                    // 如果是第一页，从后端获取所有数据
                    if (this.currentPage === 1) {
                        // 暂时获取所有数据，实际项目中可能需要调整
                        const data = await getHouses(1, 100); // 获取足够多的数据
                        this.allHouses = data.list;
                        this.total = data.total;
                        this.isUsingDemoData = data.list === window.Anju.demoHouses;
                        console.log('房源数据加载成功:', this.allHouses.length, '条');
                    }
                    
                    // 从保存的所有房源中获取当前页数据
                    const start = (this.currentPage - 1) * this.pageSize;
                    const end = start + this.pageSize;
                    this.houses = this.allHouses.slice(start, end);
                    console.log('显示当前页数据，页码:', this.currentPage, '数据范围:', start, '-', end, '数据长度:', this.houses.length);
                    
                    // 确保地图标记更新
                    if (this.map) {
                        this.updateMapMarkers();
                    }
                } catch (error) {
                    console.error('加载房源失败:', error);
                    // 对演示数据进行分页处理
                    const start = (this.currentPage - 1) * this.pageSize;
                    const end = start + this.pageSize;
                    this.houses = window.Anju.demoHouses.slice(start, end);
                    this.total = window.Anju.demoHouses.length;
                    this.isUsingDemoData = true;
                    console.log('使用演示数据，当前页:', this.currentPage, '数据范围:', start, '-', end, '数据长度:', this.houses.length);
                } finally {
                    this.isLoading = false;
                    // 滚动到页面顶部
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },
            
            // 跳转到房源报告页面
            goToReport(houseId) {
                this.$router.push({
                    path: '/analysis',
                    query: {
                        id: houseId,
                        source: '/findhouse'
                    }
                });
            },
            
            initMap() {
                // 检查高德地图API是否加载
                if (typeof window.AMap === 'undefined') {
                    console.log('加载高德地图API...');
                    // 加载高德地图API，使用正确的前端地图API key
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src = 'https://webapi.amap.com/maps?v=2.0&key=94d26cdc6bf42d2419bd26135e220d6d&callback=initAMap';
                    script.async = true;
                    script.onerror = () => {
                        console.error('高德地图API加载失败');
                    };
                    document.head.appendChild(script);
                    
                    // 全局回调函数
                    window.initAMap = () => {
                        console.log('高德地图API加载成功');
                        this.createMap();
                    };
                } else {
                    console.log('高德地图API已加载');
                    this.createMap();
                }
            },

            createMap() {
                try {
                    // 确保地图容器有正确的尺寸
                    const mapContainer = document.getElementById('mapContainer');
                    if (!mapContainer) {
                        console.error('地图容器不存在');
                        return;
                    }
                    
                    // 设置地图容器尺寸
                    mapContainer.style.width = '100%';
                    mapContainer.style.height = '500px';
                    
                    // 创建地图实例，默认定位到福田区
                    this.map = new window.AMap.Map('mapContainer', {
                        zoom: 13,
                        center: [114.057868, 22.543099], // 福田区中心坐标
                        viewMode: '3D',
                        resizeEnable: true,
                        zoomEnable: true,
                        dragEnable: true
                    });
                    console.log('地图实例创建成功');
                    
                    // 加载地图插件 - 确保包含Geocoder用于搜索功能
                    window.AMap.plugin(['AMap.ToolBar', 'AMap.Scale', 'AMap.OverviewMap', 'AMap.Geocoder'], () => {
                        try {
                            // 添加控件
                            if (window.AMap.ToolBar) {
                                this.map.addControl(new window.AMap.ToolBar());
                            }
                            if (window.AMap.Scale) {
                                this.map.addControl(new window.AMap.Scale());
                            }
                            if (window.AMap.OverviewMap) {
                                this.map.addControl(new window.AMap.OverviewMap());
                            }
                            console.log('地图控件和Geocoder服务加载成功');
                        } catch (error) {
                            console.error('地图控件加载失败:', error);
                        }
                    });
                    
                    // 添加地图移动事件监听器
                    this.map.on('moveend', this.onMapMove);
                    // 添加地图旋转事件监听器
                    this.map.on('rotate', this.onMapRotate);
                    this.map.on('moveend', this.onMapRotate);
                    

                    
                    // 更新标记
                    this.updateMapMarkers();
                } catch (error) {
                    console.error('地图创建失败:', error);
                }
            },
            // 在updateMapMarkers方法中，确保经纬度的正确使用
            updateMapMarkers() {
                if (!this.map) return;
                
                console.log('更新地图标记:', this.houses.length);
                
                // 清除现有标记
                this.markers.forEach(marker => marker.remove());
                this.markers = [];
                
                // 添加新标记
                this.houses.forEach((house, index) => {
                    // 使用从dataGis服务获取的经纬度（如果有）
                    let lng, lat;
                    if (house.lng && house.lat && house.lng !== 0 && house.lat !== 0) {
                        // 确保经纬度范围正确
                        lng = Number(house.lng);
                        lat = Number(house.lat);
                        // 验证经纬度是否为有效数字
                        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                            // 如果经纬度无效，使用默认值
                            lng = 114.0579 + (Math.random() - 0.5) * 0.05;
                            lat = 22.5431 + (Math.random() - 0.5) * 0.05;
                        } else {
                            // 确保经纬度范围正确
                            lng = Math.max(-180, Math.min(180, lng));
                            lat = Math.max(-90, Math.min(90, lat));
                        }
                    } else {
                        // 模拟经纬度，默认在深圳市附近，限制范围
                        // 为每个房源生成不同的位置，避免重叠
                        lng = 114.0579 + (Math.random() - 0.5) * 0.05; // 缩小范围到深圳市内
                        lat = 22.5431 + (Math.random() - 0.5) * 0.05;
                    }
                    
                    try {
                        // 验证坐标有效性
                        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
                            console.error('无效坐标:', { lng, lat });
                            return;
                        }
                        
                        // 创建自定义标记图标
                        const markerIcon = new window.AMap.Icon({
                            size: new window.AMap.Size(30, 30),
                            image: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
                            imageSize: new window.AMap.Size(30, 30)
                        });
                        
                        // 创建标记
                        const marker = new window.AMap.Marker({
                            position: [lng, lat],
                            title: house.标题,
                            icon: markerIcon,
                            map: this.map
                        });
                        
                        // 添加点击事件
                        marker.on('click', () => {
                            // 显示房源信息
                            new window.AMap.InfoWindow({
                                content: `
                                    <div style="padding: 15px;">
                                        <h3 style="margin: 0 0 10px 0; color: #333;">${house.标题}</h3>
                                        <p style="margin: 5px 0; color: #666;">价格: <strong style="color: #ff4d4f;">${house.价格}</strong></p>
                                        <p style="margin: 5px 0; color: #666;">地址: ${house.完整地址}</p>
                                        <p style="margin: 5px 0; color: #666;">面积: ${house.面积}</p>
                                        <p style="margin: 5px 0; color: #666;">户型: ${house.户型}</p>
                                        <button style="margin-top: 10px; padding: 5px 15px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.location.href='#/analysis?id=${house.id}'">查看报告</button>
                                    </div>
                                `,
                                size: new window.AMap.Size(320, 0),
                                offset: new window.AMap.Pixel(0, -30)
                            }).open(this.map, [lng, lat]);
                        });
                        
                        this.markers.push(marker);
                    } catch (error) {
                        console.error('创建标记失败:', error);
                    }
                });
                
                // 如果有房源且不在搜索中，将地图中心定位到第一个房源的位置
                if (this.houses.length > 0 && !this.isSearching) {
                    const firstHouse = this.houses[0];
                    let centerLng, centerLat;
                    if (firstHouse.lng && firstHouse.lat) {
                        centerLng = Number(firstHouse.lng);
                        centerLat = Number(firstHouse.lat);
                        // 验证坐标有效性
                        if (!Number.isFinite(centerLng) || !Number.isFinite(centerLat)) {
                            // 如果坐标无效，使用默认位置
                            centerLng = 114.0579;
                            centerLat = 22.5431;
                        }
                    } else {
                        // 如果没有经纬度，使用默认位置
                        centerLng = 114.0579;
                        centerLat = 22.5431;
                    }
                    this.map.setCenter([centerLng, centerLat]);
                    this.map.setZoom(13);
                }
            },
            searchLocation() {
                console.log('=== 开始搜索位置 ===');
                console.log('搜索关键词:', this.searchKeyword);
                console.log('地图实例:', this.map);
                console.log('AMap对象:', typeof window.AMap);
                console.log('AMap.Geocoder:', typeof window.AMap.Geocoder);
                
                if (!this.searchKeyword) {
                    alert('请输入搜索位置');
                    return;
                }
                
                if (!this.map) {
                    alert('地图尚未加载完成，请稍候再试');
                    return;
                }
                
                // 预定义深圳常见区域的坐标（优先使用）
                const predefinedLocations = {
                    '宝安': { lng: 113.883080, lat: 22.553290, address: '深圳市宝安区' },
                    '宝安区': { lng: 113.883080, lat: 22.553290, address: '深圳市宝安区' },
                    '南山': { lng: 113.929430, lat: 22.536200, address: '深圳市南山区' },
                    '南山区': { lng: 113.929430, lat: 22.536200, address: '深圳市南山区' },
                    '福田': { lng: 114.057868, lat: 22.543099, address: '深圳市福田区' },
                    '福田区': { lng: 114.057868, lat: 22.543099, address: '深圳市福田区' },
                    '罗湖': { lng: 114.110720, lat: 22.548800, address: '深圳市罗湖区' },
                    '罗湖区': { lng: 114.110720, lat: 22.548800, address: '深圳市罗湖区' },
                    '龙华': { lng: 114.039870, lat: 22.691750, address: '深圳市龙华区' },
                    '龙华区': { lng: 114.039870, lat: 22.691750, address: '深圳市龙华区' },
                    '龙岗': { lng: 114.250730, lat: 22.722100, address: '深圳市龙岗区' },
                    '龙岗区': { lng: 114.250730, lat: 22.722100, address: '深圳市龙岗区' },
                    '坪山': { lng: 114.349890, lat: 22.686870, address: '深圳市坪山区' },
                    '坪山区': { lng: 114.349890, lat: 22.686870, address: '深圳市坪山区' },
                    '光明': { lng: 113.954390, lat: 22.786070, address: '深圳市光明区' },
                    '光明区': { lng: 113.954390, lat: 22.786070, address: '深圳市光明区' },
                    '盐田': { lng: 114.236400, lat: 22.559550, address: '深圳市盐田区' },
                    '盐田区': { lng: 114.236400, lat: 22.559550, address: '深圳市盐田区' },
                    '布吉': { lng: 114.167900, lat: 22.572600, address: '深圳市布吉区' },
                    '布吉区': { lng: 114.167900, lat: 22.572600, address: '深圳市布吉区' },
                    '深圳': { lng: 114.057868, lat: 22.543099, address: '深圳市' }
                };
                
                // 首先检查预定义坐标
                for (const key in predefinedLocations) {
                    if (this.searchKeyword.includes(key)) {
                        console.log('使用预定义坐标:', key);
                        const loc = predefinedLocations[key];
                        // 设置搜索标志，避免地图被重置
                        this.isSearching = true;
                        // 移动地图到搜索位置
                        this.map.setCenter([loc.lng, loc.lat]);
                        this.map.setZoom(15);
                        
                        // 添加搜索位置标记
                        if (this.searchMarker) {
                            this.searchMarker.remove();
                        }
                        this.searchMarker = new window.AMap.Marker({
                            position: [loc.lng, loc.lat],
                            title: loc.address,
                            icon: new window.AMap.Icon({
                                size: new window.AMap.Size(40, 40),
                                image: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
                                imageSize: new window.AMap.Size(40, 40)
                            }),
                            map: this.map
                        });
                        
                        // 移除信息窗口，不再显示经纬度信息
                        
                        // 保存搜索位置
                        this.lastSearchLocation = {
                            address: loc.address,
                            lng: loc.lng,
                            lat: loc.lat
                        };
                        
                        // 重置页码
                        this.currentPage = 1;
                        
                        // 调用后端搜索接口，根据区域名称获取房源
                        console.log('搜索位置已定位，调用后端搜索接口获取区域房源');
                        this.searchHousesByDistrict(key);
                        
                        // 延迟重置搜索标志
                        setTimeout(() => {
                            this.isSearching = false;
                        }, 1000);
                        
                        console.log('=== 搜索完成 ===');
                        return;
                    }
                }
                
                // 检查 AMap 是否可用
                if (typeof window.AMap === 'undefined') {
                    alert('高德地图API未加载，请刷新页面重试');
                    return;
                }
                
                // 设置搜索标志，避免地图被重置
                this.isSearching = true;
                
                const performSearch = () => {
                    try {
                        console.log('创建Geocoder实例...');
                        const geocoder = new window.AMap.Geocoder({
                            city: '深圳' // 限定在深圳市内搜索
                        });
                        
                        console.log('Geocoder实例创建成功，开始查询...');
                        
                        // 使用Promise包装回调，更可靠
                        geocoder.getLocation(this.searchKeyword, (status, result) => {
                            console.log('=== 地理编码回调触发 ===');
                            console.log('状态:', status);
                            console.log('完整结果:', result);
                            
                            if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
                                const location = result.geocodes[0].location;
                                const address = result.geocodes[0].formattedAddress;
                                
                                console.log('找到位置:');
                                console.log('  - 地址:', address);
                                console.log('  - 经度:', location.lng);
                                console.log('  - 纬度:', location.lat);
                                
                                // 移动地图到搜索位置
                                console.log('移动地图到新位置...');
                                this.map.setCenter([location.lng, location.lat]);
                                this.map.setZoom(15);
                                
                                // 添加搜索位置标记
                                console.log('添加搜索标记...');
                                if (this.searchMarker) {
                                    this.searchMarker.remove();
                                }
                                this.searchMarker = new window.AMap.Marker({
                                    position: [location.lng, location.lat],
                                    title: address,
                                    icon: new window.AMap.Icon({
                                        size: new window.AMap.Size(40, 40),
                                        image: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
                                        imageSize: new window.AMap.Size(40, 40)
                                    }),
                                    map: this.map
                                });
                                
                                // 移除信息窗口，不再显示经纬度信息
                                
                                // 保存搜索位置
                                this.lastSearchLocation = {
                                    address: address,
                                    lng: location.lng,
                                    lat: location.lat
                                };
                                
                                // 重置页码
                                this.currentPage = 1;
                                
                                // 调用后端搜索接口，根据地址获取房源
                                console.log('搜索位置已定位，调用后端搜索接口获取区域房源');
                                this.searchHousesByDistrict(address);
                                
                                // 延迟重置搜索标志
                                setTimeout(() => {
                                    this.isSearching = false;
                                }, 1000);
                                
                                console.log('=== 搜索完成 ===');
                            } else {
                                console.log('未找到位置或状态不是complete');
                                if (result && result.info) {
                                    console.log('错误信息:', result.info);
                                }
                                alert('未找到该位置，请尝试其他关键词');
                                this.isSearching = false;
                            }
                        });
                    } catch (error) {
                        console.error('地理编码服务错误:', error);
                        alert('搜索服务出现错误: ' + error.message);
                        this.isSearching = false;
                    }
                };
                
                // 检查Geocoder是否已加载
                if (window.AMap.Geocoder) {
                    console.log('Geocoder已加载，直接执行搜索');
                    performSearch();
                } else {
                    console.log('Geocoder未加载，先加载插件...');
                    window.AMap.plugin(['AMap.Geocoder'], () => {
                        console.log('Geocoder插件加载完成');
                        // 添加延迟确保完全加载
                        setTimeout(() => {
                            performSearch();
                        }, 200);
                    });
                }
            },
            toggleFavorite(houseId) {
                if (!globalState.currentUser) {
                    alert("请先登录");
                    globalState.showLoginModal = true;
                    return;
                }

                const username = globalState.currentUser.username;
                const house = this.houses.find(h => h.id === houseId);
                if (!house) return;

                if (this.isFav(houseId)) {
                    removeFavorite(username, houseId);
                } else {
                    addFavorite(username, houseId);
                }
                // 强制重新渲染
                this.$forceUpdate();
            },

            isFav(houseId) {
                return globalState.currentUser && isFavorited(globalState.currentUser.username, houseId);
            },
            viewReport(houseId) {
                this.$router.push({ path: '/analysis', query: { id: houseId } });
            },
            changePage(page) {
                if (page < 1 || page > this.totalPages) {
                    return;
                }
                this.currentPage = page;
                // 根据是否有搜索位置决定数据来源
                if (this.lastSearchLocation) {
                    // 如果有搜索位置，从保存的附近房源数据中获取当前页
                    if (this.allNearbyHouses.length > 0) {
                        this.isLoading = true;
                        try {
                            const start = (this.currentPage - 1) * this.pageSize;
                            const end = start + this.pageSize;
                            this.houses = this.allNearbyHouses.slice(start, end);
                            console.log('从保存的附近房源数据中加载分页数据，页码:', this.currentPage, '数据范围:', start, '-', end, '数据长度:', this.houses.length);
                            // 更新地图标记
                            this.updateMapMarkers();
                        } catch (error) {
                            console.error('分页加载失败:', error);
                            // 重新从服务获取数据
                            this.loadNearbyHouses(this.lastSearchLocation.lng, this.lastSearchLocation.lat);
                        } finally {
                            this.isLoading = false;
                            // 滚动到页面顶部
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    } else {
                        // 如果没有保存的附近房源数据，从datagis服务获取
                        this.loadNearbyHouses(this.lastSearchLocation.lng, this.lastSearchLocation.lat);
                    }
                } else {
                    // 否则从保存的数据库房源数据中获取当前页
                    if (this.allHouses.length > 0) {
                        this.isLoading = true;
                        try {
                            const start = (this.currentPage - 1) * this.pageSize;
                            const end = start + this.pageSize;
                            this.houses = this.allHouses.slice(start, end);
                            console.log('从保存的数据库房源数据中加载分页数据，页码:', this.currentPage, '数据范围:', start, '-', end, '数据长度:', this.houses.length);
                            // 更新地图标记
                            this.updateMapMarkers();
                        } catch (error) {
                            console.error('分页加载失败:', error);
                            // 重新从服务获取数据
                            this.loadHouses();
                        } finally {
                            this.isLoading = false;
                            // 滚动到页面顶部
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    } else {
                        // 如果没有保存的数据库房源数据，从后端获取
                        this.loadHouses();
                    }
                }
            },
            imageLoaded() {
                this.loadedImages++;
                console.log(`图片加载完成: ${this.loadedImages}/${this.houses.length}`);
            },
            imageError(e) {
                console.error('图片加载失败:', e.target.src);
                e.target.src = 'https://via.placeholder.com/200x150?text=暂无图片';
            },
            // 打开图片放大模态框
            openImageModal(imageUrl) {
                if (imageUrl) {
                    this.selectedImage = imageUrl;
                    this.showImageModal = true;
                    document.body.style.overflow = 'hidden';
                }
            },
            // 关闭图片放大模态框
            closeImageModal() {
                this.showImageModal = false;
                this.selectedImage = '';
                document.body.style.overflow = 'auto';
            },
            // 调用后端搜索接口，根据区域名称获取房源
            async searchHousesByDistrict(district) {
                console.log('开始搜索区域房源:', district);
                this.isLoading = true;
                try {
                    // 使用 AbortController 实现超时功能
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
                    
                    const response = await fetch(`${window.Anju.API_BASE_URL}/api/houses/search`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ district }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`网络响应失败: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    if (data.code === 200) {
                        const houses = data.data;
                        console.log('搜索到的房源数量:', houses.length);
                        
                        // 转换数据格式，确保字段名与前端匹配
                        const formattedHouses = houses.map(item => ({
                            id: item.id,
                            标题: item.title || item.标题 || '标题待定',
                            价格: item.price || item.价格 || '价格待定',
                            完整地址: item.address || item.完整地址 || '地址待定',
                            面积: item.area ? `${item.area}平方米` : (item.面积 || '面积待定'),
                            户型: item.houseType || item.户型 || '户型待定',
                            地铁: item.subway || item.地铁 || '地铁待定',
                            楼层: item.floor || item.楼层 || '楼层待定',
                            装修: item.decoration || item.装修 || '装修待定',
                            朝向: item.orientation || item.朝向 || '朝向待定',
                            类型: item.type || item.类型 || '类型待定',
                            封面图URL: item.imageUrl || item.封面图URL || '',
                            // 生成模拟经纬度（如果没有）
                            lng: item.lng || item.longitude || (this.lastSearchLocation ? this.lastSearchLocation.lng : 114.0579) + (Math.random() - 0.5) * 0.05,
                            lat: item.lat || item.latitude || (this.lastSearchLocation ? this.lastSearchLocation.lat : 22.5431) + (Math.random() - 0.5) * 0.05
                        }));
                        
                        // 应用地区筛选逻辑，参照个性化推荐模块
                        const filteredHouses = this.applyDistrictFilter(formattedHouses, district);
                        
                        this.allNearbyHouses = filteredHouses;
                        this.total = filteredHouses.length;
                        
                        // 分页处理
                        const start = (this.currentPage - 1) * this.pageSize;
                        const end = start + this.pageSize;
                        this.houses = filteredHouses.slice(start, end);
                        
                        // 计算筛选后房源的平均经纬度作为该地区的中心位置
                        let avgLng = 0;
                        let avgLat = 0;
                        let validCount = 0;
                        
                        filteredHouses.forEach(house => {
                            if (house.lng && house.lat && house.lng !== 0 && house.lat !== 0) {
                                avgLng += Number(house.lng);
                                avgLat += Number(house.lat);
                                validCount++;
                            }
                        });
                        
                        if (validCount > 0) {
                            avgLng /= validCount;
                            avgLat /= validCount;
                            console.log('计算的地区中心位置:', district, '经度:', avgLng, '纬度:', avgLat);
                            
                            // 移动地图到计算出的中心位置
                            this.map.setCenter([avgLng, avgLat]);
                            this.map.setZoom(13);
                            
                            // 更新搜索位置
                            this.lastSearchLocation = {
                                address: district,
                                lng: avgLng,
                                lat: avgLat
                            };
                        }
                        
                        // 更新地图标记
                        this.updateMapMarkers();
                    } else {
                        console.error('搜索房源失败:', data.msg);
                        // 使用附近房源作为备选
                        if (this.lastSearchLocation) {
                            this.loadNearbyHouses(this.lastSearchLocation.lng, this.lastSearchLocation.lat);
                        }
                    }
                } catch (error) {
                    console.error('搜索房源失败:', error);
                    // 使用附近房源作为备选
                    if (this.lastSearchLocation) {
                        this.loadNearbyHouses(this.lastSearchLocation.lng, this.lastSearchLocation.lat);
                    }
                } finally {
                    this.isLoading = false;
                }
            },
            // 应用地区筛选逻辑，参照个性化推荐模块
            applyDistrictFilter(houses, district) {
                console.log('应用地区筛选，筛选条件:', district);
                
                // 对每个房源进行筛选
                const filteredHouses = houses.filter(house => {
                    // 检查房源地址是否包含筛选条件，并且确保是完整的区域名称匹配
                    // 例如：搜索"龙岗区"时，只匹配包含"龙岗区"的地址，而不是包含"龙岗"的地址
                    const addressMatched = 
                        (house.完整地址 && house.完整地址.includes(district)) ||
                        (house.标题 && house.标题.includes(district));
                    
                    // 特殊处理：如果搜索的是"龙岗区"，则排除包含"布吉区"的房源
                    if (district.includes('龙岗') && house.完整地址 && house.完整地址.includes('布吉')) {
                        return false;
                    }
                    
                    return addressMatched;
                });
                
                console.log('筛选后房源数量:', filteredHouses.length);
                
                // 如果没有匹配的房源，返回所有房源（避免"找不到房源"错误）
                if (filteredHouses.length === 0) {
                    console.log('没有匹配的房源，返回所有房源');
                    return houses;
                }
                
                return filteredHouses;
            },
            // 使用datagis服务获取附近房源
            async loadNearbyHouses(lng, lat) {
                console.log('开始加载附近房源:', lng, lat);
                this.isLoadingDatagis = true;
                try {
                    // 验证经纬度有效性
                    const parsedLng = Number(lng);
                    const parsedLat = Number(lat);
                    if (!parsedLng || !parsedLat || !Number.isFinite(parsedLng) || !Number.isFinite(parsedLat)) {
                        console.error('无效的经纬度:', { lng, lat });
                        return;
                    }
                    
                    const data = await getNearbyHouses(parsedLng, parsedLat);
                    this.nearbyHouses = data;
                    this.allNearbyHouses = data; // 保存所有附近房源，用于分页
                    console.log('附近房源数据加载成功:', data.length);
                    
                    // 检查数据是否包含经纬度
                    if (data.length > 0) {
                        console.log('第一个房源数据:', data[0]);
                    }
                    
                    // 对附近房源数据进行分页处理
                    const start = (this.currentPage - 1) * this.pageSize;
                    const end = start + this.pageSize;
                    // 只有当用户没有执行过搜索时，才更新houses
                    // 避免覆盖搜索结果
                    if (!this.lastSearchLocation || !this.lastSearchLocation.address) {
                        this.houses = this.allNearbyHouses.slice(start, end);
                        this.total = data.length;
                        this.isUsingDemoData = data.length > 0 && data[0].id === window.Anju.demoHouses[0].id;
                        console.log('更新附近房源列表和地图标记，当前页:', this.currentPage, '数据范围:', start, '-', end, '数据长度:', this.houses.length);
                        this.updateMapMarkers();
                    } else {
                        console.log('用户已执行搜索，保留搜索结果，附近房源数据已加载:', data.length, '条');
                    }
                } catch (error) {
                    console.error('加载附近房源失败:', error);
                    // 加载演示数据作为备选
                    const demoData = window.Anju.demoHouses.map(house => ({
                        id: house.id,
                        标题: house.title,
                        价格: `${house.rent}元/月`,
                        完整地址: house.address,
                        面积: `${house.area}㎡`,
                        户型: '户型待定',
                        地铁: '地铁待定',
                        楼层: '楼层待定',
                        装修: '装修待定',
                        朝向: '朝向待定',
                        类型: '类型待定',
                        封面图URL: '',
                        // 生成模拟经纬度
                        lng: 114.0579 + (Math.random() - 0.5) * 0.05,
                        lat: 22.5431 + (Math.random() - 0.5) * 0.05
                    }));
                    this.nearbyHouses = demoData;
                    this.allNearbyHouses = demoData;
                    const start = (this.currentPage - 1) * this.pageSize;
                    const end = start + this.pageSize;
                    this.houses = demoData.slice(start, end);
                    this.total = demoData.length;
                    this.isUsingDemoData = true;
                    console.log('使用演示数据作为备选，当前页:', this.currentPage, '数据范围:', start, '-', end, '数据长度:', this.houses.length);
                    this.updateMapMarkers();
                } finally {
                    this.isLoadingDatagis = false;
                    // 滚动到页面顶部
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },
            // 使用datagis服务获取热力图数据
            async loadHeatmapData() {
                if (!this.map) return;
                
                const bounds = this.map.getBounds();
                if (!bounds) return;
                
                const northeast = bounds.getNorthEast();
                const southwest = bounds.getSouthWest();
                
                try {
                    const data = await getHeatmapData(northeast.getLat(), southwest.getLat(), northeast.getLng(), southwest.getLng());
                    this.heatmapData = data;
                    console.log('热力图数据加载成功:', data.features ? data.features.length : 0);
                    this.updateHeatmap();
                } catch (error) {
                    console.error('加载热力图数据失败:', error);
                }
            },
            // 使用datagis服务获取房源统计数据
            async loadHousesStats() {
                try {
                    const data = await getHousesStats();
                    this.housesStats = data;
                    console.log('房源统计数据加载成功:', data.length);
                } catch (error) {
                    console.error('加载房源统计数据失败:', error);
                }
            },
            // 更新热力图（暂时禁用，根据用户要求）
            updateHeatmap() {
                console.log('热力图功能已禁用');
                // 热力图功能暂时不启用
            },
            // 地图移动时的处理
            onMapMove() {
                if (this.moveTimer) {
                    clearTimeout(this.moveTimer);
                }
                this.moveTimer = setTimeout(() => {
                    console.log('地图移动');
                    // 获取当前地图中心
                    const center = this.map.getCenter();
                    console.log('当前地图中心:', center);
                    
                    // 如果有搜索标记，让它跟随地图中心移动
                    if (this.searchMarker) {
                        this.searchMarker.setPosition([center.lng, center.lat]);
                        console.log('搜索标记已移动到新位置:', center.lng, center.lat);
                    }
                    
                    // 只有当用户没有执行过搜索时，才加载附近房源
                    // 这样可以保持搜索后的定位和房源筛选结果
                    if (!this.lastSearchLocation || !this.lastSearchLocation.address) {
                        // 更新搜索位置信息
                        this.lastSearchLocation = {
                            address: '当前位置',
                            lng: center.lng,
                            lat: center.lat
                        };
                        
                        // 加载当前地图中心附近的房源
                        console.log('地图移动，加载当前位置附近的房源');
                        this.loadNearbyHouses(center.lng, center.lat);
                    } else {
                        console.log('用户已执行搜索，保持当前搜索结果');
                    }
                }, 300); // 300ms防抖
                }
            },
            // 地图旋转时的处理
            onMapRotate() {
                // 获取地图的当前旋转角度
                const rotation = this.map.getRotation();
                // 更新罗盘的旋转角度（罗盘需要与地图旋转方向相反）
                const compass = document.querySelector('#compass div');
                if (compass) {
                    compass.style.transform = `rotate(${rotation}deg)`;
                }
            }
        };

    window.Components = window.Components || {};
    window.Components.FindHousePage = FindHousePage;
})();
