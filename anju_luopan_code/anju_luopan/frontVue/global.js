(() => {
    // 全局状态/主题/收藏/演示数据集中管理
    const globalState = Vue.reactive({
        currentUser: null,
        showLoginModal: false,
        theme: 'green' // green, blue, gray
    });
    // API 地址配置
    const API_BASE_URL = 'http://8.134.109.200:8082';
    const AI_API_BASE_URL = 'http://8.134.109.200:8081';
const DEEPSEEK_API_URL = '';// 这里需要你自己去 deepseek.com 注册并获取 API Key
const DEEPSEEK_API_KEY = '';  // 这里需要你自己去 deepseek.com 注册并获取 API Key
    const GIS_API_BASE_URL = 'http://8.134.109.200:8082/gis';
    // =========================
    // 主题配置（green / blue / gray）
    // =========================
    const themes = {
        green: {
            '--bg-primary': '#e9f7e1',
            '--bg-card': '#ffffff',
            '--text-primary': '#2c3e2f',
            '--text-secondary': '#666666',
            '--text-primary-rgb': '44, 62, 47',
            '--accent': '#4caf50',
            '--accent-rgb': '76, 175, 80',
            '--accent-hover': '#2e7d32',
            '--navbar-bg': 'rgba(200, 230, 180, 0.9)',
            '--border-color': '#c8e6b5',
        },
        blue: {
            '--bg-primary': '#e1f0fa',
            '--bg-card': '#ffffff',
            '--text-primary': '#1e3c4c',
            '--text-secondary': '#666666',
            '--text-primary-rgb': '30, 60, 76',
            '--accent': '#2196f3',
            '--accent-rgb': '33, 150, 243',
            '--accent-hover': '#0b5e9e',
            '--navbar-bg': 'rgba(180, 215, 240, 0.9)',
            '--border-color': '#bdd4e8',
        },
        gray: {
            '--bg-primary': '#f0f2f5',
            '--bg-card': '#ffffff',
            '--text-primary': '#2c3e50',
            '--text-secondary': '#666666',
            '--text-primary-rgb': '44, 62, 80',
            '--accent': '#607d8b',
            '--accent-rgb': '96, 125, 139',
            '--accent-hover': '#37474f',
            '--navbar-bg': 'rgba(220, 225, 230, 0.9)',
            '--border-color': '#cfd8dc',
        }
    };

    function applyTheme(themeName) {
        const theme = themes[themeName];
        if (!theme) return;
        const root = document.documentElement;
        for (const [prop, value] of Object.entries(theme)) {
            root.style.setProperty(prop, value);
        }
        globalState.theme = themeName;
        localStorage.setItem('anju_theme', themeName);
    }

    // =========================
    // 主题持久化加载（localStorage）
    // =========================
    const savedTheme = localStorage.getItem('anju_theme');
    if (savedTheme && themes[savedTheme]) applyTheme(savedTheme);
    else applyTheme('green');

    // =========================
    // 收藏相关（localStorage 模拟）
    // =========================

    function getFavorites(username) {
        if (!username) return [];
        const all = JSON.parse(localStorage.getItem('anju_favorites') || '{}');
        return all[username] || [];
    }

    function saveFavorites(username, favIds) {
        if (!username) return;
        const all = JSON.parse(localStorage.getItem('anju_favorites') || '{}');
        all[username] = favIds;
        localStorage.setItem('anju_favorites', JSON.stringify(all));
    }

    function addFavorite(username, houseId) {
        if (!username) return;
        const favs = getFavorites(username);
        if (!favs.includes(houseId)) {
            favs.push(houseId);
            saveFavorites(username, favs);
            console.log('收藏成功');
        }
    }

    function removeFavorite(username, houseId) {
        if (!username) return;
        const favs = getFavorites(username);
        const index = favs.indexOf(houseId);
        if (index > -1) {
            favs.splice(index, 1);
            saveFavorites(username, favs);
            console.log('取消收藏成功');
        }
    }

    function isFavorited(username, houseId) {
        if (!username) return false;
        const favs = getFavorites(username);
        return favs.includes(houseId);
    }

    // =========================
    // 登录/注册（昵称 + 密码，本地模拟）
    // 注意：演示用途，明文存储密码仅用于本地演示
    // =========================
    function normalizeUsername(username) {
        return (username || '').toString().trim();
    }

    function loadUsers() {
        try {
            return JSON.parse(localStorage.getItem('anju_users') || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveUsers(users) {
        localStorage.setItem('anju_users', JSON.stringify(users));
    }

    function registerUser(username, password) {
        const u = normalizeUsername(username);
        const p = (password || '').toString();
        if (!u) return { ok: false, message: '请输入昵称' };
        if (!p) return { ok: false, message: '请输入密码' };

        const users = loadUsers();
        if (users[u]) return { ok: false, message: '该昵称已注册，请直接登录' };

        users[u] = {
            password: p,
            avatar: null,
            createdAt: Date.now()
        };
        saveUsers(users);
        return { ok: true, message: '注册成功' };
    }

    function loginUser(username, password) {
        const u = normalizeUsername(username);
        const p = (password || '').toString();
        if (!u) return { ok: false, message: '请输入昵称' };
        if (!p) return { ok: false, message: '请输入密码' };

        const users = loadUsers();
        if (!users[u]) return { ok: false, message: '该昵称未注册，请先注册' };
        
        if (typeof users[u] === 'string') {
            users[u] = {
                password: users[u],
                avatar: null,
                createdAt: Date.now()
            };
            saveUsers(users);
        }
        
        if (users[u].password !== p) return { ok: false, message: '密码错误' };

        return { ok: true, message: '登录成功', user: users[u] };
    }

    function updateUserAvatar(username, avatarBase64) {
        const u = normalizeUsername(username);
        if (!u) return { ok: false, message: '请登录' };

        const users = loadUsers();
        if (!users[u]) return { ok: false, message: '用户不存在' };

        users[u].avatar = avatarBase64;
        saveUsers(users);
        return { ok: true, message: '头像更新成功' };
    }

    function getUserAvatar(username) {
        const u = normalizeUsername(username);
        if (!u) return null;

        const users = loadUsers();
        if (!users[u]) return null;
        
        if (typeof users[u] === 'string') {
            return null;
        }
        
        return users[u].avatar || null;
    }

    // =========================
    // 演示房源数据（后续接后端替换）
    // =========================
    const demoHouses = [
        { id: 1, title: "[演示] 绿茵公寓", address: "朝阳区青年路", rent: 3200, area: 45, riskScore: 92, formaldehyde: "低风险", fraudRisk: "安全", imageAuth: "真实图片", commuteTime: 22, priceIndex: "性价比高" },
        { id: 2, title: "[演示] 滨江花园", address: "浦东新区世纪大道", rent: 5800, area: 78, riskScore: 68, formaldehyde: "中风险", fraudRisk: "注意话术", imageAuth: "轻度P图", commuteTime: 35, priceIndex: "略高" },
    ];

    window.Anju = window.Anju || {};
    window.Anju.globalState = globalState;
    window.Anju.themes = themes;
    window.Anju.applyTheme = applyTheme;
    window.Anju.getFavorites = getFavorites;
    window.Anju.saveFavorites = saveFavorites;
    window.Anju.addFavorite = addFavorite;
    window.Anju.removeFavorite = removeFavorite;
    window.Anju.isFavorited = isFavorited;
    window.Anju.demoHouses = demoHouses;
    window.Anju.registerUser = registerUser;
    window.Anju.loginUser = loginUser;
    window.Anju.updateUserAvatar = updateUserAvatar;
    window.Anju.getUserAvatar = getUserAvatar;
    window.Anju.API_BASE_URL = API_BASE_URL;
    window.Anju.AI_API_BASE_URL = AI_API_BASE_URL;
    window.Anju.GIS_API_BASE_URL = GIS_API_BASE_URL;
    window.Anju.DEEPSEEK_API_URL = DEEPSEEK_API_URL;
    window.Anju.DEEPSEEK_API_KEY = DEEPSEEK_API_KEY;

    const speechService = {
        synth: window.speechSynthesis,
        voices: [],
        currentUtterance: null,
        _cancelled: false,
        _keepAliveTimer: null,

        init() {
            if (this.synth) {
                const loadVoices = () => {
                    this.voices = this.synth.getVoices();
                };
                loadVoices();
                this.synth.onvoiceschanged = loadVoices;
                
                setTimeout(() => {
                    if (this.voices.length === 0) {
                        loadVoices();
                    }
                }, 1000);
                
                setTimeout(() => {
                    if (this.voices.length === 0) {
                        loadVoices();
                    }
                }, 3000);
            }
        },

        cleanText(text) {
            return text
                .replace(/<[^>]*>/g, '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/•\s*/g, '')
                .replace(/\-\s*/g, '')
                .replace(/[⚠️✅🏚️📝💡🏠💰🔑🚪]/g, '')
                .replace(/\(本地分析\)/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        // 按标点分割句子，保留标点
        splitSentences(text) {
            const sentences = text.split(/(?<=[。！？])/g).filter(s => s.trim());
            return sentences;
        },

        // 获取句子类型对应的语调调整
        getSentenceParams(sentence) {
            const params = { rate: 1.0, pitch: 1.0, pause: 300 };
            
            if (sentence.endsWith('？') || sentence.endsWith('?')) {
                params.pitch = 1.1;
                params.pause = 400;
            } else if (sentence.endsWith('！') || sentence.endsWith('!')) {
                params.rate = 1.05;
                params.pitch = 0.95;
                params.pause = 350;
            } else if (sentence.length < 10) {
                params.pause = 200;
            } else if (sentence.length > 30) {
                params.rate = 0.95;
                params.pause = 350;
            }
            
            return params;
        },

        getBestVoice() {
            const priorityVoiceNames = [
                'Microsoft Xiaoxiao Online',
                'Microsoft Xiaoyi Online',
                'Microsoft Yunxi Online',
                'Microsoft Xiaoxiao',
                'Microsoft Huihui',
                'Microsoft Yaoyao',
                'Google 普通话（中国大陆）',
                'Google Mandarin Chinese',
                'Apple Siri Chinese',
            ];

            for (const name of priorityVoiceNames) {
                const found = this.voices.find(v => v.name.includes(name));
                if (found) return found;
            }

            const zhVoice = this.voices.find(v =>
                v.lang.includes('zh') || v.lang.includes('CN')
            );
            return zhVoice || this.voices[0] || null;
        },

        speak(text, options = {}) {
            if (!this.synth) {
                console.warn('浏览器不支持语音合成');
                if (options.onEnd) options.onEnd();
                return false;
            }

            // 先停止当前播报
            this._cancelled = true;
            if (this._keepAliveTimer) {
                clearInterval(this._keepAliveTimer);
                this._keepAliveTimer = null;
            }
            this.synth.cancel();

            const cleanedText = this.cleanText(text);
            if (!cleanedText) {
                if (options.onEnd) options.onEnd();
                return false;
            }

            if (this.voices.length === 0) {
                this.voices = this.synth.getVoices();
            }

            const sentences = this.splitSentences(cleanedText);
            if (sentences.length === 0) {
                if (options.onEnd) options.onEnd();
                return false;
            }

            this._cancelled = false;
            this.currentUtterance = null;
            
            const bestVoice = this.getBestVoice();
            const isHighQualityVoice = bestVoice && 
                (bestVoice.name.includes('Online') || bestVoice.name.includes('Xiaoxiao'));
            
            let currentIndex = 0;

            const startKeepAlive = () => {
                if (this._keepAliveTimer) clearInterval(this._keepAliveTimer);
                this._keepAliveTimer = setInterval(() => {
                    if (this.synth.speaking && !this.synth.paused) {
                        this.synth.pause();
                        this.synth.resume();
                    }
                }, 14000);
            };

            const stopKeepAlive = () => {
                if (this._keepAliveTimer) {
                    clearInterval(this._keepAliveTimer);
                    this._keepAliveTimer = null;
                }
            };

            startKeepAlive();

            const playNext = () => {
                if (this._cancelled || currentIndex >= sentences.length) {
                    stopKeepAlive();
                    this.currentUtterance = null;
                    if (options.onEnd) options.onEnd();
                    return;
                }

                if (this.synth.paused) {
                    return;
                }

                const sentence = sentences[currentIndex];
                const sentenceParams = this.getSentenceParams(sentence);
                
                const utterance = new SpeechSynthesisUtterance(sentence);
                
                utterance.lang = options.lang || 'zh-CN';
                utterance.volume = options.volume || 1.0;
                
                // 基础参数 + 句子类型调整
                let baseRate = isHighQualityVoice ? (options.rate || 1.0) : (options.rate || 0.9);
                let basePitch = isHighQualityVoice ? (options.pitch || 1.0) : (options.pitch || 0.95);
                
                utterance.rate = baseRate * sentenceParams.rate;
                utterance.pitch = basePitch * sentenceParams.pitch;

                if (bestVoice) {
                    utterance.voice = bestVoice;
                }

                utterance.onend = () => {
                    if (this._cancelled) {
                        stopKeepAlive();
                        return;
                    }
                    currentIndex++;
                    setTimeout(playNext, sentenceParams.pause);
                };

                utterance.onerror = (event) => {
                    // 某些错误是正常的中断，不需要处理
                    if (event.error === 'interrupted' || event.error === 'canceled') {
                        return;
                    }
                    console.error('语音合成错误:', event.error);
                    // 尝试继续播放下一句
                    if (!this._cancelled && currentIndex < sentences.length - 1) {
                        currentIndex++;
                        setTimeout(playNext, 100);
                    } else {
                        stopKeepAlive();
                        this._cancelled = true;
                        this.currentUtterance = null;
                        if (options.onError) options.onError(event);
                    }
                };

                this.synth.resume();
                this.currentUtterance = utterance;
                this.synth.speak(utterance);
            };

            playNext();
            return true;
        },

        stop() {
            this._cancelled = true;
            if (this._keepAliveTimer) {
                clearInterval(this._keepAliveTimer);
                this._keepAliveTimer = null;
            }
            if (this.synth) {
                this.synth.cancel();
            }
            this.currentUtterance = null;
        },

        isSpeaking() {
            return this.synth ? this.synth.speaking : false;
        },

        pause() {
            if (this.synth) {
                this.synth.pause();
                if (this._keepAliveTimer) {
                    clearInterval(this._keepAliveTimer);
                    this._keepAliveTimer = null;
                }
            }
        },

        resume() {
            if (this.synth) {
                this.synth.resume();
                if (!this._keepAliveTimer) {
                    this._keepAliveTimer = setInterval(() => {
                        if (this.synth.speaking && !this.synth.paused) {
                            this.synth.pause();
                            this.synth.resume();
                        }
                    }, 14000);
                }
            }
        },

        isPaused() {
            return this.synth ? this.synth.paused : false;
        }
    };
    
    speechService.init();
    window.Anju.speechService = speechService;
})();

