(() => {
    const heroBg =
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=2200&q=80';

    const HomePage = {
        data() {
            return {
                heroBg
            };
        },
        template: `
            <div class="landing-page">
                <!-- =========================
                     Hero（背景图 + 遮罩）
                     ========================= -->
                <section class="landing-hero" :style="{ backgroundImage: 'url(' + heroBg + ')' }">
                    <div class="landing-hero__overlay">
                        <div class="landing-container">
                            <div class="title-container">
                                <h1 class="landing-title landing-title--main">安居·罗盘</h1>
                                <h2 class="landing-title landing-title--subtitle">基于GIS通勤圈与多模态AI的租房风险评估系统</h2>
                            </div>
                            <div class="landing-tagline landing-tagline--main">更懂租房风险的智能平台</div>
                            <p class="landing-subtitle">
                                智能识别虚假房源，精准评估租房风险，为您打造安全无忧的租房体验。
                                <br />结合大数据分析与AI技术，让每一次租房决策都更加安心可靠。
                            </p>

                            <div class="landing-actions">
                                <button class="landing-btn landing-btn--primary" @click="$router.push('/findhouse')">
                                    <i class="fas fa-search-location"></i>
                                    <span>找房源</span>
                                </button>
                                <button class="landing-btn landing-btn--secondary" @click="$router.push('/personalized-recommendation')">
                                    <i class="fas fa-magic"></i>
                                    <span>个性化推荐</span>
                                </button>
                                <button class="landing-btn landing-btn--secondary" @click="$router.push('/analysis')">
                                    <i class="fas fa-heart"></i>
                                    <span>我的收藏</span>
                                </button>
                                <button class="landing-btn landing-btn--ghost" @click="$router.push('/ai-chat')">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>AI防诈</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- =========================
                     核心功能（3卡片）
                     ========================= -->
                <section class="landing-features">
                    <div class="landing-container">
                        <h2 class="landing-section-title">核心功能</h2>
                        <div class="landing-feature-grid">
                            <div class="landing-feature-card">
                                <div class="landing-feature-icon">
                                    <i class="fas fa-map-marked-alt"></i>
                                </div>
                                <div class="landing-feature-body">
                                    <h3>找房源</h3>
                                    <p>海量房源信息，支持多维度筛选，快速找到心仪住所。</p>
                                    <button class="landing-link-btn" @click="$router.push('/findhouse')">进入系统</button>
                                </div>
                            </div>

                            <div class="landing-feature-card">
                                <div class="landing-feature-icon">
                                    <i class="fas fa-magic"></i>
                                </div>
                                <div class="landing-feature-body">
                                    <h3>个性化推荐</h3>
                                    <p>根据您的通勤、预算、户型偏好，智能推荐最适合的房源。</p>
                                    <button class="landing-link-btn" @click="$router.push('/personalized-recommendation')">开始定制</button>
                                </div>
                            </div>

                            <div class="landing-feature-card">
                                <div class="landing-feature-icon">
                                    <i class="fas fa-heart"></i>
                                </div>
                                <div class="landing-feature-body">
                                    <h3>我的收藏</h3>
                                    <p>查看已经收藏的房屋，方便了解防诈骗风险与综合评分。</p>
                                    <button class="landing-link-btn" @click="$router.push('/analysis')">查看收藏</button>
                                </div>
                            </div>

                            <div class="landing-feature-card">
                                <div class="landing-feature-icon">
                                    <i class="fas fa-comment-dots"></i>
                                </div>
                                <div class="landing-feature-body">
                                    <h3>AI反诈助手</h3>
                                    <p>输入中介/房东话术，快速识别可疑点并获得建议。</p>
                                    <button class="landing-link-btn" @click="$router.push('/ai-chat')">开始防诈</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `
    };

    window.Components = window.Components || {};
    window.Components.HomePage = HomePage;
})();

