(() => {
    const { globalState, applyTheme } = window.Anju;

    // =========================
    // 登录 / 注册 API 函数
    // =========================
    function loginUser(username, password) {
      const result = window.Anju.loginUser(username, password);
      if (result.ok) {
        localStorage.setItem('anju_user', JSON.stringify({ username, avatar: result.user?.avatar || null }));
        window.Anju.globalState.currentUser = { username, avatar: result.user?.avatar || null };
      }
      return result;
    }

    function registerUser(username, password) {
      // 使用本地模拟实现，避免后端API调用
      return window.Anju.registerUser(username, password);
    }

    // =========================
    // 主布局组件
    // =========================
    const MainLayout = {
        template: `
            <div class="app">
                <div class="navbar">
                    <div class="logo" @click="$router.push('/')">
                        <i class="fas fa-compass"></i> 安居·罗盘
                    </div>
                    <nav class="navbar-links">
                        <button class="navbar-link" @click="$router.push('/')">首页</button>
                        <button class="navbar-link" @click="$router.push('/findhouse')">房源推荐</button>
                        <button class="navbar-link" @click="$router.push('/personalized-recommendation')">个性化推荐</button>
                        <button class="navbar-link" @click="$router.push('/analysis')">我的收藏</button>
                        <button class="navbar-link" @click="$router.push('/ai-chat')">AI防诈</button>
                        <button class="navbar-link" @click="$router.push('/about')">关于我们</button>
                    </nav>
                    <div class="user-area">
                        <div v-if="globalState.currentUser" class="user-btn" @click="toggleDropdown">
                            <img v-if="getUserAvatar()" :src="getUserAvatar()" alt="头像" class="nav-avatar">
                            <i v-else class="fas fa-user"></i> {{ globalState.currentUser.username }} <i class="fas fa-chevron-down"></i>
                        </div>
                        <button v-else class="user-btn" @click="openAuth('login')">登录 / 注册</button>
                        <div v-if="showDropdown" class="dropdown-menu">
                            <div class="dropdown-item">
                                <i class="fas fa-id-card"></i> 个人信息：{{ globalState.currentUser.username }}
                            </div>
                            <div class="dropdown-item" @click="openAvatarModal">
                                <i class="fas fa-user-circle"></i> 修改头像
                            </div>
                            <div class="dropdown-item" @click="goToFavorites">
                                <i class="fas fa-heart"></i> 我的收藏
                            </div>
                            <div class="dropdown-item theme-option">
                                <span><i class="fas fa-palette"></i> 主题颜色</span>
                                <div class="theme-colors">
                                    <div class="color-circle" style="background:#4caf50;" @click.stop="changeTheme('green')"></div>
                                    <div class="color-circle" style="background:#2196f3;" @click.stop="changeTheme('blue')"></div>
                                    <div class="color-circle" style="background:#607d8b;" @click.stop="changeTheme('gray')"></div>
                                </div>
                            </div>
                            <div class="dropdown-item" @click="logout">
                                <i class="fas fa-sign-out-alt"></i> 退出登录
                            </div>
                        </div>
                    </div>
                </div>
                <keep-alive include="AIChatPage">
                    <router-view></router-view>
                </keep-alive>
                <div 
                    class="ai-fab" 
                    @mousedown="startFabDrag"
                    @touchstart="startFabDrag"
                >
                    <span style="color:white; font-weight:800; font-size:12px; line-height:1; display:block;">AI防诈</span>
                </div>
                <div v-if="showAvatarModal" class="avatar-modal" @click="closeAvatarModal">
                    <div class="avatar-modal-content" @click.stop>
                        <div class="avatar-modal-header">
                            <h3>修改头像</h3>
                            <button class="avatar-modal-close" @click="closeAvatarModal">×</button>
                        </div>
                        <div class="avatar-modal-body">
                            <div class="avatar-uploader">
                                <div class="avatar-preview" style="width: 150px; height: 150px;">
                                    <img v-if="tempAvatar" :src="tempAvatar" alt="头像" class="avatar-image">
                                    <div v-else class="avatar-placeholder">
                                        <i class="fas fa-user-circle"></i>
                                        <span>点击上传</span>
                                    </div>
                                    <div class="avatar-overlay">
                                        <input 
                                            type="file" 
                                            accept="image/jpeg,image/jpg,image/png" 
                                            class="avatar-input"
                                            @change="handleAvatarFileChange"
                                            :disabled="avatarUploading"
                                        >
                                        <div class="avatar-overlay-content">
                                            <i class="fas fa-camera"></i>
                                            <span class="overlay-text">{{ tempAvatar ? '更换头像' : '上传头像' }}</span>
                                        </div>
                                        <button v-if="tempAvatar" class="remove-btn" @click.stop="removeAvatar">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                <div v-if="avatarUploading" class="uploading-text">
                                    <i class="fas fa-spinner fa-spin"></i> 处理中...
                                </div>
                                <div v-if="avatarError" class="error-text">{{ avatarError }}</div>
                                <div class="hint-text">支持JPG、PNG格式，大小不超过2MB</div>
                            </div>
                        </div>
                        <div class="avatar-modal-footer">
                            <button class="cancel-btn" @click="closeAvatarModal">取消</button>
                            <button class="save-btn" @click="saveAvatar">保存</button>
                        </div>
                    </div>
                </div>
                <div v-if="showAiChat" class="ai-chat-window" :class="{ 'resizing': isResizing }" @mousemove="onResizeMove" @mouseup="stopResize" @mouseleave="stopResize">
                    <div class="ai-chat-header" @mousedown="startDragWindow">
                        <h3>AI反诈助手</h3>
                        <button class="ai-chat-close" @click.stop="closeFloatingChat">×</button>
                    </div>
                    <div class="ai-chat-messages" ref="chatMessages">
                        <div v-for="(message, index) in chatMessages" :key="index" :class="['message', message.sender]">
                            <div class="message-avatar">
                                <img v-if="message.sender === 'ai'" src="/robot.jpg" alt="AI" class="ai-avatar">
                                <img v-else-if="getUserAvatar()" :src="getUserAvatar()" alt="用户" class="user-avatar">
                                <i v-else class="fas fa-user"></i>
                            </div>
                            <div class="message-content" @dblclick.stop="toggleFloatingMsgSpeech(index)" v-if="message.sender === 'ai'">
                                <div class="message-text">{{ message.text }}</div>
                                <div class="message-time">{{ message.time }}</div>
                                <button 
                                    v-if="message.text" 
                                    class="speak-btn-floating-chat"
                                    @click.stop="toggleFloatingSpeak(index)"
                                    :class="{ speaking: message.isSpeaking, paused: message.isPaused }"
                                >
                                    <i class="fas" :class="message.isPaused ? 'fa-play' : (message.isSpeaking ? 'fa-volume-off' : 'fa-volume-up')"></i>
                                </button>
                            </div>
                            <div class="message-content" v-else>
                                <div class="message-text">{{ message.text }}</div>
                                <div class="message-time">{{ message.time }}</div>
                            </div>
                        </div>
                        <div v-if="isLoading" class="message ai">
                            <div class="message-avatar">
                                <img src="/robot.jpg" alt="AI" class="ai-avatar">
                            </div>
                            <div class="message-content">
                                <div class="message-text">正在分析，请稍候...</div>
                            </div>
                        </div>
                    </div>
                    <div class="ai-chat-input">
                        <textarea 
                            v-model="userInput" 
                            placeholder="请输入您的问题..."
                            @keyup.enter.exact="sendMessage"
                        ></textarea>
                        <button class="ai-chat-send" @click="sendMessage" :disabled="!userInput.trim() || isLoading">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="resize-handle resize-nw" @mousedown="(e) => startResize('nw', e)"></div>
                    <div class="resize-handle resize-n" @mousedown="(e) => startResize('n', e)"></div>
                    <div class="resize-handle resize-ne" @mousedown="(e) => startResize('ne', e)"></div>
                    <div class="resize-handle resize-w" @mousedown="(e) => startResize('w', e)"></div>
                    <div class="resize-handle resize-e" @mousedown="(e) => startResize('e', e)"></div>
                    <div class="resize-handle resize-sw" @mousedown="(e) => startResize('sw', e)"></div>
                    <div class="resize-handle resize-s" @mousedown="(e) => startResize('s', e)"></div>
                    <div class="resize-handle resize-se" :class="{ resizing: isResizing }" @mousedown="(e) => startResize('se', e)"></div>
                    <div v-if="isResizing" class="resize-tooltip">{{ windowWidth }} × {{ windowHeight }}</div>
                </div>
                <div v-if="showBackToTop" class="back-to-top" @click="scrollToTop">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <div v-if="globalState.showLoginModal" class="modal-mask" @click.self="globalState.showLoginModal=false">
                    <div class="modal-container">
                        <div v-if="authMode === 'login'">
                            <div class="modal-header">
                                <i class="fas fa-user-circle"></i>
                                <h3>登录安居·罗盘</h3>
                            </div>
                            <div class="modal-body">
                                <input v-model="loginNickname" placeholder="输入昵称" />
                                <input v-model="loginPassword" placeholder="输入密码" type="password" />
                            </div>
                            <div class="modal-footer">
                                <button class="primary-btn" @click="doLogin">登录</button>
                                <button class="secondary-btn" @click="closeAuth">取消</button>
                            </div>
                            <div class="modal-switch">
                                还没有账号？<span class="switch-link" @click="authMode='register'">去注册</span>
                            </div>
                        </div>
                        <div v-else>
                            <div class="modal-header">
                                <i class="fas fa-user-plus"></i>
                                <h3>注册安居·罗盘</h3>
                            </div>
                            <div class="modal-body">
                                <input v-model="registerNickname" placeholder="输入昵称" />
                                <input v-model="registerPassword" placeholder="输入密码" type="password" />
                            </div>
                            <div class="modal-footer">
                                <button class="primary-btn" @click="doRegister">注册</button>
                                <button class="secondary-btn" @click="closeAuth">取消</button>
                            </div>
                            <div class="modal-switch">
                                已有账号？<span class="switch-link" @click="authMode='login'">去登录</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        data() {
                return {
                    showDropdown: false,
                    authMode: 'login',
                    loginNickname: '',
                    loginPassword: '',
                    registerNickname: '',
                    registerPassword: '',
                    lastRouteBeforeAiChat: null,
                    showBackToTop: false,
                    // 头像修改相关状态
                    showAvatarModal: false,
                    tempAvatar: '',
                    avatarUploading: false,
                    avatarError: '',
                    // 拖拽相关状态
                    isDragging: false,
                    startX: 0,
                    startY: 0,
                    startLeft: 0,
                    startTop: 0,
                    hasMoved: false,
                    // 长按检测
                    longPressTimer: null,
                    longPressTriggered: false,
                    longPressThreshold: 300, // 长按阈值300ms
                    // AI聊天浮窗相关状态
                    showAiChat: false,
                    chatMessages: [
                        {
                            sender: 'ai',
                            text: '你好！我是 AI 反诈助手，有什么可以帮助你的吗？',
                            time: this.formatTime(new Date()),
                            isSpeaking: false,
                            isPaused: false
                        }
                    ],
                    userInput: '',
                    isLoading: false,
                    sessionId: null,
                    // 浮窗语音播报状态
                    floatingIsSpeaking: false,
                    floatingIsPaused: false,
                    floatingCanShowSpeak: false,
                    // 浮窗拖拽位置
                    windowLeft: 0,
                    windowTop: 0,
                    isDraggingWindow: false,
                    // 浮窗大小调整
                    isResizing: false,
                    windowWidth: 380,
                    windowHeight: 500,
                    resizeStartX: 0,
                    resizeStartY: 0,
                    resizeStartWidth: 0,
                    resizeStartHeight: 0,
                    // 浮窗滚动位置
                    floatingScrollPosition: undefined
                };
            },
        methods: {
            toggleDropdown() {
                this.showDropdown = !this.showDropdown;
            },
            getUserAvatar() {
                try {
                    return this.globalState?.currentUser?.avatar || null;
                } catch (e) {
                    return null;
                }
            },
            openAvatarModal() {
                this.tempAvatar = this.globalState.currentUser?.avatar || '';
                this.avatarError = '';
                this.avatarUploading = false;
                this.showAvatarModal = true;
                this.showDropdown = false;
            },
            closeAvatarModal() {
                this.showAvatarModal = false;
                this.tempAvatar = '';
                this.avatarError = '';
                this.avatarUploading = false;
            },
            handleAvatarFileChange(event) {
                const file = event.target.files[0];
                if (!file) return;

                this.avatarError = '';

                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                const maxSize = 2 * 1024 * 1024;

                if (!allowedTypes.includes(file.type)) {
                    this.avatarError = '请选择JPG或PNG格式的图片';
                    return;
                }

                if (file.size > maxSize) {
                    this.avatarError = '图片大小不能超过2MB';
                    return;
                }

                this.avatarUploading = true;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        const minSize = Math.min(img.width, img.height);
                        const startX = (img.width - minSize) / 2;
                        const startY = (img.height - minSize) / 2;
                        
                        canvas.width = 150;
                        canvas.height = 150;
                        
                        ctx.drawImage(img, startX, startY, minSize, minSize, 0, 0, 150, 150);
                        
                        this.tempAvatar = canvas.toDataURL('image/jpeg', 0.8);
                        this.avatarUploading = false;
                        event.target.value = '';
                    };
                    img.onerror = () => {
                        this.avatarError = '图片处理失败，请重试';
                        this.avatarUploading = false;
                        event.target.value = '';
                    };
                    img.src = e.target.result;
                };
                reader.onerror = () => {
                    this.avatarError = '图片读取失败，请重试';
                    this.avatarUploading = false;
                    event.target.value = '';
                };
                reader.readAsDataURL(file);
            },
            removeAvatar() {
                this.tempAvatar = '';
            },
            saveAvatar() {
                const result = window.Anju.updateUserAvatar(this.globalState.currentUser.username, this.tempAvatar);
                if (result.ok) {
                    this.globalState.currentUser.avatar = this.tempAvatar;
                    localStorage.setItem('anju_user', JSON.stringify(this.globalState.currentUser));
                    this.closeAvatarModal();
                }
            },
            onAiFabClick() {
                // 如果有移动，则不执行点击事件
                if (this.hasMoved) {
                    this.hasMoved = false;
                    return;
                }
                
                // 切换聊天浮窗的显示/隐藏
                this.showAiChat = !this.showAiChat;
                
                // 如果显示聊天浮窗，更新其位置并恢复滚动位置
                if (this.showAiChat) {
                    this.$nextTick(() => {
                        this.updateChatWindowPosition();
                        const chatMessages = this.$refs.chatMessages;
                        if (chatMessages && this.floatingScrollPosition !== undefined) {
                            chatMessages.scrollTop = this.floatingScrollPosition;
                        }
                    });
                }
            },
            scrollToTop() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            openAuth(mode) {
                this.authMode = mode === 'register' ? 'register' : 'login';
                this.globalState.showLoginModal = true;
            },
            closeAuth() {
                this.globalState.showLoginModal = false;
            },
            goToFavorites() {
                this.showDropdown = false;
                this.$router.push('/analysis');
            },
            onFabMouseDown(e) {
                if (this.showAiChat) return;
                
                this.longPressTriggered = false;
                this.startX = e.clientX || (e.touches && e.touches[0].clientX);
                this.startY = e.clientY || (e.touches && e.touches[0].clientY);
                
                this.longPressTimer = setTimeout(() => {
                    this.longPressTriggered = true;
                    this.startFabDrag(e);
                    const fab = document.querySelector('.ai-fab');
                    if (fab) {
                        fab.style.transform = 'scale(1.1)';
                        fab.style.boxShadow = '0 8px 24px rgba(76, 175, 80, 0.5)';
                    }
                }, 500);
                
                this._onFabMouseUp = () => this.onFabMouseUp(e);
                this._onFabMouseMove = (evt) => this.onFabMouseMove(evt);
                
                document.addEventListener('mouseup', this._onFabMouseUp);
                document.addEventListener('touchend', this._onFabMouseUp);
                document.addEventListener('mousemove', this._onFabMouseMove);
                document.addEventListener('touchmove', this._onFabMouseMove);
            },
            onFabMouseMove(e) {
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                
                if (Math.abs(clientX - this.startX) > 10 || Math.abs(clientY - this.startY) > 10) {
                    if (this.longPressTimer) {
                        clearTimeout(this.longPressTimer);
                        this.longPressTimer = null;
                    }
                    if (!this.longPressTriggered && !this.showAiChat) {
                        this.longPressTriggered = true;
                        this.startFabDrag(e);
                        const fab = document.querySelector('.ai-fab');
                        if (fab) {
                            fab.style.transform = 'scale(1.1)';
                            fab.style.boxShadow = '0 8px 24px rgba(76, 175, 80, 0.5)';
                        }
                    }
                }
            },
            onFabMouseUp(e) {
                document.removeEventListener('mouseup', this._onFabMouseUp);
                document.removeEventListener('touchend', this._onFabMouseUp);
                document.removeEventListener('mousemove', this._onFabMouseMove);
                document.removeEventListener('touchmove', this._onFabMouseMove);
                this._onFabMouseUp = null;
                this._onFabMouseMove = null;
                
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
                
                if (this.longPressTriggered) {
                    this.stopFabDrag();
                    const fab = document.querySelector('.ai-fab');
                    if (fab) {
                        fab.style.transform = '';
                        fab.style.boxShadow = '';
                    }
                    this.longPressTriggered = false;
                } else {
                    this.onAiFabClick();
                }
            },
            startFabDrag(e) {
                const fab = document.querySelector('.ai-fab');
                if (!fab) return;
                
                const clientX = e.clientX || (e.touches && e.touches[0].clientX);
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                
                this.startX = clientX;
                this.startY = clientY;
                this.fabWidth = fab.offsetWidth;
                this.fabHeight = fab.offsetHeight;
                
                const computedStyle = window.getComputedStyle(fab);
                this.fabStartTop = parseInt(fab.style.top) || parseInt(computedStyle.top) || window.innerHeight - this.fabHeight - 20;
                
                this.isDragging = false;
                this.longPressTimer = setTimeout(() => {
                    this.isDragging = true;
                    fab.style.cursor = 'grabbing';
                }, 300);
                
                document.addEventListener('mousemove', this.onFabDragMove);
                document.addEventListener('mouseup', this.onFabMouseUp);
                document.addEventListener('touchmove', this.onFabDragMove);
                document.addEventListener('touchend', this.onFabMouseUp);
            },
            onFabDragMove(e) {
                if (!this.isDragging) return;
                
                const clientY = e.clientY || (e.touches && e.touches[0].clientY);
                this.currentDragY = clientY;
                
                if (!this.dragAnimationFrame) {
                    this.dragAnimationFrame = requestAnimationFrame(() => {
                        const deltaY = this.currentDragY - this.startY;
                        const fab = document.querySelector('.ai-fab');
                        if (fab) {
                            const newTop = Math.max(0, Math.min(window.innerHeight - this.fabHeight, this.fabStartTop + deltaY));
                            fab.style.top = `${newTop}px`;
                            fab.style.bottom = 'auto';
                            fab.style.left = 'auto';
                            fab.style.right = '30px';
                        }
                        this.dragAnimationFrame = null;
                    });
                }
            },
            stopFabDrag() {
                this.isDragging = false;
            },
            onFabMouseUp() {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
                
                if (this.dragAnimationFrame) {
                    cancelAnimationFrame(this.dragAnimationFrame);
                    this.dragAnimationFrame = null;
                }
                
                const fab = document.querySelector('.ai-fab');
                if (fab) {
                    fab.style.cursor = 'pointer';
                }
                
                if (!this.isDragging) {
                    this.onAiFabClick();
                }
                
                this.isDragging = false;
                
                document.removeEventListener('mousemove', this.onFabDragMove);
                document.removeEventListener('mouseup', this.onFabMouseUp);
                document.removeEventListener('touchmove', this.onFabDragMove);
                document.removeEventListener('touchend', this.onFabMouseUp);
            },
            // 更新聊天浮窗位置 - 固定在FAB上方
            updateChatWindowPosition() {
                const fab = document.querySelector('.ai-fab');
                const chatWindow = document.querySelector('.ai-chat-window');
                
                if (fab && chatWindow) {
                    const fabRect = fab.getBoundingClientRect();
                    
                    chatWindow.style.transition = 'bottom 0.2s ease, right 0.2s ease';
                    chatWindow.style.bottom = `${fabRect.height + 10}px`;
                    chatWindow.style.right = '20px';
                }
            },
            logout() {
                this.showDropdown = false;
                globalState.currentUser = null;
                localStorage.removeItem('anju_user');
                localStorage.removeItem('anju_token');
                this.$router.push('/');
            },
            changeTheme(theme) {
                applyTheme(theme);
                this.showDropdown = false;
            },
            doLogin() {
                console.log('Logging in with:', this.loginNickname, this.loginPassword);
                // 直接使用window.Anju中的方法
                const res = window.Anju.loginUser(this.loginNickname, this.loginPassword);
                console.log('Login result:', res);
                if (!res.ok) {
                    alert(res.message || '登录失败');
                    return;
                }
                // 模拟设置用户信息
                localStorage.setItem('anju_user', JSON.stringify({ username: this.loginNickname }));
                window.Anju.globalState.currentUser = { username: this.loginNickname };
                globalState.showLoginModal = false;
                this.loginNickname = '';
                this.loginPassword = '';
            },
            doRegister() {
                console.log('Registering with:', this.registerNickname, this.registerPassword);
                // 直接使用window.Anju中的方法
                const res = window.Anju.registerUser(this.registerNickname, this.registerPassword);
                console.log('Register result:', res);
                if (!res.ok) {
                    alert(res.message || '注册失败');
                    return;
                }
                this.authMode = 'login';
                this.loginNickname = this.registerNickname.trim();
                this.loginPassword = '';
                this.registerNickname = '';
                this.registerPassword = '';
                alert(res.message || '注册成功');
            },
            // 格式化时间
            formatTime(date) {
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            },
            // 发送消息
            sendMessage() {
                if (!this.userInput.trim() || this.isLoading) return;
                
                const userMessage = this.userInput.trim();
                
                // 添加用户消息到聊天记录
                this.chatMessages.push({
                    sender: 'user',
                    text: userMessage,
                    time: this.formatTime(new Date())
                });
                
                // 清空输入框
                this.userInput = '';
                
                // 显示加载状态
                this.isLoading = true;
                
                // 滚动到底部
                this.scrollToBottom();
                
                // 调用真实API接口
                this.callAiApi(userMessage);
            },
            // 调用AI API
            callAiApi(message) {
                const API_BASE_URL = 'http://8.134.109.200:8081'; // AI服务地址
                
                const requestData = {
                    message: message,
                    sessionId: this.sessionId || 'default_session',
                    houseId: '',
                    userId: 1 // 默认用户ID
                };
                
                fetch(`${API_BASE_URL}/ai/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200 && data.data) {
                        // 更新会话ID
                        if (data.data.sessionId) {
                            this.sessionId = data.data.sessionId;
                        }
                        
                        // 添加AI响应到聊天记录
                        this.chatMessages.push({
                            sender: 'ai',
                            text: data.data.reply,
                            time: this.formatTime(new Date()),
                            isSpeaking: false,
                            isPaused: false
                        });
                        
                        this.floatingCanShowSpeak = true;
                        this.startFloatingStreamingSpeech(data.data.reply);
                    } else {
                        // API调用失败，使用默认响应
                        let defaultResponse = '抱歉，AI服务暂时不可用，请稍后再试。';
                        this.chatMessages.push({
                            sender: 'ai',
                            text: defaultResponse,
                            time: this.formatTime(new Date()),
                            isSpeaking: false,
                            isPaused: false
                        });
                        this.floatingCanShowSpeak = true;
                    }
                })
                .catch(error => {
                    console.error('API调用失败:', error);
                    // 网络错误，使用默认响应
                    let errorResponse = '网络连接失败，请检查网络设置后重试。';
                    this.chatMessages.push({
                        sender: 'ai',
                        text: errorResponse,
                        time: this.formatTime(new Date()),
                        isSpeaking: false,
                        isPaused: false
                    });
                    this.floatingCanShowSpeak = true;
                })
                .finally(() => {
                    // 隐藏加载状态
                    this.isLoading = false;
                    // 滚动到底部
                    this.scrollToBottom();
                });
            },
            // 滚动聊天记录到底部
            scrollToBottom() {
                setTimeout(() => {
                    const chatMessages = this.$refs.chatMessages;
                    if (chatMessages) {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }, 100);
            },
            // 关闭浮窗时停止语音并保存滚动位置
            closeFloatingChat() {
                const chatMessages = this.$refs.chatMessages;
                if (chatMessages) {
                    this.floatingScrollPosition = chatMessages.scrollTop;
                }
                this.stopFloatingSpeech();
                this.showAiChat = false;
            },
            // 浮窗语音播报
            toggleFloatingSpeak(index) {
                try {
                    const speechService = window.Anju?.speechService;
                    if (!speechService) return;
                    
                    const message = this.chatMessages[index];
                    if (!message) return;
                    
                    // 如果当前消息正在播报，点击喇叭停止播报
                    if (message.isSpeaking) {
                        speechService.stop();
                        message.isSpeaking = false;
                        message.isPaused = false;
                        return;
                    }
                    
                    // 先停止所有播报
                    speechService.stop();
                    this.chatMessages.forEach((msg, i) => {
                        msg.isSpeaking = false;
                        msg.isPaused = false;
                    });
                    
                    const plainText = message.text || '';
                    if (!plainText.trim()) return;
                    
                    // 标记当前消息开始播报
                    message.isSpeaking = true;
                    message.isPaused = false;
                    
                    // 保存当前索引，用于回调时更新状态
                    const currentIndex = index;
                    
                    speechService.speak(plainText, {
                        lang: 'zh-CN',
                        onEnd: () => {
                            // 播报完成，清除状态（允许再次播报）
                            if (this.chatMessages[currentIndex]) {
                                this.chatMessages[currentIndex].isSpeaking = false;
                                this.chatMessages[currentIndex].isPaused = false;
                            }
                        },
                        onError: () => {
                            if (this.chatMessages[currentIndex]) {
                                this.chatMessages[currentIndex].isSpeaking = false;
                                this.chatMessages[currentIndex].isPaused = false;
                            }
                        }
                    });
                } catch (e) {
                    console.error('Floating speech error:', e);
                    if (this.chatMessages[index]) {
                        this.chatMessages[index].isSpeaking = false;
                        this.chatMessages[index].isPaused = false;
                    }
                }
            },
            // 浮窗双击消息气泡暂停/继续
            toggleFloatingMsgSpeech(index) {
                try {
                    const speechService = window.Anju?.speechService;
                    if (!speechService) return;
                    
                    const message = this.chatMessages[index];
                    if (!message || message.sender !== 'ai') return;
                    
                    if (message.isSpeaking) {
                        if (message.isPaused) {
                            // 当前暂停状态，双击恢复播报
                            speechService.resume();
                            message.isPaused = false;
                        } else {
                            // 当前正在播报，双击暂停
                            speechService.pause();
                            message.isPaused = true;
                        }
                    } else {
                        // 未播报，双击开始播报
                        this.toggleFloatingSpeak(index);
                    }
                } catch (e) {
                    console.error('Floating toggle msg speech error:', e);
                }
            },
            // 浮窗流式播报
            startFloatingStreamingSpeech(text) {
                try {
                    const speechService = window.Anju?.speechService;
                    if (!speechService) return;
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = text;
                    const plainText = tempDiv.textContent || tempDiv.innerText || '';
                    
                    if (!plainText.trim()) return;
                    
                    this.chatMessages.forEach(msg => {
                        msg.isSpeaking = false;
                        msg.isPaused = false;
                    });
                    
                    const lastMsg = this.chatMessages[this.chatMessages.length - 1];
                    if (lastMsg) {
                        lastMsg.isSpeaking = true;
                        lastMsg.isPaused = false;
                    }
                    
                    speechService.speak(plainText, {
                        lang: 'zh-CN',
                        onEnd: () => {
                            if (lastMsg) {
                                lastMsg.isSpeaking = false;
                                lastMsg.isPaused = false;
                            }
                        },
                        onError: () => {
                            if (lastMsg) {
                                lastMsg.isSpeaking = false;
                                lastMsg.isPaused = false;
                            }
                        }
                    });
                } catch (e) {
                    console.error('Floating streaming speech error:', e);
                    const lastMsg = this.chatMessages[this.chatMessages.length - 1];
                    if (lastMsg) {
                        lastMsg.isSpeaking = false;
                        lastMsg.isPaused = false;
                    }
                }
            },
            // 停止浮窗语音
            stopFloatingSpeech() {
                try {
                    const speechService = window.Anju?.speechService;
                    if (speechService) {
                        speechService.stop();
                    }
                    this.floatingIsSpeaking = false;
                    this.floatingIsPaused = false;
                } catch (e) {
                    console.error('Stop floating speech error:', e);
                }
            },
            // 浮窗拖拽
            startDragWindow(e) {
                if (e.target.closest('.ai-chat-close')) return;
                if (this.isResizing) return;
                
                const chatWindow = e.currentTarget.parentElement;
                const rect = chatWindow.getBoundingClientRect();
                
                this.isDraggingWindow = true;
                this.startX = e.clientX;
                this.startY = e.clientY;
                this.windowLeft = rect.left;
                this.windowTop = rect.top;
                this.hasMoved = false;
                
                e.preventDefault();
                e.stopPropagation();
                
                this._onDragMove = (evt) => this.onDragMove(evt);
                this._onStopDrag = () => this.stopDrag();
                
                document.addEventListener('mousemove', this._onDragMove);
                document.addEventListener('mouseup', this._onStopDrag);
            },
            onDragMove(e) {
                if (!this.isDraggingWindow) return;
                
                const deltaX = e.clientX - this.startX;
                const deltaY = e.clientY - this.startY;
                
                const chatWindow = document.querySelector('.ai-chat-window');
                if (chatWindow) {
                    chatWindow.style.left = (this.windowLeft + deltaX) + 'px';
                    chatWindow.style.top = (this.windowTop + deltaY) + 'px';
                    chatWindow.style.right = 'auto';
                    chatWindow.style.bottom = 'auto';
                }
                
                this.hasMoved = true;
            },
            stopDrag() {
                this.isDraggingWindow = false;
                document.removeEventListener('mousemove', this._onDragMove);
                document.removeEventListener('mouseup', this._onStopDrag);
                this._onDragMove = null;
                this._onStopDrag = null;
            },
            // 浮窗大小调整
            startResize(direction, e) {
                if (this.isDraggingWindow) return;
                
                const chatWindow = e.currentTarget.parentElement;
                const rect = chatWindow.getBoundingClientRect();
                
                this.isResizing = true;
                this.resizeDirection = direction;
                this.resizeStartX = e.clientX;
                this.resizeStartY = e.clientY;
                this.resizeStartWidth = rect.width;
                this.resizeStartHeight = rect.height;
                this.resizeStartLeft = rect.left;
                this.resizeStartTop = rect.top;
                
                e.preventDefault();
                e.stopPropagation();
                
                this._onResizeMove = (evt) => this.onResizeMove(evt);
                this._onStopResize = () => this.stopResize();
                
                document.addEventListener('mousemove', this._onResizeMove);
                document.addEventListener('mouseup', this._onStopResize);
            },
            onResizeMove(e) {
                if (!this.isResizing) return;
                
                const deltaX = e.clientX - this.resizeStartX;
                const deltaY = e.clientY - this.resizeStartY;
                
                let newWidth = this.resizeStartWidth;
                let newHeight = this.resizeStartHeight;
                let newLeft = this.resizeStartLeft;
                let newTop = this.resizeStartTop;
                
                const minWidth = 280;
                const maxWidth = 800;
                const minHeight = 350;
                const maxHeight = 800;
                
                switch (this.resizeDirection) {
                    case 'nw':
                        newWidth = Math.max(minWidth, Math.min(maxWidth, this.resizeStartWidth - deltaX));
                        newHeight = Math.max(minHeight, Math.min(maxHeight, this.resizeStartHeight - deltaY));
                        newLeft = this.resizeStartLeft + deltaX;
                        newTop = this.resizeStartTop + deltaY;
                        break;
                    case 'n':
                        newHeight = Math.max(minHeight, Math.min(maxHeight, this.resizeStartHeight - deltaY));
                        newTop = this.resizeStartTop + deltaY;
                        break;
                    case 'ne':
                        newWidth = Math.max(minWidth, Math.min(maxWidth, this.resizeStartWidth + deltaX));
                        newHeight = Math.max(minHeight, Math.min(maxHeight, this.resizeStartHeight - deltaY));
                        newTop = this.resizeStartTop + deltaY;
                        break;
                    case 'w':
                        newWidth = Math.max(minWidth, Math.min(maxWidth, this.resizeStartWidth - deltaX));
                        newLeft = this.resizeStartLeft + deltaX;
                        break;
                    case 'e':
                        newWidth = Math.max(minWidth, Math.min(maxWidth, this.resizeStartWidth + deltaX));
                        break;
                    case 'sw':
                        newWidth = Math.max(minWidth, Math.min(maxWidth, this.resizeStartWidth - deltaX));
                        newHeight = Math.max(minHeight, Math.min(maxHeight, this.resizeStartHeight + deltaY));
                        newLeft = this.resizeStartLeft + deltaX;
                        break;
                    case 's':
                        newHeight = Math.max(minHeight, Math.min(maxHeight, this.resizeStartHeight + deltaY));
                        break;
                    case 'se':
                    default:
                        newWidth = Math.max(minWidth, Math.min(maxWidth, this.resizeStartWidth + deltaX));
                        newHeight = Math.max(minHeight, Math.min(maxHeight, this.resizeStartHeight + deltaY));
                        break;
                }
                
                this.windowWidth = newWidth;
                this.windowHeight = newHeight;
                
                const chatWindow = document.querySelector('.ai-chat-window');
                if (chatWindow) {
                    chatWindow.style.width = newWidth + 'px';
                    chatWindow.style.height = newHeight + 'px';
                    if (newLeft !== this.resizeStartLeft) {
                        chatWindow.style.left = newLeft + 'px';
                        chatWindow.style.right = 'auto';
                    }
                    if (newTop !== this.resizeStartTop) {
                        chatWindow.style.top = newTop + 'px';
                        chatWindow.style.bottom = 'auto';
                    }
                }
            },
            stopResize() {
                this.isResizing = false;
                document.removeEventListener('mousemove', this._onResizeMove);
                document.removeEventListener('mouseup', this._onStopResize);
                this._onResizeMove = null;
                this._onStopResize = null;
            }
        },
        mounted() {
            this._onDocClick = (e) => {
                if (!e.target.closest('.user-area')) this.showDropdown = false;
            };
            window.addEventListener('click', this._onDocClick);
            this._onScroll = () => {
                this.showBackToTop = window.scrollY > 300;
            };
            window.addEventListener('scroll', this._onScroll);
            
            this.routerUnwatch = this.$router.afterEach((to, from) => {
                if (from.path === '/ai-chat' && to.path !== '/ai-chat') {
                    const speechService = window.Anju?.speechService;
                    if (speechService) {
                        speechService.stop();
                    }
                }
            });
        },
        beforeUnmount() {
            window.removeEventListener('click', this._onDocClick);
            window.removeEventListener('scroll', this._onScroll);
            if (this.routerUnwatch) {
                this.routerUnwatch();
            }
            if (this._onDragMove) {
                document.removeEventListener('mousemove', this._onDragMove);
                document.removeEventListener('mouseup', this._onStopDrag);
            }
            if (this._onResizeMove) {
                document.removeEventListener('mousemove', this._onResizeMove);
                document.removeEventListener('mouseup', this._onStopResize);
            }
            if (this._onFabMouseUp) {
                document.removeEventListener('mouseup', this._onFabMouseUp);
                document.removeEventListener('touchend', this._onFabMouseUp);
            }
            if (this._onFabMouseMove) {
                document.removeEventListener('mousemove', this._onFabMouseMove);
                document.removeEventListener('touchmove', this._onFabMouseMove);
            }
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
            }
        },
        watch: {
            'globalState.showLoginModal'(val) {
                if (val) {
                    this.loginNickname = '';
                    this.loginPassword = '';
                    this.registerNickname = '';
                    this.registerPassword = '';
                    this.authMode = 'login';
                }
            },
            $route(to, from) {
                if (to?.path === '/ai-chat' && from?.path !== '/ai-chat') {
                    this.lastRouteBeforeAiChat = { path: from.path, query: from.query || {} };
                }
            }
        },
        inject: ['globalState']
    };

    window.Components = window.Components || {};
    window.Components.MainLayout = MainLayout;

    // =========================
    // 检查登录状态
    // =========================
    function checkLoginStatus() {
      try {
        const userStr = localStorage.getItem('anju_user');
        if (userStr) {
          const savedUser = JSON.parse(userStr);
          const users = JSON.parse(localStorage.getItem('anju_users') || '{}');
          const storedUser = users[savedUser.username];
          if (storedUser && typeof storedUser === 'object') {
            savedUser.avatar = storedUser.avatar || null;
          }
          window.Anju.globalState.currentUser = savedUser;
        }
      } catch (e) {
        console.error('Login status check error:', e);
      }
    }
    checkLoginStatus();

})();
