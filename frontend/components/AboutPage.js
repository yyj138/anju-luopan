(() => {
    // 关于我们页面
    const AboutPage = {
        template: `
            <div class="about-page">
                <div class="about-container">
                    <div class="about-header">
                        <h1><i class="fas fa-compass"></i> 关于安居·罗盘</h1>
                        <p>城市居住风险分析平台 · 让租房更安全更安心</p>
                    </div>

                    <div class="about-section">
                        <h2><i class="fas fa-bullseye"></i> 项目概述</h2>
                        <p>《安居·罗盘》是一款面向深圳市青年的租房风险评估与智能匹配平台，基于GIS通勤圈与多模态AI技术，致力于重构城市租住信任体系。</p>
                        <p>我们融合政府开放数据、实时招聘信息、城市地理空间数据与AI智能体技术，打造首个面向青年群体的"职住风险预警与智能匹配平台"。通过构建居住性价比指数、甲醛风险模型、反欺诈话术识别系统，我们不仅揭露"黑中介""串串房""虚假房源"等隐性风险，更让每一位用户在看房前就能获得一份科学、可解释的《房屋体检报告》。</p>
                    </div>

                    <div class="about-section">
                        <h2><i class="fas fa-cogs"></i> 核心功能</h2>
                        <div class="features-grid">
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-search-location"></i>
                                </div>
                                <h3>智能房源搜索</h3>
                                <p>整合多平台房源数据，支持地理位置、价格、户型等多维度筛选，快速找到符合需求的优质房源</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-magic"></i>
                                </div>
                                <h3>个性化推荐</h3>
                                <p>基于用户偏好和行为数据，结合通勤时间、生活便利度等因素，智能推荐最适合的房源</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-file-medical"></i>
                                </div>
                                <h3>房屋体检报告</h3>
                                <p>全方位评估房屋风险，包括价格合理性、图片真实性、周边环境等，提供详细的分析报告</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <h3>AI反诈助手</h3>
                                <p>智能识别中介话术中的诈骗风险点，提供实时预警和防范建议，保护用户财产安全</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-chart-bar"></i>
                                </div>
                                <h3>房价分析</h3>
                                <p>基于大数据分析，提供各区域房价走势和对比，帮助用户了解市场行情，做出明智决策</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-heart"></i>
                                </div>
                                <h3>收藏管理</h3>
                                <p>方便用户收藏和管理心仪的房源，实时跟踪房源状态变化，不错过好房源</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-map-marked-alt"></i>
                                </div>
                                <h3>职住平衡分析</h3>
                                <p>基于工作地点和房源位置，分析通勤时间和交通成本，帮助用户找到职住平衡的理想住所</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-home"></i>
                                </div>
                                <h3>周边配套评估</h3>
                                <p>分析房源周边的交通、教育、医疗、商业等配套设施，提供全面的生活便利性评估</p>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">
                                    <i class="fas fa-lock"></i>
                                </div>
                                <h3>隐私保护</h3>
                                <p>严格保护用户个人信息和浏览记录，确保用户隐私安全，让用户安心使用平台</p>
                            </div>
                        </div>
                    </div>

                    <div class="about-section">
                        <h2><i class="fas fa-chart-line"></i> 技术优势</h2>
                        <ul class="advantages-list">
                            <li><i class="fas fa-check-circle"></i> <strong>多模态AI识别</strong>：融合图像识别（串串房/P图检测）与大模型话术分析，准确率高达95%以上</li>
                            <li><i class="fas fa-check-circle"></i> <strong>GIS通勤圈分析</strong>：基于高德地图API，实现职住平衡评估与30分钟通勤圈分析</li>
                            <li><i class="fas fa-check-circle"></i> <strong>大数据分析</strong>：整合房产交易、人口流动、交通状况等多源数据，提供全面的风险评估</li>
                            <li><i class="fas fa-check-circle"></i> <strong>区域盒须图</strong>：首创深圳各区域房源面积与价格对比分析，直观展示市场行情</li>
                            <li><i class="fas fa-check-circle"></i> <strong>实时数据更新</strong>：房源信息实时同步，确保数据准确性和时效性</li>
                            <li><i class="fas fa-check-circle"></i> <strong>用户友好界面</strong>：采用现代化设计理念，界面简洁直观，操作便捷高效</li>
                            <li><i class="fas fa-check-circle"></i> <strong>多端适配</strong>：支持PC端、移动端等多种设备，随时随地查看房源信息</li>
                        </ul>
                    </div>

                    <div class="about-section">
                        <h2><i class="fas fa-users"></i> 服务理念</h2>
                        <p>以用户风险图谱为中心，构建透明、主动、智能的租住保护体系。</p>
                        <p>我们相信，真正的服务不是信息堆砌，而是对风险的提前识别与主动干预。安居·罗盘坚持"技术向善"的核心理念，通过AI Agent模拟资深租客与中介对话、识别图片造假与装修劣质特征，结合职住平衡推演与30分钟通勤圈分析，为用户提供超出传统平台的深度决策支持。我们不仅服务于个体用户的安心租住，更致力于推动租房行业从"房源展示"向"风险披露"进化，让每一次匹配都公平、透明、可验证。</p>
                    </div>

                    <div class="about-section">
                        <h2><i class="fas fa-code"></i> 技术栈</h2>
                        <div class="tech-stack-grid">
                            <div class="tech-item">
                                <h3>前端</h3>
                                <p>Vue 3 + Vue Router + ECharts + 高德地图 JS SDK</p>
                            </div>
                            <div class="tech-item">
                                <h3>后端</h3>
                                <p>Spring Boot 3.1.12、MyBatis-Plus、PostgreSQL</p>
                            </div>
                            <div class="tech-item">
                                <h3>AI</h3>
                                <p>通义千问 qwen-plus、OpenCV（图像预处理）</p>
                            </div>
                            <div class="tech-item">
                                <h3>GIS</h3>
                                <p>高德地图 Web API（地理编码、路线规划、矩阵计算）</p>
                            </div>
                            <div class="tech-item">
                                <h3>开发工具</h3>
                                <p>Java、Python、Maven、Visual Studio Code、Git、Selenium</p>
                            </div>
                            <div class="tech-item">
                                <h3>部署</h3>
                                <p>Docker + Nginx + 云服务器</p>
                            </div>
                        </div>
                    </div>

                    <div class="about-section">
                        <h2><i class="fas fa-info-circle"></i> 特别说明</h2>
                        <div class="special-notes">
                            <div class="note-item">
                                <h3>地图来源</h3>
                                <p>作品中涉及的地理信息及职住通勤可视化均基于高德地图开放API实现，地图数据使用符合其服务条款，审图号为GS(2025)5996号。</p>
                            </div>
                            <div class="note-item">
                                <h3>前期基础</h3>
                                <p>本作品无前期基础，所有功能设计、开发与调试均为本次参赛期间独立完成。</p>
                            </div>
                            <div class="note-item">
                                <h3>AI辅助工具使用</h3>
                                <p>在代码开发与调试过程中，使用了DeepSeek与豆包（字节跳动旗下AI助手）进行部分代码片段优化、错误排查及算法逻辑建议。AI辅助生成内容约占全部代码量的20%，未直接生成核心算法或完整功能模块，所有最终实现均经人工审核与整合，符合学术与竞赛规范。</p>
                            </div>
                        </div>
                    </div>

                    <div class="about-section">
                        <h2><i class="fas fa-envelope"></i> 联系我们</h2>
                        <p>如有任何问题、建议或合作意向，欢迎随时联系我们：</p>
                        <div class="contact-info">
                            <div class="contact-item">
                                <i class="fas fa-users"></i>
                                <span>联系团队：史莱克七怪</span>
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-envelope"></i>
                                <span>邮箱：24yjyi@stu.edu.cn</span>
                            </div>
                        </div>
                    </div>

                    <div class="about-actions">
                        <button class="about-btn about-btn--primary" @click="$router.push('/findhouse')">
                            <i class="fas fa-search-location"></i>
                            <span>去找房源</span>
                        </button>
                        <button class="about-btn about-btn--secondary" @click="$router.push('/ai-chat')">
                            <i class="fas fa-shield-alt"></i>
                            <span>试试AI防诈</span>
                        </button>
                    </div>
                </div>
            </div>
        `
    };

    window.Components = window.Components || {};
    window.Components.AboutPage = AboutPage;
})();

