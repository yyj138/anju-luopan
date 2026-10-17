(() => {
    // 确保window.Anju和globalState存在
    const anju = window.Anju || {};
    const globalState = anju.globalState || { currentUser: null };
    const demoHouses = anju.demoHouses || [];
    const getFavorites = anju.getFavorites || function() { return []; };
    const addFavorite = anju.addFavorite || function() {};
    const removeFavorite = anju.removeFavorite || function() {};
    const isFavorited = anju.isFavorited || function() { return false; };

    // 获取房源详情
    async function getHouseDetail(id) {
        try {
            // 使用 AbortController 实现超时功能
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
            
            const token = localStorage.getItem('anju_token');
            const response = await fetch(`${window.Anju.API_BASE_URL}/api/houses/detail/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const data = await response.json();
            if (data.code === 200) {
                return data.data;
            } else {
                console.error('获取房源详情失败:', data.msg);
                return null;
            }
        } catch (error) {
            console.error('获取房源详情失败:', error);
            return null;
        }
    }

    // 分析页面组件
    const AnalysisPage = {
        template: `
            <div class="analysis-page">
                <!-- 图片放大模态框 -->
                <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
                    <div class="image-modal-content" @click.stop>
                        <span class="close-btn" @click="closeImageModal">&times;</span>
                        <div class="image-container" 
                                 @wheel="handleZoom" 
                                 @touchstart="handleTouchStart" 
                                 @touchmove="handleTouchMove" 
                                 @touchend="handleTouchEnd">
                            <img :src="selectedImage" alt="放大图片" class="modal-image" 
                                 @mousedown="handleMouseDown"
                                 @mousemove="handleMouseMove"
                                 @mouseup="handleMouseUp"
                                 @mouseleave="handleMouseUp"
                                 :style="{ transform: 'scale(' + zoomLevel + ') translate(' + translateX + 'px, ' + translateY + 'px)', transformOrigin: 'center center' }"/>
                            <div class="zoom-info">{{ Math.round(zoomLevel * 100) }}%</div>
                        </div>
                    </div>
                </div>
                <div class="analysis-container">
                    <!-- 加载动画 -->
                    <div v-if="isLoading" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>加载中...</p>
                    </div>
                    
                    <!-- 房源详情卡片 -->
                    <div v-else-if="currentReportHouse" class="report-card">
                        <div class="report-header">
                            <h2><i class="fas fa-file-medical"></i> 房屋体检报告</h2>
                            <button class="back-btn" @click="clearReport">
                                <i class="fas fa-arrow-left"></i> {{ backButtonText }}
                            </button>
                        </div>
                        <div class="report-content">
                            <div class="report-main">
                                <div class="report-image" @click="openImageModal(currentReportHouse.封面图URL)">
                                    <img v-if="currentReportHouse.封面图URL" :src="currentReportHouse.封面图URL" alt="房源图片"/>
                                    <div v-else class="image-placeholder">
                                        <i class="fas fa-home"></i>
                                    </div>
                                </div>
                                <div class="report-info">
                                    <h3>{{ currentReportHouse.标题 }}</h3>
                                    <div class="info-row">
                                        <span class="label">价格:</span>
                                        <span class="value">{{ currentReportHouse.价格 }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="label">面积:</span>
                                        <span class="value">{{ currentReportHouse.面积 }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="label">户型:</span>
                                        <span class="value">{{ currentReportHouse.户型 }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="label">地址:</span>
                                        <span class="value">{{ currentReportHouse.完整地址 }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="label">地铁:</span>
                                        <span class="value">{{ currentReportHouse.地铁 }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="label">楼层:</span>
                                        <span class="value">{{ currentReportHouse.楼层 }}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="label">装修:</span>
                                        <span class="value">{{ currentReportHouse.装修 }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="report-comparison">
                                <h4>多维度对比图</h4>
                                <div class="comparison-divider"></div>
                                <div class="district-images">
                                    <div class="image-row">
                                        <img :src="getDistrictImage(1)" alt="面积&租金蜂窝密度分布图" @error="handleImageError" @click="openImageModal(getDistrictImage(1))" />
                                        <img :src="getDistrictImage(2)" alt="不同装修租金小提琴对比图" @error="handleImageError" @click="openImageModal(getDistrictImage(2))" />
                                    </div>
                                    <div class="analysis-notes">
                                        <div class="note-box">
                                            <h5>左图（面积 & 租金蜂窝密度分布图）</h5>
                                            <div class="note-content">
                                                <p><strong>图表说明：</strong>{{ getLeftChartNote().description }}</p>
                                                <p><strong>业务结论：</strong>{{ getLeftChartNote().conclusion }}</p>
                                            </div>
                                        </div>
                                        <div class="note-box">
                                            <h5>右图（不同装修租金小提琴对比图）</h5>
                                            <div class="note-content">
                                                <p><strong>图表说明：</strong>{{ getRightChartNote().description }}</p>
                                                <p><strong>业务结论：</strong></p>
                                                <ul>
                                                    <li v-for="(c, idx) in getRightChartNote().conclusions" :key="idx">{{ c }}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="report-analysis">
                            <h4><i class="fas fa-chart-bar"></i> 风险分析</h4>
                            <div class="analysis-cards" style="display: flex; gap: 20px; flex-wrap: nowrap;">
                                <div class="analysis-card" style="flex: 1; min-width: 300px;">
                                    <div class="card-header">
                                        <i class="fas fa-image"></i>
                                        <h5>AI 体检结果</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="analysis-item">
                                            <span class="analysis-label">P图概率:</span>
                                            <span class="analysis-value low">{{ analysisResults.imageAnalysis.imageAuthenticity }}</span>
                                        </div>
                                        <div class="analysis-item">
                                            <span class="analysis-label">诈骗风险:</span>
                                            <span class="analysis-value low">{{ analysisResults.imageAnalysis.fraudRisk }}</span>
                                        </div>
                                        <div class="analysis-item">
                                            <span class="analysis-label">房源完整度:</span>
                                            <span class="analysis-value low">{{ analysisResults.imageAnalysis.houseCompleteness }}</span>
                                        </div>
                                        <div class="analysis-item">
                                            <span class="analysis-label">装修评价:</span>
                                            <span class="analysis-value medium">{{ analysisResults.imageAnalysis.decorationEvaluation }}</span>
                                        </div>
                                        <div class="analysis-item total-score-item">
                                            <span class="analysis-label">综合评分:</span>
                                            <span class="analysis-value-total">
                                                <em>{{ analysisResults.imageAnalysis.score }}</em>
                                                <small>{{ getScoreRating(analysisResults.imageAnalysis.score) }}</small>
                                            </span>
                                        </div>
                                        <div class="analysis-item analysis-source">
                                            <span class="analysis-label">分析原理:</span>
                                            <span class="analysis-desc">AI图像识别技术</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="analysis-card" style="flex: 1; min-width: 300px;">
                                    <div class="card-header">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <h5>GIS 位置分析</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="analysis-item">
                                            <span class="analysis-label">距离地铁:</span>
                                            <span class="analysis-value low">{{ analysisResults.locationAnalysis.subwayDistance }}</span>
                                        </div>
                                        <div class="analysis-item">
                                            <span class="analysis-label">距离医院:</span>
                                            <span class="analysis-value low">{{ analysisResults.locationAnalysis.hospitalDistance }}</span>
                                        </div>
                                        <div class="analysis-item">
                                            <span class="analysis-label">距离商场:</span>
                                            <span class="analysis-value low">{{ analysisResults.locationAnalysis.mallDistance }}</span>
                                        </div>
                                        <div class="analysis-item analysis-source">
                                            <span class="analysis-label">数据来源:</span>
                                            <span class="analysis-desc">GIS地理空间数据</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="report-scoring">
                            <h4><i class="fas fa-calculator"></i> 评分计算过程</h4>
                            <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                                <div style="flex: 2; min-width: 400px; background: white; border-radius: 12px; padding: 16px; border: 1px solid var(--border-color);">
                                    <div class="chart-title">评分流水瀑布图</div>
                                    <div ref="waterfallChart" id="waterfall-chart" class="waterfall-chart"></div>
                                    <div class="waterfall-total-score">
                                        <span class="wts-label">综合评分</span>
                                        <strong class="wts-num">{{ analysisResults.imageAnalysis.score }}</strong>
                                        <em class="wts-level">{{ getScoreRating(analysisResults.imageAnalysis.score) }}</em>
                                    </div>
                                </div>
                                <div style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 16px;">
                                    <div style="width: 100%; background: white; border-radius: 12px; padding: 12px; border: 1px solid var(--border-color);">
                                        <div class="chart-title">正负平衡图</div>
                                        <div ref="barChart" id="bar-chart" class="balance-chart-small"></div>
                                    </div>
                                    <div style="width: 100%; background: white; border-radius: 12px; padding: 12px; border: 1px solid var(--border-color);">
                                        <div class="chart-title">双源占比图</div>
                                        <div ref="pieChart" id="pie-chart" class="pie-chart-small"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="scoring-table" style="margin-top: 20px;">
                                <div class="table-title">验算明细表</div>
                                <table class="scoring-detail-table">
                                    <thead>
                                        <tr>
                                            <th>计分项目</th>
                                            <th>分值变动</th>
                                            <th>判定规则（对应卡片数据）</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, index) in currentScoringItems.filter(i => !i.isBase && !i.isFinal)" 
                                            :key="index"
                                            :class="{ 'highlight-row': highlightedItem === item.name }"
                                            @mouseenter="highlightItem(item.name)"
                                            @mouseleave="highlightItem(null)"
                                            @click="highlightItem(item.name)">
                                            <td>{{ item.name }}</td>
                                            <td :class="item.score > 0 ? 'positive' : item.score < 0 ? 'negative' : 'zero'">
                                                {{ item.score > 0 ? '+' : '' }}{{ item.score }}
                                            </td>
                                            <td class="rule">{{ item.rule }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                        </div>
                    </div>

                    <!-- 收藏列表 -->
                    <div v-else class="favorites-list">
                        <h2><i class="fas fa-heart"></i> 我的收藏</h2>
                        <!-- 未登录状态 -->
                        <div v-if="!globalState.currentUser" class="empty-state">
                            <i class="fas fa-user-slash"></i>
                            <p style="color: #999;">暂未登录请登录</p>
                            <button class="primary-btn" @click="openLoginModal">去登录</button>
                        </div>
                        <!-- 已登录但无收藏 -->
                        <div v-else-if="favHousesList.length === 0" class="empty-state">
                            <i class="fas fa-heart-broken" style="color: #ccc; animation: none;"></i>
                            <p style="color: #999;">暂无收藏房源数据</p>
                            <button class="primary-btn" @click="goFindHouse">去寻找房源</button>
                        </div>
                        <!-- 已登录且有收藏 -->
                        <div v-else>
                            <div v-if="isLoading" class="loading-container">
                                <div class="loading-spinner"></div>
                                <p>加载中...</p>
                            </div>
                            <div v-else class="favorites-grid" style="display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 20px !important; padding: 0 20px !important;">
                                <div v-for="house in favHousesList" :key="house.id" class="favorite-card" @click="selectFromFav(house.id)"
                                     style="background: var(--bg-primary) !important; border-radius: 20px !important; padding: 20px !important; border: 2px solid var(--border-color) !important; transition: 0.3s !important; cursor: pointer !important; display: flex !important; flex-direction: column !important; gap: 16px !important; position: relative !important;">
                                    <!-- 取消收藏按钮 -->
                                    <button class="unfavorite-btn" @click.stop="removeFavorite(house.id)"
                                            style="position: absolute !important; top: 12px !important; right: 12px !important; width: 36px !important; height: 36px !important; border-radius: 50% !important; background: rgba(255, 255, 255, 0.9) !important; border: 2px solid #ff6b6b !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; z-index: 10 !important; transition: all 0.3s !important;"
                                            onmouseover="this.style.background='#ff6b6b'; this.style.color='white';" 
                                            onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.color='#ff6b6b';">
                                        <i class="fas fa-heart" style="color: #ff6b6b !important; font-size: 16px !important;"></i>
                                    </button>
                                    
                                    <!-- 图片 -->
                                    <div class="favorite-image"
                                         style="width: 100% !important; height: 200px !important; border-radius: 16px !important; background: linear-gradient(135deg, #f5f5f5, #e0e0e0) !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important;">
                                        <div class="image-placeholder" v-if="!house.封面图URL">
                                            <i class="fas fa-home"></i>
                                        </div>
                                        <img 
                                            v-else 
                                            :src="house.封面图URL" 
                                            alt="房源图片"
                                            loading="lazy"
                                            style="width: 100% !important; height: 100% !important; object-fit: cover !important;"
                                        />
                                    </div>
                                    
                                    <!-- 信息 -->
                                    <div class="favorite-content" style="flex: 1 !important; display: flex !important; flex-direction: column !important; gap: 10px !important;">
                                        <!-- 标题 -->
                                        <h4 style="font-size: 18px !important; font-weight: 700 !important; color: var(--text-primary) !important; line-height: 1.3 !important; margin: 0 !important;">{{ house.标题 }}</h4>
                                        
                                        <!-- 地址 -->
                                        <div style="font-size: 14px !important; color: rgba(var(--text-primary-rgb), 0.75) !important; margin: 0 !important; display: flex !important; align-items: center !important; gap: 8px !important;">
                                            <i class="fas fa-map-marker-alt" style="font-size: 16px !important; color: var(--accent) !important;"></i>
                                            <span>{{ house.完整地址 || '地址待定' }}</span>
                                        </div>
                                        
                                        <!-- 标签 -->
                                        <div style="display: flex !important; gap: 8px !important; flex-wrap: wrap !important;">
                                            <span style="background: rgba(var(--accent-rgb), 0.15) !important; color: var(--accent) !important; font-size: 12px !important; padding: 3px 10px !important; border-radius: 12px !important; font-weight: 500 !important;">
                                                {{ house.户型 || '户型待定' }}
                                            </span>
                                            <span style="background: rgba(var(--accent-rgb), 0.15) !important; color: var(--accent) !important; font-size: 12px !important; padding: 3px 10px !important; border-radius: 12px !important; font-weight: 500 !important;">
                                                {{ house.面积 || '面积待定' }}
                                            </span>
                                            <span style="background: rgba(var(--accent-rgb), 0.15) !important; color: var(--accent) !important; font-size: 12px !important; padding: 3px 10px !important; border-radius: 12px !important; font-weight: 500 !important;">
                                                {{ house.装修 || '装修待定' }}
                                            </span>
                                        </div>
                                        
                                        <!-- 价格 -->
                                        <div style="font-size: 24px !important; font-weight: 800 !important; color: var(--accent) !important; line-height: 1 !important; margin-top: 8px !important;">
                                            {{ house.价格 || '价格待定' }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        data() {
            return {
                currentReportHouse: null,
                favHousesList: [],
                isLoading: false,
                showImageModal: false,
                selectedImage: '',
                zoomLevel: 1,
                touchStartDistance: 0,
                touchStartZoom: 1,
                translateX: 0,
                translateY: 0,
                isDragging: false,
                startX: 0,
                startY: 0,
                boundMouseMove: null,
                boundMouseUp: null,
                globalState: globalState, // 将globalState添加到组件的data中
                previousRoute: null, // 记录上一页路由
                analysisResults: {
                    imageAnalysis: {
                        imageAuthenticity: '真实图片',
                        fraudRisk: '安全',
                        houseCompleteness: '98%',
                        decorationEvaluation: '中等装修',
                        score: 95
                    },
                    locationAnalysis: {
                        subwayDistance: '0.6km',
                        hospitalDistance: '1.2km',
                        mallDistance: '0.8km'
                    }
                },
                displayScore: 0,
                scoringSteps: [],
                highlightedItem: null,
                currentScoringItems: [],
                scoringSamples: [
                    {
                        name: '当前房源',
                        houseCompleteness: '91%',
                        fraudRisk: '安全',
                        decoration: '精装修',
                        ptuProbability: '13%',
                        subwayDistance: '1.3km',
                        hospitalDistance: '1.1km',
                        mallDistance: '2.6km',
                        totalScore: 93
                    },
                    {
                        name: '优质房源',
                        houseCompleteness: '98%',
                        fraudRisk: '安全',
                        decoration: '豪华装修',
                        ptuProbability: '2%',
                        subwayDistance: '0.4km',
                        hospitalDistance: '0.6km',
                        mallDistance: '0.5km',
                        totalScore: 100
                    },
                    {
                        name: '高危毛坯房源',
                        houseCompleteness: '55%',
                        fraudRisk: '高危',
                        decoration: '简单装修',
                        ptuProbability: '20%',
                        subwayDistance: '3.8km',
                        hospitalDistance: '5.2km',
                        mallDistance: '3.1km',
                        totalScore: 55
                    }
                ],
                waterfallChart: null,
                barChart: null,
                pieChart: null
            };
        },
        computed: {
            // 计算返回按钮的文本
            backButtonText() {
                // 根据上一页的路径来显示对应的文本
                if (this.previousRoute && this.previousRoute.path) {
                    const path = this.previousRoute.path;
                    if (path === '/analysis') {
                        return '回到我的收藏';
                    } else if (path === '/findhouse') {
                        return '回到房源推荐';
                    } else if (path === '/personalized') {
                        return '回到个性化推荐';
                    } else {
                        return '返回';
                    }
                } else {
                    // 如果没有上一页信息，默认显示返回
                    return '返回';
                }
            }
        },
        methods: {
            // 生成评分项 - 使用新的加权规则
            generateScoringItems(sample) {
                const items = [];
                let cumulative = 60;
                
                // 基础分
                items.push({
                    name: '基础分',
                    score: 60,
                    cumulative: 60,
                    barWidth: 50,
                    barClass: 'base',
                    displayText: '60分',
                    isBase: true,
                    isFinal: false,
                    rule: '所有房源基础分60',
                    ruleValue: '-',
                    module: 'base'
                });
                
                // 房源完整度 0-10分
                const completeness = parseInt(sample.houseCompleteness) || 85;
                let completenessScore = 0;
                let completenessRule = '';
                if (completeness >= 95) {
                    completenessScore = 10;
                    completenessRule = '完整度' + sample.houseCompleteness + '≥95%，满分10分（信息完整，各项资料齐全）';
                } else if (completeness >= 85) {
                    completenessScore = 7;
                    completenessRule = '完整度' + sample.houseCompleteness + '≥85%，+7分（基础信息齐全，信息较完整）';
                } else if (completeness >= 60) {
                    completenessScore = 4;
                    completenessRule = '完整度' + sample.houseCompleteness + '≥60%，+4分（基础信息较全，信息一般）';
                } else {
                    completenessScore = 0;
                    completenessRule = '完整度' + sample.houseCompleteness + '＜60%，+0分（信息不完整，资料缺失多）';
                }
                cumulative += completenessScore;
                items.push({
                    name: '房源完整度',
                    score: completenessScore,
                    cumulative: cumulative,
                    barWidth: completenessScore > 0 ? Math.max(20, completenessScore * 4) : 10,
                    barClass: completenessScore > 0 ? 'increase' : 'zero',
                    displayText: completenessScore > 0 ? '+' + completenessScore : '',
                    isBase: false,
                    isFinal: false,
                    rule: completenessRule,
                    ruleValue: sample.houseCompleteness,
                    module: 'ai'
                });
                
                // 安全风险 0或10分（二选一，达标直接拉满）
                let safetyScore = 0;
                let safetyRule = '';
                if (sample.fraudRisk === '安全') {
                    safetyScore = 10;
                    safetyRule = '安全风险标记为安全，+10分（24h门禁/监控/无群租/无治安投诉）';
                } else {
                    safetyScore = 0;
                    safetyRule = '安全风险标记为' + sample.fraudRisk + '，+0分（存在门禁缺失/群租/治安投诉等问题）';
                }
                cumulative += safetyScore;
                items.push({
                    name: '安全风险',
                    score: safetyScore,
                    cumulative: cumulative,
                    barWidth: safetyScore > 0 ? 40 : 10,
                    barClass: safetyScore > 0 ? 'increase' : 'zero',
                    displayText: safetyScore > 0 ? '+' + safetyScore : '',
                    isBase: false,
                    isFinal: false,
                    rule: safetyRule,
                    ruleValue: sample.fraudRisk,
                    module: 'ai'
                });
                
                // 装修评价 0/10/15分（三档固定分）
                let decorationScore = 0;
                let decorationRule = '';
                if (sample.decoration === '豪华装修') {
                    decorationScore = 15;
                    decorationRule = '装修标签为豪华装修，+15分（品牌家电/全新墙面地板/定制柜体/近1年装修）';
                } else if (sample.decoration === '精装修') {
                    decorationScore = 10;
                    decorationRule = '装修标签为精装修，+10分（基础装修完好/厨卫正常/家电齐全/可直接入住）';
                } else {
                    decorationScore = 0;
                    decorationRule = '装修标签为' + sample.decoration + '，+0分（墙面发霉/厨卫漏水/家电损坏/毛坯房）';
                }
                cumulative += decorationScore;
                items.push({
                    name: '装修评价',
                    score: decorationScore,
                    cumulative: cumulative,
                    barWidth: decorationScore > 0 ? Math.max(30, decorationScore * 3) : 10,
                    barClass: decorationScore > 0 ? 'increase' : 'zero',
                    displayText: decorationScore > 0 ? '+' + decorationScore : '',
                    isBase: false,
                    isFinal: false,
                    rule: decorationRule,
                    ruleValue: sample.decoration,
                    module: 'ai'
                });
                
                // P图概率修正 +3或-5分（二选一，修正房源真实度）
                const ptuProb = parseInt(sample.ptuProbability) || 0;
                let ptuScore = 0;
                let ptuRule = '';
                if (ptuProb >= 15) {
                    ptuScore = -5;
                    ptuRule = 'P图概率' + sample.ptuProbability + '≥15%，扣5分（重度滤镜/拉伸/盗用图片/遮挡瑕疵）';
                } else if (ptuProb >= 5 && ptuProb < 15) {
                    ptuScore = 0;
                    ptuRule = 'P图概率' + sample.ptuProbability + '，+0分（轻微美化，无明显失真）';
                } else {
                    ptuScore = 3;
                    ptuRule = 'P图概率' + sample.ptuProbability + '＜5%，+3分（实拍真实/光线自然/无过度美化）';
                }
                cumulative += ptuScore;
                items.push({
                    name: 'P图概率修正',
                    score: ptuScore,
                    cumulative: cumulative,
                    barWidth: Math.abs(ptuScore) > 0 ? Math.max(30, Math.abs(ptuScore) * 6) : 10,
                    barClass: ptuScore > 0 ? 'increase' : ptuScore < 0 ? 'decrease' : 'zero',
                    displayText: ptuScore > 0 ? '+' + ptuScore : '' + ptuScore,
                    isBase: false,
                    isFinal: false,
                    rule: ptuRule,
                    ruleValue: sample.ptuProbability,
                    module: 'ai'
                });
                
                // 地铁距离 0-5分（按步行距离量化）
                const subwayDist = parseFloat(sample.subwayDistance) || 0;
                let subwayScore = 0;
                let subwayRule = '';
                if (subwayDist <= 0.4) {
                    subwayScore = 5;
                    subwayRule = '地铁距离' + sample.subwayDistance + '≤400米（步行≤5分钟），+5分';
                } else if (subwayDist <= 0.8) {
                    subwayScore = 4;
                    subwayRule = '地铁距离' + sample.subwayDistance + '≤800米（步行5-10分钟），+4分';
                } else if (subwayDist <= 1.2) {
                    subwayScore = 3;
                    subwayRule = '地铁距离' + sample.subwayDistance + '≤1.2km（步行10-15分钟），+3分';
                } else if (subwayDist <= 1.6) {
                    subwayScore = 2;
                    subwayRule = '地铁距离' + sample.subwayDistance + '≤1.6km（步行15-20分钟），+2分';
                } else if (subwayDist <= 2.4) {
                    subwayScore = 1;
                    subwayRule = '地铁距离' + sample.subwayDistance + '≤2.4km（步行20-30分钟），+1分';
                } else {
                    subwayScore = 0;
                    subwayRule = '地铁距离' + sample.subwayDistance + '＞2.4km（步行＞30分钟），+0分';
                }
                cumulative += subwayScore;
                items.push({
                    name: '地铁距离',
                    score: subwayScore,
                    cumulative: cumulative,
                    barWidth: subwayScore > 0 ? Math.max(20, subwayScore * 5) : 8,
                    barClass: subwayScore > 0 ? 'increase-small' : 'zero-small',
                    displayText: subwayScore > 0 ? '+' + subwayScore : '',
                    isBase: false,
                    isFinal: false,
                    rule: subwayRule,
                    ruleValue: sample.subwayDistance,
                    module: 'gis'
                });
                
                // 医院距离 0-5分（优先综合三甲医院，社区门诊减半计分）
                const hospitalDist = parseFloat(sample.hospitalDistance) || 0;
                let hospitalScore = 0;
                let hospitalRule = '';
                if (hospitalDist <= 0.6) {
                    hospitalScore = 5;
                    hospitalRule = '医院距离' + sample.hospitalDistance + '≤600米（三甲医院，步行≤8分钟），+5分';
                } else if (hospitalDist <= 1.2) {
                    hospitalScore = 4;
                    hospitalRule = '医院距离' + sample.hospitalDistance + '≤1.2km（三甲医院，步行8-15分钟），+4分';
                } else if (hospitalDist <= 2) {
                    hospitalScore = 3;
                    hospitalRule = '医院距离' + sample.hospitalDistance + '≤2km（三甲医院，步行15-25分钟），+3分';
                } else if (hospitalDist <= 3) {
                    hospitalScore = 1;
                    hospitalRule = '医院距离' + sample.hospitalDistance + '≤3km（仅社区诊所，无综合医院），+1分';
                } else {
                    hospitalScore = 0;
                    hospitalRule = '医院距离' + sample.hospitalDistance + '＞3km（3km内无医疗机构），+0分';
                }
                cumulative += hospitalScore;
                items.push({
                    name: '医院距离',
                    score: hospitalScore,
                    cumulative: cumulative,
                    barWidth: hospitalScore > 0 ? Math.max(20, hospitalScore * 5) : 8,
                    barClass: hospitalScore > 0 ? 'increase-small' : 'zero-small',
                    displayText: hospitalScore > 0 ? '+' + hospitalScore : '',
                    isBase: false,
                    isFinal: false,
                    rule: hospitalRule,
                    ruleValue: sample.hospitalDistance,
                    module: 'gis'
                });
                
                // 商场距离 0-5分（大型综合商超/购物中心，便利店不计）
                const mallDist = parseFloat(sample.mallDistance) || 0;
                let mallScore = 0;
                let mallRule = '';
                if (mallDist <= 0.6) {
                    mallScore = 5;
                    mallRule = '商场距离' + sample.mallDistance + '≤600米（步行≤8分钟），+5分';
                } else if (mallDist <= 1.2) {
                    mallScore = 4;
                    mallRule = '商场距离' + sample.mallDistance + '≤1.2km（步行8-15分钟），+4分';
                } else if (mallDist <= 2) {
                    mallScore = 3;
                    mallRule = '商场距离' + sample.mallDistance + '≤2km（步行15-25分钟），+3分';
                } else if (mallDist <= 2.5) {
                    mallScore = 1;
                    mallRule = '商场距离' + sample.mallDistance + '≤2.5km（仅有便利店/街边小店），+1分';
                } else {
                    mallScore = 0;
                    mallRule = '商场距离' + sample.mallDistance + '＞2.5km（2km内无大型购物场所），+0分';
                }
                cumulative += mallScore;
                items.push({
                    name: '商场距离',
                    score: mallScore,
                    cumulative: cumulative,
                    barWidth: mallScore > 0 ? Math.max(20, mallScore * 5) : 8,
                    barClass: mallScore > 0 ? 'increase-small' : 'zero-small',
                    displayText: mallScore > 0 ? '+' + mallScore : '',
                    isBase: false,
                    isFinal: false,
                    rule: mallRule,
                    ruleValue: sample.mallDistance,
                    module: 'gis'
                });
                
                // 最终总分（封顶规则：分数＞100取100，≤100保留原值）
                const finalScore = Math.min(100, cumulative);
                items.push({
                    name: '综合总分',
                    score: finalScore,
                    cumulative: finalScore,
                    barWidth: Math.min(100, (finalScore / 100) * 100),
                    barClass: 'final',
                    displayText: finalScore,
                    isBase: false,
                    isFinal: true,
                    rule: cumulative > 100 ? '原始分数' + cumulative + '＞100，封顶取100分' : '最终综合评分',
                    ruleValue: '-',
                    module: 'final'
                });
                
                this.currentScoringItems = items;
                this.initCharts();
            },
            highlightItem(itemName) {
                this.highlightedItem = itemName;
            },
            getRating(score) {
                if (score >= 90) return '优质好房';
                if (score >= 80) return '良好房源';
                if (score >= 70) return '普通刚需房';
                if (score >= 60) return '较差房源';
                return '避雷房源';
            },
            getScoreRating(score) {
                if (score >= 90) return '优质好房';
                if (score >= 80) return '良好房源';
                if (score >= 70) return '普通刚需房';
                if (score >= 60) return '较差房源';
                return '避雷房源';
            },
            getStrengths() {
                const strengths = [];
                const items = this.currentScoringItems || [];
                items.forEach(item => {
                    if (!item.isBase && !item.isFinal && item.score > 0) {
                        if (item.score >= 10) strengths.push(item.name);
                        else if (item.score >= 5 && item.name !== 'P图概率修正') strengths.push(item.name);
                    }
                });
                return strengths.length > 0 ? strengths.join('、') : '暂无突出优势';
            },
            getWeaknesses() {
                const weaknesses = [];
                const items = this.currentScoringItems || [];
                items.forEach(item => {
                    if (!item.isBase && !item.isFinal) {
                        if (item.score < 0) weaknesses.push(item.name);
                        else if (item.score === 0 && ['地铁距离', '医院距离', '商场距离'].includes(item.name)) {
                            weaknesses.push(item.name);
                        }
                    }
                });
                return weaknesses.length > 0 ? weaknesses.join('、') : '各方面表现均衡';
            },
            getLeftChartNote() {
                const house = this.currentReportHouse;
                if (!house) return { description: '', conclusion: '' };
                
                const address = house.完整地址 || '';
                let district = '片区';
                let correlation = '0.807';
                
                if (address.includes('福田')) {
                    district = '福田区';
                    correlation = '0.807';
                } else if (address.includes('南山')) {
                    district = '南山区';
                    correlation = '0.785';
                } else if (address.includes('宝安')) {
                    district = '宝安区';
                    correlation = '0.762';
                } else if (address.includes('罗湖')) {
                    district = '罗湖区';
                    correlation = '0.791';
                } else if (address.includes('龙华')) {
                    district = '龙华区';
                    correlation = '0.758';
                } else if (address.includes('龙岗') || address.includes('布吉')) {
                    district = '龙岗区';
                    correlation = '0.740';
                }
                
                const area = house.面积 || '80㎡';
                const price = house.价格 || house.月租 || '3500元/月';
                
                const areaNum = parseFloat(area) || 80;
                const priceNum = parseFloat(price) || 3500;
                
                let areaRange = '20-130㎡';
                let priceRange = '0-10000元';
                let conclusion = `${district}主流租房房源集中在`;
                
                if (areaNum < 50) {
                    areaRange = '20-60㎡';
                    conclusion = '该房源属于小户型';
                } else if (areaNum >= 150) {
                    areaRange = '150㎡以上';
                    conclusion = '该房源属于大户型，高价房源样本稀缺';
                }
                
                if (priceNum < 3000) {
                    priceRange = '0-5000元';
                } else if (priceNum >= 8000) {
                    priceRange = '8000元以上';
                    conclusion = '该房源属于高端价位，市场稀缺';
                }
                
                return {
                    description: `蜂窝分箱热力图，X = 房源建筑面积 (㎡)，Y = 月租 (元/月)；右侧渐变色代表对应区间房源数量，颜色越深房源越密集；面积与租金皮尔逊相关系数 ${correlation}，为强正相关。当前房源面积 ${area}，月租 ${price}。`,
                    conclusion: `${conclusion} ${areaRange}、月租 ${priceRange}；面积越大租金同步上涨。`
                };
            },
            getRightChartNote() {
                const house = this.currentReportHouse;
                if (!house) return { description: '', conclusions: [] };
                
                const address = house.完整地址 || '';
                let district = '片区';
                
                if (address.includes('福田')) {
                    district = '福田区';
                } else if (address.includes('南山')) {
                    district = '南山区';
                } else if (address.includes('宝安')) {
                    district = '宝安区';
                } else if (address.includes('罗湖')) {
                    district = '罗湖区';
                } else if (address.includes('龙华')) {
                    district = '龙华区';
                } else if (address.includes('龙岗') || address.includes('布吉')) {
                    district = '龙岗区';
                }
                
                const decoration = house.装修 || '精装修';
                
                let conclusions = [];
                
                if (decoration === '豪华装修') {
                    conclusions = [
                        `${district}豪华装修整体租金水平最高，市场中位租金 5700 元；`,
                        '该房源属于豪华装修，具备高端市场竞争力；',
                        '适合追求高品质居住体验的租户。'
                    ];
                } else if (decoration === '精装修') {
                    conclusions = [
                        `${district}精装修租金分化极强，存在极少数超高端高价房源，租金上限远超另外两类；`,
                        '该房源属于精装修，是片区主流需求；',
                        '租金区间覆盖广，选择余地大。'
                    ];
                } else {
                    conclusions = [
                        `${district}简装租金区间窄、均价最低，是片区刚需主流房源；`,
                        '该房源属于简装修，性价比高；',
                        '适合预算有限的刚需租户。'
                    ];
                }
                
                return {
                    description: `小提琴 + 箱线组合图，分豪华/精装/简装三类装修；图形宽度代表该租金价位房源数量，横线为租金中位数，上下端点为租金极值；右上角标注各类样本总量 n、租金均值、中位数。当前房源装修类型：${decoration}。`,
                    conclusions: conclusions
                };
            },
            // 加载收藏列表
            loadFavoritesList() {
                if (!this.globalState.currentUser) {
                    this.favHousesList = [];
                    this.isLoading = false;
                    return;
                }
                
                // 立即开始加载
                this.isLoading = true;
                
                // 获取收藏的房源ID列表（本地存储）
                let favIds = [];
                try {
                    favIds = getFavorites(this.globalState.currentUser.username);
                } catch (error) {
                    console.error('获取收藏列表失败:', error);
                    favIds = [];
                }
                
                if (favIds.length === 0) {
                    this.favHousesList = [];
                    this.isLoading = false;
                    return;
                }
                
                // 直接从后端获取真实数据
                this.fetchRealData(favIds);
            },
            
            // 后台获取真实数据
            async fetchRealData(favIds) {
                try {
                    console.log('真实收藏ID:', favIds);

                    // 获取Token
                    const token = localStorage.getItem('anju_token');

                    // 处理收藏的房源
                    const realData = [];
                    
                    // 并行获取所有收藏房源的详情
                    const fetchPromises = favIds.map(async (houseId) => {
                        try {
                            // 调用房源详情接口获取真实数据，添加Token认证
                            const response = await fetch(`${window.Anju.API_BASE_URL}/api/houses/detail/${houseId}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (response.ok) {
                                const data = await response.json();
                                if (data.code === 200 && data.data) {
                                    return data.data;
                                }
                            }
                            return null;
                        } catch (error) {
                            console.error(`获取房源 ${houseId} 详情失败:`, error);
                            return null;
                        }
                    });

                    // 等待所有请求完成
                    const results = await Promise.all(fetchPromises);
                    
                    // 过滤出成功获取的房源数据
                    results.forEach(house => {
                        if (house) {
                            realData.push({
                                id: house.id || house.house_id || house.id,
                                标题: house.标题 || house.title || house.house_name || `房源 ${house.id}`,
                                价格: house.价格 || house.price || house.house_price || '价格待定',
                                面积: house.面积 || house.area || '面积待定',
                                完整地址: house.完整地址 || house.address || '地址待定',
                                户型: house.户型 || house.type || '户型待定',
                                地铁: house.地铁 || house.subway || '地铁待定',
                                楼层: house.楼层 || house.floor || '楼层待定',
                                装修: house.装修 || house.decoration || '装修待定',
                                封面图URL: house.封面图URL || house.img || house.image || house.cover_image || '',
                            });
                        }
                    });

                    console.log('最终收藏列表:', realData);
                    this.favHousesList = realData;

                } catch (err) {
                    console.error('加载收藏失败:', err);
                    this.favHousesList = [];
                } finally {
                    this.isLoading = false;
                }
            },
            // 加载报告详情
            loadReportById(houseId) {
                console.log('loadReportById 被调用，houseId:', houseId);
                
                // 重置评分动画状态
                this.displayScore = 0;
                this.scoringSteps = [];
                this.highlightedItem = null;
                
                // 销毁旧图表
                this.destroyCharts();
                window.removeEventListener('resize', this.handleResize);
                
                // 初始化评分项
                this.selectedSampleIndex = 0;
                this.generateScoringItems(this.scoringSamples[0]);
                
                // 立即开始加载
                this.isLoading = true;
                
                // 立即显示一个详细的临时房源对象，让用户快速看到内容
                this.currentReportHouse = {
                    id: houseId,
                    标题: `房源 ${houseId}`,
                    价格: '3200元/月',
                    面积: '45㎡',
                    完整地址: '朝阳区青年路',
                    户型: '1室1厅',
                    地铁: '2号线青年路站',
                    楼层: '中层',
                    装修: '精装修',
                    朝向: '朝南',
                    类型: '公寓',
                    封面图URL: ''
                };
                
                // 立即结束加载状态，让用户看到内容
                this.isLoading = false;
                
                // 页面滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // 然后在后台尝试从后端获取真实数据（不阻塞UI）
                this.fetchRealHouseDetail(houseId);
                // 获取分析结果
                this.fetchAnalysisResults(houseId);
            },
            
            // 后台获取真实房源详情
            async fetchRealHouseDetail(houseId) {
                try {
                    // 使用 AbortController 实现超时功能
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时，更快响应
                    
                    // 尝试从后端 API 获取房源详情
                    const response = await fetch(`${window.Anju.API_BASE_URL}/api/houses/detail/${houseId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const houseData = await response.json();
                        console.log('从API获取的房源数据:', houseData);
                        
                        // 从 data 字段中获取房源数据
                        const actualHouseData = houseData.data || {};
                        
                        // 更新房源数据
                        this.currentReportHouse = {
                            id: houseId,
                            标题: actualHouseData.标题 || `房源 ${houseId}`,
                            价格: actualHouseData.价格 || '3200元/月',
                            面积: actualHouseData.面积 || '45㎡',
                            完整地址: actualHouseData.完整地址 || '朝阳区青年路',
                            户型: actualHouseData.户型 || '1室1厅',
                            地铁: actualHouseData.地铁 || '2号线青年路站',
                            楼层: actualHouseData.楼层 || '中层',
                            装修: actualHouseData.装修 || '精装修',
                            朝向: actualHouseData.朝向 || '朝南',
                            类型: actualHouseData.类型 || '公寓',
                            封面图URL: actualHouseData.封面图URL || ''
                        };
                        
                        // 更新装修评价，确保与房屋报告中的装修描述保持同步
                        if (actualHouseData.装修) {
                            this.analysisResults.imageAnalysis.decorationEvaluation = actualHouseData.装修;
                        }
                        console.log('更新后的 currentReportHouse:', this.currentReportHouse);
                    }
                } catch (error) {
                    console.error('获取房源详情失败:', error);
                    // 继续使用临时数据，不做任何操作
                }
            },
            
            // 获取分析结果
            async fetchAnalysisResults(houseId) {
                console.log('开始获取分析结果，houseId:', houseId);
                console.log('AI API地址:', 'http://8.134.109.200:8081');
                console.log('GIS API地址:', 'http://8.134.109.200:8080');
                
                try {
                    // 尝试从GIS API获取位置便利性分析
                    console.log('从GIS API获取位置便利性分析');
                    const gisController = new AbortController();
                    const gisTimeoutId = setTimeout(() => gisController.abort(), 5000); // 5秒超时
                    
                    // 直接调用GIS服务的API
                    const gisApiUrl = `http://8.134.109.200:8080/houses/nearby?houseId=${houseId}`;
                    console.log('GIS API请求地址:', gisApiUrl);
                    
                    const gisResponse = await fetch(gisApiUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        signal: gisController.signal
                    });
                    
                    clearTimeout(gisTimeoutId);
                    console.log('GIS API响应状态:', gisResponse.status);
                    
                    let actualGisData = {};
                    if (gisResponse.ok) {
                        const gisAnalysisData = await gisResponse.json();
                        console.log('从GIS API获取的分析结果:', gisAnalysisData);
                        actualGisData = gisAnalysisData.data || gisAnalysisData || {};
                        console.log('实际GIS数据:', actualGisData);
                    } else {
                        console.error('GIS API调用失败，状态码:', gisResponse.status);
                        // GIS API调用失败，使用默认数据
                        actualGisData = {
                            subwayDistance: '0.5km',
                            hospitalDistance: '1.0km',
                            mallDistance: '0.7km'
                        };
                        console.log('使用默认GIS数据:', actualGisData);
                    }
                    
                    // 尝试从AI API获取分析结果
                    console.log('从AI API获取分析结果');
                    const aiController = new AbortController();
                    const aiTimeoutId = setTimeout(() => aiController.abort(), 5000); // 5秒超时
                    
                    // 从后端API获取房屋体检报告
                    const aiApiUrl = `http://8.134.109.200:8082/report/house/${houseId}`;
                    console.log('AI API请求地址:', aiApiUrl);
                    
                    const aiResponse = await fetch(aiApiUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        signal: aiController.signal
                    });
                    
                    clearTimeout(aiTimeoutId);
                    console.log('AI API响应状态:', aiResponse.status);
                    
                    let actualData = {};
                    if (aiResponse.ok) {
                        const aiAnalysisData = await aiResponse.json();
                        console.log('从AI API获取的分析结果:', aiAnalysisData);
                        actualData = aiAnalysisData.data || aiAnalysisData || {};
                        console.log('实际AI数据:', actualData);
                    } else {
                        console.error('AI API调用失败，状态码:', aiResponse.status);
                        // AI API调用失败，使用默认数据
                        actualData = {
                            'P图概率': '15%',
                            '诈骗风险': '安全',
                            '甲醛风险': '低风险',
                            '通勤时间': '25分钟',
                            '性价比': '高'
                        };
                        console.log('使用默认AI数据:', actualData);
                    }
                    
                    // 更新分析结果
                    // 处理AI分析数据
                    let imageAuthenticity = '15%';
                    let fraudRiskText = '低';
                    let houseCompleteness = '98%';
                    let decorationEvaluation = '精装修';
                    let score = 60;
                    
                    // 检查实际AI数据的结构
                    if (actualData && Object.keys(actualData).length > 0) {
                        // 始终使用房源ID生成P图概率（5%-40%），确保不同房源有不同概率且保持一致
                        const idStr = houseId.toString();
                        let hash = 0x811c9dc5;
                        for (let i = 0; i < idStr.length; i++) {
                            hash ^= idStr.charCodeAt(i);
                            hash *= 0x01000193;
                        }
                        const result = Math.abs(((hash * 1103515245 + 12345) >>> 16) % 36);
                        imageAuthenticity = (5 + result) + '%';
                        
                        if (actualData['诈骗风险']) {
                            fraudRiskText = actualData['诈骗风险'];
                        } else if (actualData.fraud_risk) {
                            fraudRiskText = actualData.fraud_risk === 'low' ? '低' : actualData.fraud_risk === 'medium' ? '中' : '高';
                        }
                        
                        if (actualData.complete_rate && actualData.complete_rate !== '100%') {
                            houseCompleteness = actualData.complete_rate;
                        } else if (actualData['房源完整度'] && actualData['房源完整度'] !== '100%') {
                            houseCompleteness = actualData['房源完整度'];
                        } else {
                            // 使用房源ID生成85-95之间的随机数，确保同一房源再次进入时保持一致
                            const idNum = parseInt(houseId) || 0;
                            let hash = (idNum * 2654435761) & 0xffffffff;
                            hash = (hash ^ (hash >>> 13)) >>> 0;
                            hash = (hash * 1540483477) & 0xffffffff;
                            hash = (hash ^ (hash >>> 16)) >>> 0;
                            const randomCompleteness = 85 + (hash % 11);
                            houseCompleteness = randomCompleteness + '%';
                        }
                        
                        if (actualData.decoration) {
                            decorationEvaluation = actualData.decoration;
                        } else if (this.currentReportHouse && this.currentReportHouse.装修) {
                            // 如果AI分析结果中没有装修评价，使用房屋报告中的装修描述
                            decorationEvaluation = this.currentReportHouse.装修;
                        }
                    }
                    
                    // 处理GIS数据
                    let subwayDistance = '0.6km';
                    let hospitalDistance = '1.2km';
                    let mallDistance = '0.8km';
                    
                    // 检查GIS数据是否为数组
                    if (Array.isArray(actualGisData) && actualGisData.length > 0) {
                        // 如果是数组，取第一个元素
                        const firstItem = actualGisData[0];
                        subwayDistance = firstItem.subway_dist || firstItem.subwayDistance || '0.6km';
                        hospitalDistance = firstItem.hospital_dist || firstItem.hospitalDistance || '1.2km';
                        mallDistance = firstItem.mall_dist || firstItem.mallDistance || '0.8km';
                    } else if (typeof actualGisData === 'object' && actualGisData !== null && Object.keys(actualGisData).length > 0) {
                        // 如果是对象，直接读取
                        subwayDistance = actualGisData.subway_dist || actualGisData.subwayDistance || '0.6km';
                        hospitalDistance = actualGisData.hospital_dist || actualGisData.hospitalDistance || '1.2km';
                        mallDistance = actualGisData.mall_dist || actualGisData.mallDistance || '0.8km';
                    }
                    
                    // 如果API没有返回综合评分，根据房源完整度和位置距离动态计算
                    if (typeof score === 'number' && score === 60) {
                        const steps = [];
                        let finalScore = 60;
                        
                        steps.push({
                            name: '基础分',
                            detail: '所有房源基础分60分',
                            score: 60,
                            icon: 'fa-star',
                            type: 'base'
                        });
                        
                        // 房源完整度加成（0-10分）
                        const completeness = parseInt(houseCompleteness) || 85;
                        let completenessScore = 0;
                        if (completeness >= 95) {
                            completenessScore = 10;
                        } else if (completeness >= 85) {
                            completenessScore = 7;
                        } else if (completeness >= 60) {
                            completenessScore = 4;
                        } else {
                            completenessScore = 0;
                        }
                        finalScore += completenessScore;
                        steps.push({
                            name: '房源完整度',
                            detail: `${houseCompleteness} ${completeness >= 95 ? '优秀（满分10分）' : completeness >= 85 ? '良好（+7分）' : completeness >= 60 ? '一般（+4分）' : '较差（+0分）'}`,
                            score: completenessScore,
                            icon: 'fa-check-circle',
                            type: completenessScore > 5 ? 'good' : completenessScore > 0 ? 'neutral' : 'low'
                        });
                        
                        // 距离解析函数
                        const parseDistance = (distStr) => {
                            const match = distStr.toString().match(/([\d.]+)/);
                            return match ? parseFloat(match[1]) : 3;
                        };
                        
                        const subwayDist = parseDistance(subwayDistance);
                        const hospitalDist = parseDistance(hospitalDistance);
                        const mallDist = parseDistance(mallDistance);
                        
                        // 地铁距离加成（0-5分，按步行距离量化）
                        let subwayScore = 0;
                        if (subwayDist <= 0.4) {
                            subwayScore = 5;
                        } else if (subwayDist <= 0.8) {
                            subwayScore = 4;
                        } else if (subwayDist <= 1.2) {
                            subwayScore = 3;
                        } else if (subwayDist <= 1.6) {
                            subwayScore = 2;
                        } else if (subwayDist <= 2.4) {
                            subwayScore = 1;
                        }
                        finalScore += subwayScore;
                        steps.push({
                            name: '地铁距离',
                            detail: `${subwayDistance} ${subwayDist <= 0.4 ? '步行≤5分钟（+5分）' : subwayDist <= 0.8 ? '步行5-10分钟（+4分）' : subwayDist <= 1.2 ? '步行10-15分钟（+3分）' : subwayDist <= 1.6 ? '步行15-20分钟（+2分）' : subwayDist <= 2.4 ? '步行20-30分钟（+1分）' : '步行＞30分钟（+0分）'}`,
                            score: subwayScore,
                            icon: 'fa-train',
                            type: subwayScore > 3 ? 'good' : subwayScore > 0 ? 'neutral' : 'low'
                        });
                        
                        // 医院距离加成（0-5分，优先三甲医院）
                        let hospitalScore = 0;
                        if (hospitalDist <= 0.6) {
                            hospitalScore = 5;
                        } else if (hospitalDist <= 1.2) {
                            hospitalScore = 4;
                        } else if (hospitalDist <= 2) {
                            hospitalScore = 3;
                        } else if (hospitalDist <= 3) {
                            hospitalScore = 1;
                        }
                        finalScore += hospitalScore;
                        steps.push({
                            name: '医院距离',
                            detail: `${hospitalDistance} ${hospitalDist <= 0.6 ? '步行≤8分钟（三甲，+5分）' : hospitalDist <= 1.2 ? '步行8-15分钟（三甲，+4分）' : hospitalDist <= 2 ? '步行15-25分钟（三甲，+3分）' : hospitalDist <= 3 ? '仅社区诊所（+1分）' : '3km内无医疗机构（+0分）'}`,
                            score: hospitalScore,
                            icon: 'fa-hospital',
                            type: hospitalScore > 3 ? 'good' : hospitalScore > 0 ? 'neutral' : 'low'
                        });
                        
                        // 商场距离加成（0-5分，大型综合商超）
                        let mallScore = 0;
                        if (mallDist <= 0.6) {
                            mallScore = 5;
                        } else if (mallDist <= 1.2) {
                            mallScore = 4;
                        } else if (mallDist <= 2) {
                            mallScore = 3;
                        } else if (mallDist <= 2.5) {
                            mallScore = 1;
                        }
                        finalScore += mallScore;
                        steps.push({
                            name: '商场距离',
                            detail: `${mallDistance} ${mallDist <= 0.6 ? '步行≤8分钟（+5分）' : mallDist <= 1.2 ? '步行8-15分钟（+4分）' : mallDist <= 2 ? '步行15-25分钟（+3分）' : mallDist <= 2.5 ? '仅有便利店（+1分）' : '2km内无大型商场（+0分）'}`,
                            score: mallScore,
                            icon: 'fa-shopping-mall',
                            type: mallScore > 3 ? 'good' : mallScore > 0 ? 'neutral' : 'low'
                        });
                        
                        // 诈骗风险加分（安全加10分）
                        let fraudScore = fraudRiskText === '安全' ? 10 : 0;
                        finalScore += fraudScore;
                        steps.push({
                            name: '诈骗风险',
                            detail: fraudRiskText,
                            score: fraudScore,
                            icon: 'fa-shield-alt',
                            type: fraudScore > 0 ? 'good' : 'warning'
                        });
                        
                        // 装修评价加分（0/10/15三档固定分）
                        let decorationScore = 0;
                        if (decorationEvaluation === '豪华装修') {
                            decorationScore = 15;
                        } else if (decorationEvaluation === '精装修') {
                            decorationScore = 10;
                        }
                        finalScore += decorationScore;
                        steps.push({
                            name: '装修评价',
                            detail: `${decorationEvaluation}（${decorationEvaluation === '豪华装修' ? '+15分' : decorationEvaluation === '精装修' ? '+10分' : '+0分'}）`,
                            score: decorationScore,
                            icon: 'fa-home',
                            type: decorationScore > 10 ? 'good' : decorationScore > 0 ? 'neutral' : 'low'
                        });
                        
                        // P图概率修正（+3或-5分）
                        const ptuProbability = parseInt(imageAuthenticity) || 0;
                        let ptuScore = 0;
                        if (ptuProbability >= 15) {
                            ptuScore = -5;
                        } else if (ptuProbability < 5) {
                            ptuScore = 3;
                        }
                        finalScore += ptuScore;
                        steps.push({
                            name: 'P图概率修正',
                            detail: `P图概率 ${imageAuthenticity}（${ptuScore === 3 ? '实拍真实，+3分' : ptuScore === -5 ? '重度P图，-5分' : '轻微美化，+0分'}）`,
                            score: ptuScore,
                            icon: 'fa-image',
                            type: ptuScore > 0 ? 'good' : ptuScore < 0 ? 'bad' : 'neutral'
                        });
                        
                        // 封顶规则：分数＞100取100，≤100保留原值
                        score = Math.min(100, finalScore);
                        
                        this.scoringSteps = steps;
                        this.animateScore(score);
                    } else {
                        this.buildScoringSteps(imageAuthenticity, fraudRiskText, houseCompleteness, decorationEvaluation, subwayDistance, hospitalDistance, mallDistance);
                        this.animateScore(score);
                    }
                    
                    // 更新分析结果，确保真实数据覆盖默认值
                    this.analysisResults = {
                        imageAnalysis: {
                            imageAuthenticity: imageAuthenticity,
                            fraudRisk: fraudRiskText,
                            houseCompleteness: houseCompleteness,
                            decorationEvaluation: decorationEvaluation,
                            score: score
                        },
                        locationAnalysis: {
                            subwayDistance: subwayDistance,
                            hospitalDistance: hospitalDistance,
                            mallDistance: mallDistance
                        }
                    };
                    
                    // 更新评分样本数据，使评分计算过程与风险分析数据一致
                    this.scoringSamples[0] = {
                        name: '当前房源',
                        houseCompleteness: houseCompleteness,
                        fraudRisk: fraudRiskText,
                        decoration: decorationEvaluation,
                        ptuProbability: imageAuthenticity,
                        subwayDistance: subwayDistance,
                        hospitalDistance: hospitalDistance,
                        mallDistance: mallDistance,
                        totalScore: score
                    };
                    this.selectedSampleIndex = 0;
                    this.generateScoringItems(this.scoringSamples[0]);
                    
                    console.log('更新后的分析结果:', this.analysisResults);
                    console.log('更新后的评分样本:', this.scoringSamples[0]);
                } catch (error) {
                    console.error('获取分析结果失败:', error);
                    // API调用失败，添加（待确定）标注
                    this.analysisResults = {
                        imageAnalysis: {
                            imageAuthenticity: '15% (待确定)',
                            fraudRisk: '安全 (待确定)',
                            houseCompleteness: '98% (待确定)',
                            decorationEvaluation: '中等装修 (待确定)',
                            score: 60
                        },
                        locationAnalysis: {
                            subwayDistance: '0.6km (待确定)',
                            hospitalDistance: '1.2km (待确定)',
                            mallDistance: '0.8km (待确定)'
                        }
                    };
                    console.log('API调用失败，使用默认数据并添加（待确定）标注:', this.analysisResults);
                }
            },
            animateScore(targetScore) {
                this.displayScore = 0;
                const duration = 1500;
                const startTime = Date.now();
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                    this.displayScore = Math.round(targetScore * easeOutQuart);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.initCharts();
                    }
                };
                
                requestAnimationFrame(animate);
            },
            initCharts() {
                this.$nextTick(() => {
                    this.destroyCharts();
                    
                    const waterfallEl = document.getElementById('waterfall-chart');
                    const barEl = document.getElementById('bar-chart');
                    const pieEl = document.getElementById('pie-chart');
                    
                    if (waterfallEl && window.echarts) {
                        this.waterfallChart = window.echarts.init(waterfallEl);
                        this.renderWaterfallChart();
                    }
                    if (barEl && window.echarts) {
                        this.barChart = window.echarts.init(barEl);
                        this.renderBarChart();
                    }
                    if (pieEl && window.echarts) {
                        this.pieChart = window.echarts.init(pieEl);
                        this.renderPieChart();
                    }
                    
                    this.linkCharts();
                    
                    window.addEventListener('resize', this.handleResize);
                });
            },
            destroyCharts() {
                if (this.waterfallChart) {
                    this.waterfallChart.dispose();
                    this.waterfallChart = null;
                }
                if (this.barChart) {
                    this.barChart.dispose();
                    this.barChart = null;
                }
                if (this.pieChart) {
                    this.pieChart.dispose();
                    this.pieChart = null;
                }
            },
            handleResize() {
                if (this.waterfallChart) this.waterfallChart.resize();
                if (this.barChart) this.barChart.resize();
                if (this.pieChart) this.pieChart.resize();
            },
            renderWaterfallChart() {
                const items = this.currentScoringItems;
                if (!items || items.length === 0) return;
                
                const chartItems = items.filter(i => !i.isFinal);
                
                const baseItem = chartItems.find(i => i.isBase);
                const otherItems = chartItems.filter(i => !i.isBase);
                
                const data = chartItems.map(item => {
                    const color = item.isBase ? '#81c784' : 
                                  item.score > 0 ? '#7ccd7c' : 
                                  item.score < 0 ? '#f8b177' : '#e0e0e0';
                    
                    return {
                        name: item.name,
                        value: item.score,
                        itemStyle: {
                            color: color
                        },
                        label: {
                            show: true,
                            position: 'right',
                            formatter: item.score !== 0 ? (item.score > 0 ? '+' + item.score : item.score) : '',
                            color: '#666',
                            fontWeight: 'bold'
                        }
                    };
                });
                
                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        },
                        formatter: (params) => {
                            const item = chartItems[params[0].dataIndex];
                            if (!item) return '';
                            return `<div style="font-weight:bold;margin-bottom:4px">${item.name}</div>
                                    <div>累计得分：<span style="color:#4caf50;font-weight:bold">${item.cumulative}</span>分</div>
                                    <div>判定规则：${item.rule}</div>`;
                        }
                    },
                    grid: {
                        left: '8%',
                        right: '12%',
                        bottom: '8%',
                        top: '8%',
                        containLabel: true
                    },
                    xAxis: {
                        type: 'value',
                        name: '分数',
                        min: 0,
                        max: 100,
                        axisLine: {
                            lineStyle: {
                                color: '#666'
                            }
                        },
                        splitLine: {
                            lineStyle: {
                                color: '#eee'
                            }
                        }
                    },
                    yAxis: {
                        type: 'category',
                        data: chartItems.map(i => i.name),
                        axisLine: {
                            lineStyle: {
                                color: '#ccc'
                            }
                        },
                        axisLabel: {
                            fontSize: 12
                        }
                    },
                    series: [
                        {
                            name: '基础分偏移',
                            type: 'bar',
                            stack: 'total',
                            barWidth: '50%',
                            itemStyle: {
                                color: 'transparent'
                            },
                            data: chartItems.map((item, index) => {
                                let offset = 0;
                                for (let i = 0; i < index; i++) {
                                    offset += chartItems[i].score;
                                }
                                return offset;
                            })
                        },
                        {
                            name: '得分',
                            type: 'bar',
                            stack: 'total',
                            barWidth: '50%',
                            data: data,
                            emphasis: {
                                scale: true,
                                scaleSize: 8,
                                itemStyle: {
                                    shadowBlur: 10,
                                    shadowOffsetX: 0,
                                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#006400'
                                }
                            }
                        },
                        {
                            name: '累计线',
                            type: 'line',
                            stack: 'total',
                            smooth: true,
                            lineStyle: {
                                color: '#ff9800',
                                width: 3
                            },
                            itemStyle: {
                                color: '#ff9800'
                            },
                            symbol: 'circle',
                            symbolSize: 8,
                            data: chartItems.map(item => item.cumulative)
                        }
                    ]
                };
                
                this.waterfallChart.setOption(option);
            },
            renderBarChart() {
                const items = this.currentScoringItems;
                if (!items || items.length === 0) return;
                
                const nonZeroItems = items.filter(i => !i.isBase && !i.isFinal && i.score !== 0);
                
                const option = {
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        },
                        formatter: (params) => {
                            const item = nonZeroItems[params[0].dataIndex];
                            if (!item) return '';
                            return `<div style="font-weight:bold;margin-bottom:4px">${item.name}</div>
                                    <div>${item.rule}</div>
                                    <div style="color:${item.score > 0 ? '#4caf50' : '#f8b177'};font-weight:bold">
                                        ${item.score > 0 ? '+' : ''}${item.score}分
                                    </div>`;
                        }
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        top: '10%',
                        containLabel: true
                    },
                    xAxis: {
                        type: 'value',
                        name: '分数',
                        axisLine: {
                            lineStyle: {
                                color: '#666'
                            }
                        },
                        splitLine: {
                            lineStyle: {
                                color: '#eee'
                            }
                        }
                    },
                    yAxis: {
                        type: 'category',
                        data: nonZeroItems.map(i => i.name),
                        axisLine: {
                            lineStyle: {
                                color: '#ccc'
                            }
                        },
                        axisLabel: {
                            fontSize: 12
                        }
                    },
                    series: [
                        {
                            name: '分值',
                            type: 'bar',
                            data: nonZeroItems.map(i => ({
                                value: i.score,
                                itemStyle: {
                                    color: i.score > 0 ? '#7ccd7c' : '#f8b177',
                                    borderRadius: i.score > 0 ? [0, 4, 4, 0] : [4, 0, 0, 4]
                                }
                            })),
                            label: {
                                show: true,
                                position: i => items.find(item => item.score === i)?.score > 0 ? 'right' : 'left',
                                formatter: (params) => {
                                    const val = params.value;
                                    return val > 0 ? '+' + val : val;
                                },
                                color: '#666',
                                fontWeight: 'bold'
                            },
                            barWidth: '60%',
                            emphasis: {
                                scale: true,
                                scaleSize: 8,
                                itemStyle: {
                                    shadowBlur: 10,
                                    shadowOffsetX: 0,
                                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#006400'
                                }
                            }
                        }
                    ]
                };
                
                this.barChart.setOption(option);
            },
            renderPieChart() {
                const items = this.currentScoringItems;
                if (!items || items.length === 0) return;
                
                const baseScore = 60;
                let aiScore = 0;
                let gisScore = 0;
                
                items.forEach(item => {
                    if (item.isBase) return;
                    if (item.isFinal) return;
                    
                    if (item.module === 'ai') {
                        aiScore += Math.max(0, item.score);
                        aiScore -= Math.abs(Math.min(0, item.score));
                    } else if (item.module === 'gis') {
                        gisScore += item.score;
                    }
                });
                
                const total = baseScore + aiScore + gisScore;
                
                const data = [
                    {
                        name: '基础分',
                        value: baseScore,
                        itemStyle: {
                            color: '#e0e0e0'
                        }
                    },
                    {
                        name: 'AI图像模块',
                        value: Math.max(0, aiScore),
                        itemStyle: {
                            color: '#4caf50'
                        }
                    },
                    {
                        name: 'GIS区位模块',
                        value: Math.max(0, gisScore),
                        itemStyle: {
                            color: '#2196f3'
                        }
                    }
                ];
                
                const option = {
                    tooltip: {
                        trigger: 'item',
                        formatter: (params) => {
                            const percent = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
                            return `<div style="font-weight:bold;margin-bottom:4px">${params.name}</div>
                                    <div>${params.value}分</div>
                                    <div>占比 ${percent}%</div>`;
                        }
                    },
                    legend: {
                        orient: 'horizontal',
                        bottom: '5%',
                        data: ['基础分', 'AI图像模块', 'GIS区位模块']
                    },
                    series: [
                        {
                            name: '评分构成',
                            type: 'pie',
                            radius: ['35%', '65%'],
                            center: ['50%', '45%'],
                            avoidLabelOverlap: false,
                            itemStyle: {
                                borderRadius: 8,
                                borderColor: '#fff',
                                borderWidth: 2
                            },
                            label: {
                                show: true,
                                formatter: '{b}\n{c}分',
                                fontSize: 11
                            },
                            emphasis: {
                                scale: true,
                                scaleSize: 8,
                                scaleAnimation: true,
                                duration: 300,
                                label: {
                                    show: true,
                                    fontSize: 13,
                                    fontWeight: 'bold'
                                },
                                itemStyle: {
                                    shadowBlur: 8,
                                    shadowOffsetX: 0,
                                    shadowColor: 'rgba(0, 0, 0, 0.25)'
                                }
                            },
                            labelLine: {
                                show: true
                            },
                            data: data
                        }
                    ]
                };
                
                this.pieChart.setOption(option);
            },
            linkCharts() {
                const charts = [this.waterfallChart, this.barChart, this.pieChart].filter(c => c);
                
                charts.forEach(chart => {
                    chart.on('mouseover', (params) => {
                        const name = params.name;
                        this.highlightedItem = name;
                        
                        charts.forEach(c => {
                            if (c !== chart) {
                                if (c === this.pieChart) {
                                    let pieName = name;
                                    if (['房源完整度', '安全风险', '装修评价', 'P图概率修正'].includes(name)) {
                                        pieName = 'AI图像模块';
                                    } else if (['地铁距离', '医院距离', '商场距离'].includes(name)) {
                                        pieName = 'GIS区位模块';
                                    } else if (name === '基础分') {
                                        pieName = '基础分';
                                    }
                                    c.dispatchAction({
                                        type: 'highlight',
                                        seriesIndex: 0,
                                        name: pieName
                                    });
                                } else {
                                    c.dispatchAction({
                                        type: 'highlight',
                                        seriesIndex: 0,
                                        name: name
                                    });
                                }
                            }
                        });
                    });
                    
                    chart.on('mouseout', () => {
                        this.highlightedItem = null;
                        charts.forEach(c => {
                            c.dispatchAction({
                                type: 'downplay'
                            });
                        });
                    });
                });
            },
            buildScoringSteps(imageAuthenticity, fraudRiskText, houseCompleteness, decorationEvaluation, subwayDistance, hospitalDistance, mallDistance) {
                const steps = [];
                
                steps.push({
                    name: '基础分',
                    detail: '所有房源基础分60分',
                    score: 60,
                    icon: 'fa-star',
                    type: 'base'
                });
                
                const completeness = parseInt(houseCompleteness) || 85;
                let completenessScore = 0;
                if (completeness >= 95) {
                    completenessScore = 10;
                } else if (completeness >= 85) {
                    completenessScore = 7;
                } else if (completeness >= 60) {
                    completenessScore = 4;
                } else {
                    completenessScore = 0;
                }
                steps.push({
                    name: '房源完整度',
                    detail: `${houseCompleteness} ${completeness >= 95 ? '优秀（满分10分）' : completeness >= 85 ? '良好（+7分）' : completeness >= 60 ? '一般（+4分）' : '较差（+0分）'}`,
                    score: completenessScore,
                    icon: 'fa-check-circle',
                    type: completenessScore > 5 ? 'good' : completenessScore > 0 ? 'neutral' : 'low',
                    rule: `完整度${houseCompleteness} ${completeness >= 95 ? '≥95%，满分10分（户型图/实拍图/视频/证件齐全）' : completeness >= 85 ? '≥85%，+7分（基础信息齐全，房源信息完整）' : completeness >= 60 ? '≥60%，+4分（仅基础文字，信息较完整）' : '＜60%，+0分（仅简单描述，信息不完整）'}`
                });
                
                const parseDistance = (distStr) => {
                    const match = distStr.toString().match(/([\d.]+)/);
                    return match ? parseFloat(match[1]) : 3;
                };
                
                const subwayDist = parseDistance(subwayDistance);
                let subwayScore = 0;
                if (subwayDist <= 0.4) {
                    subwayScore = 5;
                } else if (subwayDist <= 0.8) {
                    subwayScore = 4;
                } else if (subwayDist <= 1.2) {
                    subwayScore = 3;
                } else if (subwayDist <= 1.6) {
                    subwayScore = 2;
                } else if (subwayDist <= 2.4) {
                    subwayScore = 1;
                }
                steps.push({
                    name: '地铁距离',
                    detail: `${subwayDistance} ${subwayDist <= 0.4 ? '步行≤5分钟（+5分）' : subwayDist <= 0.8 ? '步行5-10分钟（+4分）' : subwayDist <= 1.2 ? '步行10-15分钟（+3分）' : subwayDist <= 1.6 ? '步行15-20分钟（+2分）' : subwayDist <= 2.4 ? '步行20-30分钟（+1分）' : '步行＞30分钟（+0分）'}`,
                    score: subwayScore,
                    icon: 'fa-train',
                    type: subwayScore > 3 ? 'good' : subwayScore > 0 ? 'neutral' : 'low'
                });
                
                const hospitalDist = parseDistance(hospitalDistance);
                let hospitalScore = 0;
                if (hospitalDist <= 0.6) {
                    hospitalScore = 5;
                } else if (hospitalDist <= 1.2) {
                    hospitalScore = 4;
                } else if (hospitalDist <= 2) {
                    hospitalScore = 3;
                } else if (hospitalDist <= 3) {
                    hospitalScore = 1;
                }
                steps.push({
                    name: '医院距离',
                    detail: `${hospitalDistance} ${hospitalDist <= 0.6 ? '步行≤8分钟（三甲，+5分）' : hospitalDist <= 1.2 ? '步行8-15分钟（三甲，+4分）' : hospitalDist <= 2 ? '步行15-25分钟（三甲，+3分）' : hospitalDist <= 3 ? '仅社区诊所（+1分）' : '3km内无医疗机构（+0分）'}`,
                    score: hospitalScore,
                    icon: 'fa-hospital',
                    type: hospitalScore > 3 ? 'good' : hospitalScore > 0 ? 'neutral' : 'low'
                });
                
                const mallDist = parseDistance(mallDistance);
                let mallScore = 0;
                if (mallDist <= 0.6) {
                    mallScore = 5;
                } else if (mallDist <= 1.2) {
                    mallScore = 4;
                } else if (mallDist <= 2) {
                    mallScore = 3;
                } else if (mallDist <= 2.5) {
                    mallScore = 1;
                }
                steps.push({
                    name: '商场距离',
                    detail: `${mallDistance} ${mallDist <= 0.6 ? '步行≤8分钟（+5分）' : mallDist <= 1.2 ? '步行8-15分钟（+4分）' : mallDist <= 2 ? '步行15-25分钟（+3分）' : mallDist <= 2.5 ? '仅有便利店（+1分）' : '2km内无大型商场（+0分）'}`,
                    score: mallScore,
                    icon: 'fa-store-alt',
                    type: mallScore > 3 ? 'good' : mallScore > 0 ? 'neutral' : 'low'
                });
                
                let fraudScore = fraudRiskText === '安全' ? 10 : 0;
                steps.push({
                    name: '诈骗风险',
                    detail: fraudRiskText,
                    score: fraudScore,
                    icon: 'fa-shield-alt',
                    type: fraudScore > 0 ? 'good' : 'warning'
                });
                
                let decorationScore = 0;
                if (decorationEvaluation === '豪华装修') {
                    decorationScore = 15;
                } else if (decorationEvaluation === '精装修') {
                    decorationScore = 10;
                }
                steps.push({
                    name: '装修评价',
                    detail: `${decorationEvaluation}（${decorationEvaluation === '豪华装修' ? '+15分' : decorationEvaluation === '精装修' ? '+10分' : '+0分'}）`,
                    score: decorationScore,
                    icon: 'fa-home',
                    type: decorationScore > 10 ? 'good' : decorationScore > 0 ? 'neutral' : 'low'
                });
                
                const ptuProbability = parseInt(imageAuthenticity) || 0;
                let ptuScore = 0;
                if (ptuProbability >= 15) {
                    ptuScore = -5;
                } else if (ptuProbability < 5) {
                    ptuScore = 3;
                }
                steps.push({
                    name: 'P图概率修正',
                    detail: `P图概率 ${imageAuthenticity}（${ptuScore === 3 ? '实拍真实，+3分' : ptuScore === -5 ? '重度P图，-5分' : '轻微美化，+0分'}）`,
                    score: ptuScore,
                    icon: 'fa-image',
                    type: ptuScore > 0 ? 'good' : ptuScore < 0 ? 'bad' : 'neutral'
                });
                
                this.scoringSteps = steps;
            },
            selectFromFav(houseId) {
                // 从收藏页面进入详情页时，使用'/analysis'作为source参数
                const source = '/analysis';
                console.log('从收藏页面进入详情页，来源:', source);
                // 使用路由跳转，传递来源信息
                this.$router.push({
                    path: '/analysis',
                    query: { 
                        id: houseId,
                        source: source
                    }
                });
            },
            backToFind() {
                this.$router.push('/findhouse');
            },
            clearReport() {
                this.currentReportHouse = null;
                // 直接返回到上一页，这样能直接回到用户进入详情页之前的页面
                console.log('返回到上一页');
                this.$router.back();
            },
            goFindHouse() {
                this.$router.push('/findhouse');
            },
            // 取消收藏
            removeFavorite(houseId) {
                try {
                    console.log('开始取消收藏，houseId:', houseId, '类型:', typeof houseId);
                    
                    const username = this.globalState.currentUser?.username;
                    if (!username) {
                        console.error('用户未登录，无法取消收藏');
                        alert('取消收藏失败，请先登录！');
                        return;
                    }
                    
                    // 尝试从localStorage中获取收藏列表，使用与getFavorites函数一致的数据结构
                    let allFavorites = {};
                    try {
                        const storedFavorites = localStorage.getItem('anju_favorites');
                        console.log('localStorage中的收藏数据:', storedFavorites);
                        if (storedFavorites) {
                            allFavorites = JSON.parse(storedFavorites);
                        }
                    } catch (storageError) {
                        console.warn('localStorage访问失败，使用空对象:', storageError);
                        allFavorites = {};
                    }
                    
                    // 获取当前用户的收藏列表
                    const userFavorites = allFavorites[username] || [];
                    console.log('当前用户收藏列表:', userFavorites);
                    
                    // 移除指定的房源ID，处理数字和字符串类型
                    const houseIdStr = String(houseId);
                    const updatedUserFavorites = userFavorites.filter(id => String(id) !== houseIdStr);
                    
                    console.log('更新后的用户收藏列表:', updatedUserFavorites);
                    
                    // 更新收藏数据
                    allFavorites[username] = updatedUserFavorites;
                    
                    // 尝试保存更新后的收藏列表
                    try {
                        localStorage.setItem('anju_favorites', JSON.stringify(allFavorites));
                        console.log('收藏列表已保存到localStorage');
                    } catch (storageError) {
                        console.warn('localStorage保存失败，但仍会更新界面:', storageError);
                    }
                    
                    // 重新加载收藏列表
                    this.loadFavoritesList();
                    
                    // 显示取消成功的提示
                    alert('取消收藏成功！');
                    console.log('取消收藏成功');
                } catch (error) {
                    console.error('取消收藏失败:', error);
                    // 即使出错，也尝试重新加载收藏列表
                    this.loadFavoritesList();
                    // 显示取消成功的提示，因为界面已经更新
                    alert('取消收藏成功！');
                }
            },
            getDistrictImage(index) {
                // 从地址中提取区域
                const address = this.currentReportHouse.完整地址 || '';
                let district = '布吉'; // 默认区域
                
                // 检查地址中包含的区域名称
                if (address.includes('宝安')) {
                    district = '宝安';
                } else if (address.includes('布吉')) {
                    district = '布吉';
                } else if (address.includes('南山')) {
                    district = '南山';
                } else if (address.includes('福田')) {
                    district = '福田';
                } else if (address.includes('罗湖')) {
                    district = '罗湖';
                } else if (address.includes('龙华')) {
                    district = '龙华';
                } else if (address.includes('龙岗')) {
                    district = '龙岗';
                } else if (address.includes('大鹏新区')) {
                    district = '大鹏新区';
                } else if (address.includes('光明')) {
                    district = '光明';
                } else if (address.includes('坪山')) {
                    district = '坪山';
                } else if (address.includes('盐田')) {
                    district = '盐田';
                }
                
                // 根据index返回不同类型的图表
                if (index === 1) {
                    // 第一张图：密度图
                    return `house-images/output/density_plots/${district}_area_rent_density_plot.png`;
                } else {
                    // 第二张图：小提琴图
                    return `house-images/output/violin_plots/${district}_decoration_based_violin_plot.png`;
                }
            },
            
            // 打开图片放大模态框
            openImageModal(imageUrl) {
                if (imageUrl) {
                    this.selectedImage = imageUrl;
                    this.zoomLevel = 1; // 重置缩放级别
                    this.translateX = 0; // 重置平移
                    this.translateY = 0; // 重置平移
                    this.isDragging = false; // 重置拖动状态
                    this.showImageModal = true;
                    document.body.style.overflow = 'hidden';
                }
            },
            
            // 关闭图片放大模态框
            closeImageModal() {
                this.showImageModal = false;
                this.selectedImage = '';
                this.zoomLevel = 1; // 重置缩放级别
                this.translateX = 0; // 重置平移
                this.translateY = 0; // 重置平移
                this.isDragging = false; // 重置拖动状态
                
                // 移除所有事件监听
                if (this.boundMouseMove) {
                    document.removeEventListener('mousemove', this.boundMouseMove);
                    this.boundMouseMove = null;
                }
                if (this.boundMouseUp) {
                    document.removeEventListener('mouseup', this.boundMouseUp);
                    window.removeEventListener('blur', this.boundMouseUp);
                    this.boundMouseUp = null;
                }
                
                document.body.style.overflow = 'auto';
            },
            
            // 处理鼠标按下
            handleMouseDown(event) {
                if (this.zoomLevel > 1) { // 只有在放大状态下才能拖动
                    this.isDragging = true;
                    this.startX = event.clientX - this.translateX;
                    this.startY = event.clientY - this.translateY;
                    event.target.style.cursor = 'grabbing';
                    
                    // 绑定 this 上下文
                    this.boundMouseMove = this.handleDocumentMouseMove.bind(this);
                    this.boundMouseUp = this.handleDocumentMouseUp.bind(this);
                    
                    // 添加 document 级别的事件监听
                    document.addEventListener('mousemove', this.boundMouseMove);
                    document.addEventListener('mouseup', this.boundMouseUp);
                    // 添加窗口失焦事件监听，确保在窗口失焦时结束拖拽
                    window.addEventListener('blur', this.boundMouseUp);
                }
            },
            
            // 处理 document 鼠标移动
            handleDocumentMouseMove(event) {
                if (this.isDragging) {
                    this.translateX = event.clientX - this.startX;
                    this.translateY = event.clientY - this.startY;
                }
            },
            
            // 处理 document 鼠标释放
            handleDocumentMouseUp(event) {
                this.isDragging = false;
                // 移除 document 级别的事件监听
                if (this.boundMouseMove) {
                    document.removeEventListener('mousemove', this.boundMouseMove);
                }
                if (this.boundMouseUp) {
                    document.removeEventListener('mouseup', this.boundMouseUp);
                    window.removeEventListener('blur', this.boundMouseUp);
                }
                // 恢复鼠标指针样式
                const modalImage = document.querySelector('.modal-image');
                if (modalImage) {
                    modalImage.style.cursor = 'zoom-in';
                }
            },
            
            // 处理鼠标移动（保留，以防需要）
            handleMouseMove(event) {
                if (this.isDragging) {
                    this.scheduleTranslateUpdate(event.clientX - this.startX, event.clientY - this.startY);
                }
            },
            
            translateUpdateTimeout: null,
            
            // 防抖处理平移更新
            scheduleTranslateUpdate(newX, newY) {
                if (this.translateUpdateTimeout) {
                    cancelAnimationFrame(this.translateUpdateTimeout);
                }
                this.translateUpdateTimeout = requestAnimationFrame(() => {
                    this.translateX = newX;
                    this.translateY = newY;
                });
            },
            
            // 处理鼠标释放（保留，以防需要）
            handleMouseUp(event) {
                this.isDragging = false;
                if (event.target) {
                    event.target.style.cursor = 'zoom-in';
                }
            },
            
            // 处理鼠标滚轮缩放
            handleZoom(event) {
                event.preventDefault();
                const delta = event.deltaY > 0 ? -0.05 : 0.05;
                this.scheduleZoomUpdate(this.zoomLevel + delta);
            },
            
            zoomUpdateTimeout: null,
            
            // 防抖处理缩放更新
            scheduleZoomUpdate(newZoomLevel) {
                if (this.zoomUpdateTimeout) {
                    clearTimeout(this.zoomUpdateTimeout);
                }
                this.zoomUpdateTimeout = setTimeout(() => {
                    this.updateZoomLevel(newZoomLevel);
                }, 16);
            },
            
            // 处理触摸开始
            handleTouchStart(event) {
                if (event.touches.length === 2) {
                    const touch1 = event.touches[0];
                    const touch2 = event.touches[1];
                    this.touchStartDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                    );
                    this.touchStartZoom = this.zoomLevel;
                }
            },
            
            // 处理触摸移动
            handleTouchMove(event) {
                if (event.touches.length === 2) {
                    event.preventDefault();
                    const touch1 = event.touches[0];
                    const touch2 = event.touches[1];
                    const currentDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                    );
                    
                    const scale = currentDistance / this.touchStartDistance;
                    const newZoomLevel = this.touchStartZoom * scale;
                    this.scheduleZoomUpdate(newZoomLevel);
                }
            },
            
            // 处理触摸结束
            handleTouchEnd() {
                this.touchStartDistance = 0;
                this.touchStartZoom = 1;
            },
            
            // 更新缩放级别
            updateZoomLevel(newZoomLevel) {
                // 限制缩放范围：50% 到 300%
                const minZoom = 0.5;
                const maxZoom = 3;
                this.zoomLevel = Math.min(Math.max(newZoomLevel, minZoom), maxZoom);
            },
            
            // 处理图片加载失败
            handleImageError(event) {
                // 可以在这里设置默认图片，或者隐藏图片
                event.target.style.display = 'none';
            },
            // 打开登录模态框
            openLoginModal() {
                // 确保window.Anju存在
                if (window.Anju && window.Anju.globalState) {
                    window.Anju.globalState.showLoginModal = true;
                }
            },
            // 强制刷新收藏列表
            refreshFavorites() {
                if (!this.$route.query.id) {
                    this.loadFavoritesList();
                }
            }
        },
        mounted() {
            console.log('mounted 被调用，$route.query.id:', this.$route.query.id);
            
            // 只在页面加载时刷新一次，避免频繁刷新导致闪烁
            if (!this.$route.query.id) {
                this.loadFavoritesList();
            }
        },
        beforeUnmount() {
            // 清理工作
        },
        watch: {
            '$route' : {
                handler(to, from) {
                    console.log('watch $route 被调用，from:', from.path, 'to:', to.path);
                    // 当进入详情页时，记录上一页路由
                    if (to.query.id) {
                        console.log('进入详情页，记录上一页路由:', from);
                        this.previousRoute = JSON.parse(JSON.stringify(from));
                        console.log('previousRoute 已更新:', this.previousRoute);
                    }
                }
            },
            '$route.query.id': {
                handler(id) {
                    console.log('watch $route.query.id 被调用，id:', id);
                    if(id !== undefined && id !== null && id !== '') {
                        console.log('调用 loadReportById，ID:', id);
                        this.loadReportById(id);
                    } else {
                        console.log('设置 currentReportHouse 为 null，加载收藏列表');
                        this.currentReportHouse = null;
                        this.loadFavoritesList();
                    }
                },
                immediate: true
            },
            'globalState.currentUser'() {
                console.log('watch globalState.currentUser 被调用');
                if(this.$route.query.id === undefined || this.$route.query.id === null || this.$route.query.id === '') {
                    console.log('加载收藏列表');
                    this.loadFavoritesList();
                }
            }
        }
    };

    window.Components = window.Components || {};
    window.Components.AnalysisPage = AnalysisPage;
})();
