(() => {
    const PersonalizedRecommendationPage = {
        data() {
            return {
                formData: {
                    companyAddress: '',
                    expectedRent: '',
                    roomType: '',
                    areaRange: '',
                    maxCommuteTime: '',
                    orientation: '',
                    rentType: '',
                    rentDuration: '',
                    tags: []
                },
                roomTypeOptions: ['一室一厅', '三室两厅', '公寓', '两室两厅', '复式', '别墅', '三室一厅'],
                orientationOptions: ['南北通透', '朝南', '东南', '朝东', '西南'],
                rentTypeOptions: ['整租', '独栋', '合租'],
                rentDurationOptions: ['短租（可短租）', '长租'],
                tagOptions: ['拎包入住', '家电齐全', '急租', '停车方便', '押一付一', '业主直租', '有燃气', '交通便利', '近商场', '近学校', '近公园'],
                recommendedHouses: [], // 初始为空，从后端加载
                allRecommendedHouses: [], // 保存所有推荐房源，用于前端分页
                defaultHouses: [], // 默认房源数据
                currentPage: 1,
                pageSize: 5, // 每页显示5个房源
                total: 0,
                isLoading: true, // 初始加载状态为true
                hasFilters: false, // 是否有筛选条件
                filterTimeout: null, // 防抖定时器
                favoriteIds: [] // 收藏状态
            };
        },
        template: `
            <div class="personalized-page">
                <div class="personalized-container">
                    <!-- 左侧：个人信息表单 -->
                    <div class="personalized-form">
                        <h2 class="personalized-title">个性化推荐</h2>
                        <p class="personalized-subtitle">填写您的需求，为您推荐最适合的房源</p>

                        <div class="form-section">
                            <h3 class="form-section-title">基本信息</h3>
                            <div class="form-group">
                                <label>公司地址</label>
                                <input v-model="formData.companyAddress" placeholder="请输入公司地址" @change="handleFilterChange" />
                            </div>
                            <div class="form-group">
                                <label>预期租金（元/月）</label>
                                <input v-model="formData.expectedRent" placeholder="请输入预期租金" type="number" @change="handleFilterChange" />
                            </div>
                        </div>

                        <div class="form-section">
                            <h3 class="form-section-title">房屋偏好</h3>
                            <div class="form-group">
                                <label>户型</label>
                                <div class="radio-group">
                                    <div v-for="option in roomTypeOptions" :key="option" 
                                         class="radio-option" 
                                         :class="{ 'selected': formData.roomType === option }"
                                         @click="toggleRadioOption('roomType', option)">
                                        <span>{{ option }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>面积区间（㎡）</label>
                                <select v-model="formData.areaRange" @change="handleFilterChange">
                                    <option value="">请选择</option>
                                    <option value="0-30">30㎡以下</option>
                                    <option value="30-50">30-50㎡</option>
                                    <option value="50-70">50-70㎡</option>
                                    <option value="70-90">70-90㎡</option>
                                    <option value="90-120">90-120㎡</option>
                                    <option value="120+">120㎡以上</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>通勤时间上限（分钟）</label>
                                <input v-model="formData.maxCommuteTime" placeholder="请输入通勤时间上限" type="number" @change="handleFilterChange" />
                            </div>
                            <div class="form-group">
                                <label>朝向</label>
                                <div class="radio-group">
                                    <div v-for="option in orientationOptions" :key="option" 
                                         class="radio-option" 
                                         :class="{ 'selected': formData.orientation === option }"
                                         @click="toggleRadioOption('orientation', option)">
                                        <span>{{ option }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>租房类型</label>
                                <div class="radio-group">
                                    <div v-for="option in rentTypeOptions" :key="option" 
                                         class="radio-option" 
                                         :class="{ 'selected': formData.rentType === option }"
                                         @click="toggleRadioOption('rentType', option)">
                                        <span>{{ option }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>租期</label>
                                <div class="radio-group">
                                    <div v-for="option in rentDurationOptions" :key="option" 
                                         class="radio-option" 
                                         :class="{ 'selected': formData.rentDuration === option }"
                                         @click="toggleRadioOption('rentDuration', option)">
                                        <span>{{ option }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3 class="form-section-title">个性化标签</h3>
                            <div class="checkbox-group">
                                <label v-for="tag in tagOptions" :key="tag" class="checkbox-label tag-label">
                                    <input type="checkbox" v-model="formData.tags" :value="tag" @change="handleFilterChange" />
                                    <span>{{ tag }}</span>
                                </label>
                            </div>
                        </div>

                        <button class="submit-btn" @click="generateRecommendations">生成推荐</button>
                    </div>

                    <!-- 右侧：推荐房源展示 -->
                    <div class="personalized-results">
                        <h3 class="results-title">推荐房源</h3>
                        <div v-if="isLoading" class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>加载中...</p>
                        </div>
                        <div v-else-if="recommendedHouses.length === 0" class="no-results">
                            <i class="fas fa-home"></i>
                            <p v-if="hasFilters">暂无符合条件的房源，请尝试调整筛选条件</p>
                            <p v-else>正在加载房源数据...</p>
                        </div>
                        <div v-else class="house-list">
                            <div v-for="house in recommendedHouses" :key="house.id" class="house-card" @click="viewReport(house.id)"
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
                    </div>
                </div>
            </div>
        `,
        computed: {
            totalPages() {
                return Math.ceil(this.total / this.pageSize);
            }
        },
        // ✅ 修复1：mounted 放在组件根级别，页面挂载时自动执行
        mounted() {
            console.log('PersonalizedRecommendationPage 挂载完成，开始加载数据');
            // 从localStorage加载筛选条件
            this.loadFiltersFromStorage();
            // 检查是否有筛选条件
            this.checkIfHasFilters();
            
            if (this.hasFilters) {
                // 有筛选条件，应用筛选
                console.log('检测到有筛选条件，应用筛选');
                this.generateRecommendations();
            } else {
                // 无筛选条件，加载默认数据
                console.log('没有筛选条件，加载默认数据');
                this.loadDefaultHouses();
            }
        },
        beforeUnmount() {
            // 组件销毁前保存筛选条件
            this.saveFiltersToStorage();
            console.log('PersonalizedRecommendationPage 即将销毁，保存筛选条件');
        },
        methods: {
            // 保存筛选条件到localStorage
            saveFiltersToStorage() {
                try {
                    localStorage.setItem('personalizedFilters', JSON.stringify(this.formData));
                    console.log('筛选条件已保存到localStorage');
                } catch (error) {
                    console.error('保存筛选条件失败:', error);
                }
            },
            // 从localStorage加载筛选条件
            loadFiltersFromStorage() {
                try {
                    const savedFilters = localStorage.getItem('personalizedFilters');
                    if (savedFilters) {
                        const parsedFilters = JSON.parse(savedFilters);
                        // 合并保存的筛选条件到formData
                        Object.keys(parsedFilters).forEach(key => {
                            if (this.formData.hasOwnProperty(key)) {
                                this.formData[key] = parsedFilters[key];
                            }
                        });
                        console.log('从localStorage加载筛选条件成功:', this.formData);
                    }
                } catch (error) {
                    console.error('加载筛选条件失败:', error);
                }
            },
            // ✅ 核心修复：统一generateRecommendations逻辑，完美实现需求
            generateRecommendations(forceDefault = false) {
                // 处理Vue自动传递的事件对象
                if (forceDefault && typeof forceDefault === 'object' && forceDefault.type === 'click') {
                    forceDefault = false;
                }
                
                // 检查是否有筛选条件
                if (!forceDefault) {
                    this.checkIfHasFilters();
                } else {
                    this.hasFilters = false;
                }
                
                this.isLoading = true;
                this.currentPage = 1;
                
                if (!this.hasFilters) {
                    // ✅ 无筛选：直接用已加载的100条默认数据，不重新请求
                    console.log('没有筛选条件，显示默认房源（100条）');
                    this.allRecommendedHouses = this.defaultHouses;
                    this.total = this.defaultHouses.length;
                    
                    const start = (this.currentPage - 1) * this.pageSize;
                    const end = start + this.pageSize;
                    this.recommendedHouses = this.allRecommendedHouses.slice(start, end);
                    console.log('默认状态下显示所有房源，总计:', this.total, '条，当前页显示:', this.recommendedHouses.length, '条');
                    this.isLoading = false;
                    return;
                } else {
                    // ✅ 有筛选：请求1000条数据，前端筛选
                    console.log('有筛选条件，请求1000条数据进行筛选');
                    fetch(`${window.Anju.API_BASE_URL}/api/recommend/default?pageSize=1000`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.code === 200 && data.data && data.data.list && data.data.list.length > 0) {
                            const houses = data.data.list;
                            console.log('从后端获取1000条房源数据成功');
                            
                            // 应用你原有的多级优先级筛选逻辑
                            const filteredHouses = this.applyPriorityFilter(houses);
                            this.allRecommendedHouses = filteredHouses;
                            this.total = filteredHouses.length;
                            
                            const start = (this.currentPage - 1) * this.pageSize;
                            const end = start + this.pageSize;
                            this.recommendedHouses = this.allRecommendedHouses.slice(start, end);
                            console.log('筛选后房源数量:', this.total, '条，当前页显示:', this.recommendedHouses.length, '条');
                        } else {
                            console.error('获取1000条数据失败，使用模拟数据');
                            this.useMockData();
                        }
                    })
                    .catch(error => {
                        console.error('获取推荐失败:', error);
                        this.useMockData();
                    })
                    .finally(() => {
                        this.isLoading = false;
                        console.log('筛选加载完成，isLoading已置为false');
                    });
                }
            },
            // 检查是否有筛选条件（完全保留你原有的逻辑）
            checkIfHasFilters() {
                const { companyAddress, expectedRent, roomType, areaRange, maxCommuteTime, orientation, rentType, rentDuration, tags } = this.formData;
                this.hasFilters = !!(companyAddress || expectedRent || roomType || areaRange || maxCommuteTime || orientation || rentType || rentDuration || (tags && tags.length > 0));
                console.log('是否有筛选条件:', this.hasFilters);
            },
            // ✅ 修复2：loadDefaultHouses 只负责加载100条默认数据，不做筛选
            loadDefaultHouses() {
                console.log('开始从后端加载默认房源数据（100条）');
                this.isLoading = true;
                
                fetch(`${window.Anju.API_BASE_URL}/api/recommend/default?pageSize=100`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    console.log('后端响应状态:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('后端返回数据:', data);
                    if (data.code === 200 && data.data && data.data.list && data.data.list.length > 0) {
                        const houses = data.data.list;
                        console.log('获取默认房源数据成功:', houses.length, '条');
                        
                        this.defaultHouses = houses;
                        this.allRecommendedHouses = houses;
                        this.total = houses.length;
                        this.hasFilters = false;
                        
                        const start = (this.currentPage - 1) * this.pageSize;
                        const end = start + this.pageSize;
                        this.recommendedHouses = houses.slice(start, end);
                        
                        console.log('默认数据加载完成，总房源数:', this.total, '条，当前页显示:', this.recommendedHouses.length, '条');
                    } else {
                        console.log('后端返回空数据，使用模拟数据');
                        this.useFallbackMockData();
                    }
                })
                .catch(error => {
                    console.error('获取默认房源失败:', error);
                    this.useFallbackMockData();
                })
                .finally(() => {
                    this.isLoading = false;
                    console.log('默认数据加载完成，isLoading设置为false');
                });
            },
            // 使用备选模拟数据（完全保留你原有的逻辑）
            useFallbackMockData() {
                console.log('使用备选模拟数据');
                const mockData = [
                    {
                        id: 1,
                        标题: '阳光花园 - 精装两居室',
                        完整地址: '朝阳区望京街道',
                        价格: '4500元/月',
                        面积: '65平方米',
                        户型: '两居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: '',
                        地铁: '望京站',
                        关键词: ['拎包入住', '家电齐全', '交通便利']
                    },
                    {
                        id: 2,
                        标题: '万科城市花园 - 舒适三居',
                        完整地址: '海淀区中关村',
                        价格: '6800元/月',
                        面积: '95平方米',
                        户型: '三居',
                        楼层: '高层',
                        装修: '精装修',
                        朝向: '南北通透',
                        类型: '普通住宅',
                        封面图URL: '',
                        地铁: '中关村站',
                        关键词: ['近学校', '近商场', '停车方便']
                    },
                    {
                        id: 3,
                        标题: '远洋山水 - 温馨一居',
                        完整地址: '丰台区方庄',
                        价格: '3200元/月',
                        面积: '45平方米',
                        户型: '一居',
                        楼层: '低层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: '',
                        地铁: '方庄站',
                        关键词: ['拎包入住', '急租', '押一付一']
                    },
                    {
                        id: 4,
                        标题: '保利香槟国际 - 豪华复式',
                        完整地址: '朝阳区 CBD',
                        价格: '8500元/月',
                        面积: '120平方米',
                        户型: '复式',
                        楼层: '高层',
                        装修: '豪华装修',
                        朝向: '南北通透',
                        类型: '公寓',
                        封面图URL: '',
                        地铁: '国贸站',
                        关键词: ['拎包入住', '家电齐全', '近商场']
                    },
                    {
                        id: 5,
                        标题: '首开璞瑅公馆 - 品质两居',
                        完整地址: '西城区金融街',
                        价格: '7200元/月',
                        面积: '75平方米',
                        户型: '两居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: '',
                        地铁: '金融街站',
                        关键词: ['近公园', '有燃气', '业主直租']
                    }
                ];
                
                this.defaultHouses = mockData;
                this.allRecommendedHouses = mockData;
                this.total = mockData.length;
                this.hasFilters = false;
                
                const start = (this.currentPage - 1) * this.pageSize;
                const end = start + this.pageSize;
                this.recommendedHouses = mockData.slice(start, end);
                
                console.log('备选模拟数据设置完成，显示:', this.recommendedHouses.length, '条');
            },
            // ✅ 删除冗余的updateDisplayedHouses、useDefaultMockData，避免状态混乱
            // 应用多级优先级筛选（完全保留你原有的逻辑，一字未改）
            applyPriorityFilter(houses) {
                const { roomType, orientation, rentType, rentDuration, tags, expectedRent, companyAddress, areaRange } = this.formData;
                console.log('用户选择的选项:', {
                    roomType,
                    orientation,
                    rentType,
                    rentDuration,
                    tags,
                    expectedRent,
                    companyAddress,
                    areaRange
                });
                
                // 收集所有筛选条件
                const filters = [];
                if (roomType) filters.push('roomType');
                if (orientation) filters.push('orientation');
                if (rentType) filters.push('rentType');
                if (rentDuration) filters.push('rentDuration');
                if (tags && tags.length > 0) filters.push('tags');
                if (expectedRent) filters.push('expectedRent');
                if (companyAddress) filters.push('companyAddress');
                if (areaRange) filters.push('areaRange');
                
                const totalFilters = filters.length;
                console.log('总筛选条件数:', totalFilters);
                
                // 如果没有任何筛选条件，返回所有房源
                if (totalFilters === 0) {
                    console.log('未选择任何筛选条件，返回所有房源');
                    return houses;
                }
                
                // 对每个房源计算匹配的条件数量和匹配度
                const housesWithMatch = houses.map(house => {
                    // 获取房源的所有标签和属性
                    const houseTags = this.getHouseTags(house);
                    
                    // 计算匹配的条件数量
                    let matchCount = 0;
                    let hasAddressMatch = false;
                    
                    // 匹配户型
                    if (roomType) {
                        const cleanRoomType = roomType.replace(/\(.*?\)/, '').trim();
                        const roomTypeMatched = 
                            (house.户型 && (house.户型.includes(cleanRoomType) || cleanRoomType.includes(house.户型))) ||
                            houseTags.some(tag => tag.includes(cleanRoomType) || cleanRoomType.includes(tag)) ||
                            (house.标题 && house.标题.includes(cleanRoomType));
                        if (roomTypeMatched) {
                            matchCount++;
                        }
                    }
                    
                    // 匹配朝向
                    if (orientation) {
                        const cleanOrientation = orientation.replace(/\(.*?\)/, '').trim();
                        const orientationMatched = 
                            (house.朝向 && (house.朝向.includes(cleanOrientation) || cleanOrientation.includes(house.朝向))) ||
                            houseTags.some(tag => tag.includes(cleanOrientation) || cleanOrientation.includes(tag));
                        if (orientationMatched) {
                            matchCount++;
                        }
                    }
                    
                    // 匹配租房类型
                    if (rentType) {
                        const cleanRentType = rentType.replace(/\(.*?\)/, '').trim();
                        const rentTypeMatched = 
                            (house.类型 && (house.类型.includes(cleanRentType) || cleanRentType.includes(house.类型))) ||
                            houseTags.some(tag => tag.includes(cleanRentType) || cleanRentType.includes(tag)) ||
                            (house.标题 && house.标题.includes(cleanRentType));
                        if (rentTypeMatched) {
                            matchCount++;
                        }
                    }
                    
                    // 匹配租期
                    if (rentDuration) {
                        const cleanRentDuration = rentDuration.replace(/\(.*?\)/, '').trim();
                        const rentDurationMatched = 
                            houseTags.some(tag => tag.includes(cleanRentDuration) || cleanRentDuration.includes(tag)) ||
                            (house.标题 && house.标题.includes(cleanRentDuration));
                        if (rentDurationMatched) {
                            matchCount++;
                        }
                    }
                    
                    // 匹配标签
                    if (tags && tags.length > 0) {
                        tags.forEach(tag => {
                            const cleanTag = tag.replace(/\(.*?\)/, '').trim();
                            const tagMatched = 
                                houseTags.some(houseTag => 
                                    houseTag.includes(cleanTag) || cleanTag.includes(houseTag)
                                ) ||
                                (house.标题 && house.标题.includes(cleanTag));
                            if (tagMatched) {
                                matchCount++;
                            }
                        });
                    }
                    
                    // 匹配租金
                    if (expectedRent) {
                        const housePriceStr = house.价格 || '';
                        const housePriceMatch = housePriceStr.match(/(\d+)元\/月/);
                        if (housePriceMatch) {
                            const housePrice = parseInt(housePriceMatch[1]);
                            const expectedPrice = parseInt(expectedRent);
                            const priceRange = expectedPrice * 0.1;
                            if (Math.abs(housePrice - expectedPrice) <= priceRange) {
                                matchCount++;
                            }
                        }
                    }
                    
                    // 匹配地址
                    if (companyAddress) {
                        const cleanAddress = companyAddress.replace(/\(.*?\)/, '').trim();
                        const addressMatched = 
                            (house.完整地址 && house.完整地址.includes(cleanAddress)) ||
                            (house.标题 && house.标题.includes(cleanAddress));
                        if (addressMatched) {
                            matchCount++;
                            hasAddressMatch = true;
                        }
                    }
                    
                    // 匹配面积区间
                    if (areaRange) {
                        const houseAreaStr = house.面积 || '';
                        const houseAreaMatch = houseAreaStr.match(/(\d+)平方米/);
                        if (houseAreaMatch) {
                            const houseArea = parseFloat(houseAreaMatch[1]);
                            let areaMatched = false;
                            
                            switch (areaRange) {
                                case '0-30':
                                    areaMatched = houseArea < 30;
                                    break;
                                case '30-50':
                                    areaMatched = houseArea >= 30 && houseArea < 50;
                                    break;
                                case '50-70':
                                    areaMatched = houseArea >= 50 && houseArea < 70;
                                    break;
                                case '70-90':
                                    areaMatched = houseArea >= 70 && houseArea < 90;
                                    break;
                                case '90-120':
                                    areaMatched = houseArea >= 90 && houseArea < 120;
                                    break;
                                case '120+':
                                    areaMatched = houseArea >= 120;
                                    break;
                            }
                            
                            if (areaMatched) {
                                matchCount++;
                            }
                        }
                    }
                    
                    // 计算匹配度百分比
                    const matchPercentage = (matchCount / totalFilters) * 100;
                    
                    return {
                        house,
                        matchCount,
                        matchPercentage,
                        hasAddressMatch
                    };
                });
                
                // 按区域>户型>价格的优先级排序
                housesWithMatch.sort((a, b) => {
                    // 1. 首先按地址匹配优先（区域）
                    if (companyAddress) {
                        if (a.hasAddressMatch && !b.hasAddressMatch) {
                            return -1;
                        }
                        if (!a.hasAddressMatch && b.hasAddressMatch) {
                            return 1;
                        }
                    }
                    
                    // 2. 其次按户型匹配优先
                    if (roomType) {
                        const aRoomTypeMatch = a.matchCount > 0 && (a.house.户型 && a.house.户型.includes(roomType.replace(/\(.*?\)/, '').trim()) || 
                            this.getHouseTags(a.house).some(tag => tag.includes(roomType.replace(/\(.*?\)/, '').trim())) ||
                            (a.house.标题 && a.house.标题.includes(roomType.replace(/\(.*?\)/, '').trim())));
                        const bRoomTypeMatch = b.matchCount > 0 && (b.house.户型 && b.house.户型.includes(roomType.replace(/\(.*?\)/, '').trim()) || 
                            this.getHouseTags(b.house).some(tag => tag.includes(roomType.replace(/\(.*?\)/, '').trim())) ||
                            (b.house.标题 && b.house.标题.includes(roomType.replace(/\(.*?\)/, '').trim())));
                        
                        if (aRoomTypeMatch && !bRoomTypeMatch) {
                            return -1;
                        }
                        if (!aRoomTypeMatch && bRoomTypeMatch) {
                            return 1;
                        }
                    }
                    
                    // 3. 然后按匹配度百分比排序
                    if (b.matchPercentage !== a.matchPercentage) {
                        return b.matchPercentage - a.matchPercentage;
                    }
                    
                    // 4. 如果匹配度相同，按匹配的条件数量排序
                    if (b.matchCount !== a.matchCount) {
                        return b.matchCount - a.matchCount;
                    }
                    
                    // 5. 最后按租金接近度排序（价格）
                    if (expectedRent) {
                        const aPriceMatch = a.house.价格 && a.house.价格.match(/(\d+)元\/月/);
                        const bPriceMatch = b.house.价格 && b.house.价格.match(/(\d+)元\/月/);
                        
                        if (aPriceMatch && bPriceMatch) {
                            const aPrice = parseInt(aPriceMatch[1]);
                            const bPrice = parseInt(bPriceMatch[1]);
                            const expectedPrice = parseInt(expectedRent);
                            
                            const aDiff = Math.abs(aPrice - expectedPrice);
                            const bDiff = Math.abs(bPrice - expectedPrice);
                            
                            if (aDiff !== bDiff) {
                                return aDiff - bDiff;
                            }
                        }
                    }
                    
                    return 0;
                });
                
                // 过滤出至少匹配一个条件的房源
                const filteredHouses = housesWithMatch
                    .filter(item => item.matchCount > 0)
                    .map(item => item.house);
                
                console.log('过滤后房源数量:', filteredHouses.length);
                
                // 如果没有匹配的房源，返回所有房源（避免"找不到房源"错误）
                if (filteredHouses.length === 0) {
                    console.log('没有匹配的房源，返回所有房源');
                    return houses;
                }
                
                return filteredHouses;
            },
            // 获取房源的标签列表（完全保留你原有的逻辑）
            getHouseTags(house) {
                const tags = [];
                
                // 从房源信息中提取标签
                if (house.装修) tags.push(house.装修);
                if (house.朝向) tags.push(house.朝向);
                if (house.类型) tags.push(house.类型);
                if (house.关键词) {
                    if (Array.isArray(house.关键词)) {
                        tags.push(...house.关键词);
                    } else if (typeof house.关键词 === 'string') {
                        tags.push(house.关键词);
                    }
                }
                
                // 处理标签中的括号内容
                return tags.map(tag => tag.replace(/\(.*?\)/, '').trim());
            },
            // 切换单选选项（支持再次点击取消，完全保留你原有的逻辑）
            toggleRadioOption(field, option) {
                if (this.formData[field] === option) {
                    // 如果已经选中，则取消选择
                    this.formData[field] = '';
                } else {
                    // 否则选中该选项
                    this.formData[field] = option;
                }
                // 触发筛选
                this.handleFilterChange();
            },
            // 实时过滤功能（完全保留你原有的逻辑）
            handleFilterChange() {
                // 保存筛选条件到localStorage
                this.saveFiltersToStorage();
                // 延迟执行，避免频繁请求
                clearTimeout(this.filterTimeout);
                this.filterTimeout = setTimeout(() => {
                    this.generateRecommendations();
                }, 500);
            },
            useMockData() {
                const mockHouses = [
                    {
                        id: 1,
                        标题: '阳光花园 - 精装两居室',
                        完整地址: '朝阳区望京街道',
                        价格: '4500元/月',
                        面积: '65平方米',
                        户型: '两居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 2,
                        标题: '万科城市花园 - 舒适三居',
                        完整地址: '海淀区中关村',
                        价格: '6800元/月',
                        面积: '95平方米',
                        户型: '三居',
                        楼层: '高层',
                        装修: '精装修',
                        朝向: '南北通透',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 3,
                        标题: '远洋山水 - 温馨一居',
                        完整地址: '丰台区方庄',
                        价格: '3200元/月',
                        面积: '45平方米',
                        户型: '一居',
                        楼层: '低层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 4,
                        标题: '保利香槟国际 - 豪华复式',
                        完整地址: '朝阳区 CBD',
                        价格: '8500元/月',
                        面积: '120平方米',
                        户型: '复式',
                        楼层: '高层',
                        装修: '豪华装修',
                        朝向: '南北通透',
                        类型: '公寓',
                        封面图URL: ''
                    },
                    {
                        id: 5,
                        标题: '首开璞瑅公馆 - 品质两居',
                        完整地址: '西城区金融街',
                        价格: '7200元/月',
                        面积: '75平方米',
                        户型: '两居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 6,
                        标题: '中信城 - 舒适三居',
                        完整地址: '东城区崇文门',
                        价格: '7800元/月',
                        面积: '88平方米',
                        户型: '三居',
                        楼层: '低层',
                        装修: '精装修',
                        朝向: '南北通透',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 7,
                        标题: '龙湖长楹天街 - 精装一居',
                        完整地址: '朝阳区常营',
                        价格: '3800元/月',
                        面积: '50平方米',
                        户型: '一居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '公寓',
                        封面图URL: ''
                    },
                    {
                        id: 8,
                        标题: '金地中心 - 高端公寓',
                        完整地址: '朝阳区建国门外',
                        价格: '9500元/月',
                        面积: '100平方米',
                        户型: '两居',
                        楼层: '高层',
                        装修: '豪华装修',
                        朝向: '南北通透',
                        类型: '公寓',
                        封面图URL: ''
                    },
                    {
                        id: 9,
                        标题: '远洋天著 - 花园洋房',
                        完整地址: '朝阳区望京',
                        价格: '8200元/月',
                        面积: '90平方米',
                        户型: '三居',
                        楼层: '低层',
                        装修: '精装修',
                        朝向: '南北通透',
                        类型: '花园洋房',
                        封面图URL: ''
                    },
                    {
                        id: 10,
                        标题: '万科金域蓝湾 - 精装两居',
                        完整地址: '丰台区丽泽桥',
                        价格: '5200元/月',
                        面积: '68平方米',
                        户型: '两居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: ''
                    }
                ];

                this.allRecommendedHouses = mockHouses; // 保存所有模拟推荐房源
                this.total = mockHouses.length;
                // 显示第一页数据
                const start = (this.currentPage - 1) * this.pageSize;
                const end = start + this.pageSize;
                this.recommendedHouses = this.allRecommendedHouses.slice(start, end);
                console.log('使用模拟数据，共:', this.total, '条，当前页显示:', this.recommendedHouses.length, '条');
            },
            changePage(page) {
                if (page < 1 || page > this.totalPages) {
                    return;
                }
                this.currentPage = page;
                // 使用保存的推荐数据进行前端分页
                this.isLoading = true;
                
                try {
                    // 从保存的所有推荐房源中获取当前页数据
                    const start = (this.currentPage - 1) * this.pageSize;
                    const end = start + this.pageSize;
                    this.recommendedHouses = this.allRecommendedHouses.slice(start, end);
                    console.log('分页加载成功，当前页:', this.currentPage, '数据范围:', start, '-', end, '数据长度:', this.recommendedHouses.length);
                } catch (error) {
                    console.error('分页加载失败:', error);
                    // 使用模拟数据作为备选
                    this.useMockDataForPage();
                } finally {
                    this.isLoading = false;
                    // 滚动到页面顶部
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },
            useMockDataForPage() {
                const mockHouses = [
                    {
                        id: 1,
                        标题: '阳光花园 - 精装两居室',
                        完整地址: '朝阳区望京街道',
                        价格: '4500元/月',
                        面积: '65平方米',
                        户型: '两居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 2,
                        标题: '万科城市花园 - 舒适三居',
                        完整地址: '海淀区中关村',
                        价格: '6800元/月',
                        面积: '95平方米',
                        户型: '三居',
                        楼层: '高层',
                        装修: '精装修',
                        朝向: '南北通透',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 3,
                        标题: '远洋山水 - 温馨一居',
                        完整地址: '丰台区方庄',
                        价格: '3200元/月',
                        面积: '45平方米',
                        户型: '一居',
                        楼层: '低层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 4,
                        标题: '保利香槟国际 - 豪华复式',
                        完整地址: '朝阳区 CBD',
                        价格: '8500元/月',
                        面积: '120平方米',
                        户型: '复式',
                        楼层: '高层',
                        装修: '豪华装修',
                        朝向: '南北通透',
                        类型: '公寓',
                        封面图URL: ''
                    },
                    {
                        id: 5,
                        标题: '首开璞瑅公馆 - 品质两居',
                        完整地址: '西城区金融街',
                        价格: '7200元/月',
                        面积: '75平方米',
                        户型: '两居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 6,
                        标题: '中信城 - 舒适三居',
                        完整地址: '东城区崇文门',
                        价格: '7800元/月',
                        面积: '88平方米',
                        户型: '三居',
                        楼层: '低层',
                        装修: '精装修',
                        朝向: '南北通透',
                        类型: '普通住宅',
                        封面图URL: ''
                    },
                    {
                        id: 7,
                        标题: '龙湖长楹天街 - 精装一居',
                        完整地址: '朝阳区常营',
                        价格: '3800元/月',
                        面积: '50平方米',
                        户型: '一居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '公寓',
                        封面图URL: ''
                    },
                    {
                        id: 8,
                        标题: '金地中心 - 高端公寓',
                        完整地址: '朝阳区建国门外',
                        价格: '9500元/月',
                        面积: '100平方米',
                        户型: '两居',
                        楼层: '高层',
                        装修: '豪华装修',
                        朝向: '南北通透',
                        类型: '公寓',
                        封面图URL: ''
                    },
                    {
                        id: 9,
                        标题: '远洋天著 - 花园洋房',
                        完整地址: '朝阳区望京',
                        价格: '8200元/月',
                        面积: '90平方米',
                        户型: '三居',
                        楼层: '低层',
                        装修: '精装修',
                        朝向: '南北通透',
                        类型: '花园洋房',
                        封面图URL: ''
                    },
                    {
                        id: 10,
                        标题: '万科金域蓝湾 - 精装两居',
                        完整地址: '丰台区丽泽桥',
                        价格: '5200元/月',
                        面积: '68平方米',
                        户型: '两居',
                        楼层: '中层',
                        装修: '精装修',
                        朝向: '朝南',
                        类型: '普通住宅',
                        封面图URL: ''
                    }
                ];

                const start = (this.currentPage - 1) * this.pageSize;
                const end = start + this.pageSize;
                this.recommendedHouses = mockHouses.slice(start, end);
            },
            toggleFavorite(houseId) {
                if (!window.Anju.globalState.currentUser) {
                    alert("请先登录");
                    window.Anju.globalState.showLoginModal = true;
                    return;
                }

                const username = window.Anju.globalState.currentUser.username;
                const house = this.recommendedHouses.find(h => h.id === houseId);
                if (!house) return;

                if (this.isFav(houseId)) {
                    window.Anju.removeFavorite(username, houseId);
                } else {
                    window.Anju.addFavorite(username, houseId);
                }
                // 强制重新渲染
                this.$forceUpdate();
            },
            isFav(houseId) {
                return window.Anju.globalState.currentUser && window.Anju.isFavorited(window.Anju.globalState.currentUser.username, houseId);
            },
            viewReport(houseId) {
                this.$router.push({
                    path: '/analysis',
                    query: {
                        id: houseId,
                        source: '/personalized'
                    }
                });
            },
            imageError(e) {
                console.error('图片加载失败:', e.target.src);
                e.target.src = 'https://via.placeholder.com/200x150?text=暂无图片';
            },
            // 截断文本，避免内容过长导致布局失衡
            truncateText(text, maxLength) {
                if (!text) return '';
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength) + '...';
            }
        }
    };

    window.Components = window.Components || {};
    window.Components.PersonalizedRecommendationPage = PersonalizedRecommendationPage;
})();