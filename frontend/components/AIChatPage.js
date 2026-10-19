(() => {
    const AIChatPage = {
        name: 'AIChatPage',
        template: `
            <div class="ai-chat-page">
                <div class="ai-chat-sidebar" :class="{ 'open': sidebarOpen }">
                    <div class="sidebar-header">
                        <div class="sidebar-title">
                            <i class="fas fa-history"></i>
                            <span>聊天记录</span>
                        </div>
                        <button class="sidebar-toggle" @click="toggleSidebar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="chat-history">
                        <div v-if="chatHistory.length === 0" class="empty-history">
                            <i class="fas fa-comment-slash"></i>
                            <span>暂无聊天记录</span>
                        </div>
                        <div v-else class="history-list">
                            <div v-for="(chat, index) in chatHistory" :key="chat.id" class="history-item" :class="{ 'active': activeChatId === chat.id }">
                                <div class="history-item-content" @click="loadChatById(chat.id)">
                                    <div class="history-time">{{ chat.time }}</div>
                                    <div class="history-content">{{ chat.message }}</div>
                                </div>
                                <button class="history-delete-btn" @click.stop="deleteChat(chat.id)">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="new-chat-button" @click="createNewChat">
                            <i class="fas fa-plus"></i>
                            <span>构建新聊天</span>
                        </div>
                    </div>
                </div>

                <button class="sidebar-open-btn" @click="toggleSidebar" v-if="!sidebarOpen">
                    <i class="fas fa-history"></i>
                </button>

                <div class="ai-chat-main" :class="{ 'sidebar-open': sidebarOpen }">
                    <div class="ai-chat-content">
                        <div v-if="currentView === 'cards'" class="cards-view">
                            <div class="cards-header">
                                <h2><i class="fas fa-shield-alt"></i> AI反诈场景</h2>
                                <p>点击下方卡片进入对应场景，体验沉浸式防诈对话</p>
                            </div>
                            <div class="cards-grid">
                                <div v-for="card in scenarioCards" :key="card.id" class="scenario-card" @click="enterScenario(card)">
                                    <div class="card-icon">
                                        <img :src="card.image" :alt="card.title" />
                                    </div>
                                    <div class="card-info">
                                        <div class="card-desc">{{ card.description }}</div>
                                    </div>
                                </div>
                            </div>
                            <button class="direct-chat-btn" @click="enterDirectChat">
                                <i class="fas fa-comments"></i> 直接进入对话
                            </button>
                        </div>

                        <div v-else-if="currentView === 'scenario'" class="scenario-view">
                            <div class="scenario-header">
                                <button class="back-btn" @click="backToCards">
                                    <i class="fas fa-arrow-left"></i> 返回场景选择
                                </button>
                                <div class="scenario-title">{{ currentScenario?.title }}</div>
                            </div>
                            <div class="chat-interface">
                                <div class="chat-messages" ref="chatMessages">
                                    <template v-for="(msg, index) in messages">
                                        <div v-if="shouldShowTime(index)" :key="'time-' + index" class="time-divider">
                                            <span class="time-label">{{ msg.time }}</span>
                                        </div>
                                        <div :key="index" class="message" :class="msg.role">
                                            <div class="message-avatar-wrap">
                                                <div class="message-avatar">
                                                    <img v-if="msg.role === 'user' && getCurrentUserAvatar()" :src="getCurrentUserAvatar()" alt="用户" class="user-avatar">
                                                    <i v-else-if="msg.role === 'user'" class="fas fa-user"></i>
                                                    <img v-else src="/robot.jpg" alt="AI" class="ai-avatar">
                                                </div>
                                            </div>
                                            <div class="message-content" @dblclick.stop="toggleMsgSpeech(index)" v-if="msg.role === 'ai'">
                                                <div class="message-text" v-html="msg.content"></div>
                                                <button 
                                                    v-if="msg.content && msg.content.trim()" 
                                                    class="speak-btn-bubble" 
                                                    @click.stop="toggleSpeak(index)" 
                                                    :class="{ speaking: msg.isSpeaking, paused: msg.isPaused }"
                                                >
                                                    <i class="fas" :class="msg.isPaused ? 'fa-play' : (msg.isSpeaking ? 'fa-volume-off' : 'fa-volume-up')"></i>
                                                </button>
                                            </div>
                                            <div class="message-content" v-else>
                                                <div class="message-text" v-html="msg.content"></div>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                                <div class="input-section">
                                    <div class="input-wrapper">
                                        <div class="input-label">AI反诈助手</div>
                                        <textarea 
                                            v-model="userMessage" 
                                            rows="3" 
                                            class="chat-input" 
                                            :placeholder="currentScenario?.prompt || '输入您的回复...'"
                                            @keydown.enter.exact.prevent="sendMessage"
                                        ></textarea>
                                        <button class="send-btn" @click="sendMessage" :disabled="!userMessage.trim()">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="direct-chat-view">
                            <div v-if="!chatStarted" class="chat-welcome">
                                <h2>有什么我能帮你？</h2>
                                <div class="quick-questions">
                                    <button v-for="q in quickQuestions" :key="q" class="quick-question-btn" @click="selectQuestion(q)">
                                        {{ q }}
                                    </button>
                                </div>
                            </div>
                            <div class="chat-interface">
                                <div class="chat-messages" ref="chatMessages">
                                    <template v-for="(msg, index) in messages">
                                        <div v-if="shouldShowTime(index)" :key="'time-' + index" class="time-divider">
                                            <span class="time-label">{{ msg.time }}</span>
                                        </div>
                                        <div :key="index" class="message" :class="msg.role">
                                            <div class="message-avatar-wrap">
                                                <div class="message-avatar">
                                                    <img v-if="msg.role === 'user' && getCurrentUserAvatar()" :src="getCurrentUserAvatar()" alt="用户" class="user-avatar">
                                                    <i v-else-if="msg.role === 'user'" class="fas fa-user"></i>
                                                    <img v-else src="/robot.jpg" alt="AI" class="ai-avatar">
                                                </div>
                                            </div>
                                            <div class="message-content" @dblclick.stop="toggleMsgSpeech(index)" v-if="msg.role === 'ai'">
                                                <div class="message-text" v-html="msg.content"></div>
                                                <button 
                                                    v-if="msg.content && msg.content.trim()" 
                                                    class="speak-btn-bubble" 
                                                    @click.stop="toggleSpeak(index)" 
                                                    :class="{ speaking: msg.isSpeaking, paused: msg.isPaused }"
                                                >
                                                    <i class="fas" :class="msg.isPaused ? 'fa-play' : (msg.isSpeaking ? 'fa-volume-off' : 'fa-volume-up')"></i>
                                                </button>
                                            </div>
                                            <div class="message-content" v-else>
                                                <div class="message-text" v-html="msg.content"></div>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                                <div class="input-section">
                                    <div class="input-wrapper">
                                        <div class="input-label">AI反诈助手</div>
                                        <textarea 
                                            v-model="userMessage" 
                                            rows="3" 
                                            class="chat-input" 
                                            placeholder="输入中介/房东的话术，AI帮您识别骗局并提供建议"
                                            @keydown.enter.exact.prevent="sendMessage"
                                        ></textarea>
                                        <button class="send-btn" @click="sendMessage" :disabled="!userMessage.trim()">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        data() {
            let parsedData = {};
            try {
                const savedData = localStorage.getItem('ai_chat_data');
                if (savedData) {
                    parsedData = JSON.parse(savedData);
                }
            } catch (e) {
                console.error('Failed to parse ai_chat_data:', e);
            }
            
            return {
                sidebarOpen: false,
                currentView: 'cards',
                currentScenario: null,
                chatStarted: parsedData.chatStarted || false,
                userMessage: '',
                messages: (parsedData.messages || []).map(m => ({
                    ...m,
                    isSpeaking: false,
                    isPaused: false,
                    streaming: false
                })),
                chatHistory: parsedData.chatHistory || [],
                sessionId: parsedData.sessionId || null,
                activeChatId: parsedData.activeChatId || null,
                chats: parsedData.chats || [],
                isStreaming: false,
                speakingIndex: -1,
                showSpeakButton: false,
                canShowSpeakButton: false,
                lastAiContent: '',
                isSpeaking: false,
                isSpeechPaused: false,
                lastScrollPosition: undefined,
                scenarioCards: [
                    {
                        id: 1,
                        title: '先交定金',
                        description: '中介要求先交定金锁定房源',
                        context: '你正在租房，中介发来消息说："这套房很抢手，今天不交定金明天就没了，先交1000元定金帮你锁房。"',
                        prompt: '面对这种情况，你会怎么回复？',
                        image: '../house-images/icons/advance_deposit.png',
                        initialMessage: '这套房很抢手，今天不交定金明天就没了，先交1000元定金帮你锁房。'
                    },
                    {
                        id: 2,
                        title: '制造焦虑',
                        description: '对方制造房源即将被抢的紧迫感',
                        context: '中介催促你："这套房太稀缺了，已经有三个人在看了，你再不决定马上就被别人抢走了！"',
                        prompt: '面对这种催促，你会怎么应对？',
                        image: '../house-images/icons/manufacturing_anxiety.png',
                        initialMessage: '这套房太稀缺了，已经有三个人在看了，你再不决定马上就被别人抢走了！'
                    },
                    {
                        id: 3,
                        title: '甲醛房陷阱',
                        description: '精装修房屋可能存在甲醛超标',
                        context: '房东介绍房子："这是全新装修的串串房，刚装修好，家具家电都是新的，拎包就能住。"',
                        prompt: '你会如何询问房屋的空气质量问题？',
                        image: '../house-images/icons/formaldehyde_house.png',
                        initialMessage: '这是全新装修的串串房，刚装修好，家具家电都是新的，拎包就能住。'
                    },
                    {
                        id: 4,
                        title: '虚假低价',
                        description: '价格明显低于市场价吸引租客',
                        context: '中介发消息："这套房价格比市场价低2000元，只限今天，明天就涨价！"',
                        prompt: '面对如此诱人的低价，你会怎么做？',
                        image: '../house-images/icons/false_low_price.png',
                        initialMessage: '这套房价格比市场价低2000元，只限今天，明天就涨价！'
                    },
                    {
                        id: 5,
                        title: '不签合同',
                        description: '要求跳过正规合同直接转账',
                        context: '房东说："签合同太麻烦了，我们直接微信转账就行，我把钥匙寄给你。"',
                        prompt: '面对这种要求，你会怎么回应？',
                        image: '../house-images/icons/no_contract.png',
                        initialMessage: '签合同太麻烦了，我们直接微信转账就行，我把钥匙寄给你。'
                    },
                    {
                        id: 6,
                        title: '虚假房源',
                        description: '无法实地看房的视频看房骗局',
                        context: '中介说："房东在外地出差，没法带你实地看房，我们视频看房就行，保证和视频里一样。"',
                        prompt: '你会接受视频看房吗？如何回应？',
                        image: '../house-images/icons/false_house.png',
                        initialMessage: '房东在外地出差，没法带你实地看房，我们视频看房就行，保证和视频里一样。'
                    },
                    {
                        id: 7,
                        title: '多次收费',
                        description: '以各种名义重复收取费用',
                        context: '中介说："除了房租和押金，还需要交中介费、物业费、水电费押金、网费押金。"',
                        prompt: '面对这么多费用，你会怎么处理？',
                        image: '../house-images/icons/multiple_charges.png',
                        initialMessage: '除了房租和押金，还需要交中介费、物业费、水电费押金、网费押金。'
                    },
                    {
                        id: 8,
                        title: '过度美化',
                        description: '图片与实际房屋严重不符',
                        context: '你实地看房发现："图片上是精装修拎包入住，实际墙面发霉、家电陈旧。"',
                        prompt: '发现房屋与描述不符，你会怎么做？',
                        image: '../house-images/icons/excessive_ beautification.png',
                        initialMessage: '图片上是精装修拎包入住，实际墙面发霉、家电陈旧。'
                    }
                ],
                quickQuestions: [
                    '如何识别租房诈骗？',
                    '租房时需要注意哪些事项？',
                    '遇到虚假房源怎么办？',
                    '签租房合同要注意什么？',
                    '交定金前需要核实什么？'
                ],
                apiCallCount: 0,
                lastApiError: null
            };
        },
        mounted() {
            if (this.chatStarted && this.messages.length > 0) {
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            }
        },
        activated() {
            this.isSpeaking = false;
            this.isSpeechPaused = false;
            
            this.$nextTick(() => {
                if (this.lastScrollPosition !== undefined) {
                    const chatMessages = this.$refs.chatMessages;
                    if (chatMessages) {
                        chatMessages.scrollTop = this.lastScrollPosition;
                    }
                }
            });
        },
        deactivated() {
            this.stopSpeaking();
            
            const chatMessages = this.$refs.chatMessages;
            if (chatMessages) {
                this.lastScrollPosition = chatMessages.scrollTop;
            }
        },
        watch: {
            chatStarted: {
                handler() {
                    this.saveChatData();
                },
                deep: true
            },
            messages: {
                handler() {
                    this.saveChatData();
                },
                deep: true
            },
            chatHistory: {
                handler() {
                    this.saveChatData();
                },
                deep: true
            },
            sessionId: {
                handler() {
                    this.saveChatData();
                }
            }
        },
        methods: {
            toggleSidebar() {
                this.sidebarOpen = !this.sidebarOpen;
            },
            shouldShowTime(index) {
                if (index === 0) return true;
                if ((index + 1) % 5 === 0) return true;
                return false;
            },
            getCurrentUserAvatar() {
                try {
                    return window.Anju?.globalState?.currentUser?.avatar || null;
                } catch (e) {
                    return null;
                }
            },
            toggleSpeak(index) {
                try {
                    const speechService = window.Anju?.speechService;
                    if (!speechService) {
                        return;
                    }
                    
                    const msg = this.messages[index];
                    if (!msg) return;
                    
                    // 如果当前消息正在播报，点击喇叭停止播报
                    if (msg.isSpeaking) {
                        speechService.stop();
                        msg.isSpeaking = false;
                        msg.isPaused = false;
                        return;
                    }
                    
                    // 先停止所有播报
                    speechService.stop();
                    this.messages.forEach(m => {
                        m.isSpeaking = false;
                        m.isPaused = false;
                    });
                    
                    // 获取纯文本
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = msg.content;
                    const text = tempDiv.textContent || tempDiv.innerText || '';
                    
                    if (!text.trim()) {
                        return;
                    }
                    
                    // 标记当前消息开始播报
                    msg.isSpeaking = true;
                    msg.isPaused = false;
                    
                    // 保存当前索引，用于回调时更新状态
                    const currentIndex = index;
                    
                    const success = speechService.speak(text, {
                        lang: 'zh-CN',
                        onEnd: () => {
                            // 播报完成，清除状态（允许再次播报）
                            if (this.messages[currentIndex]) {
                                this.messages[currentIndex].isSpeaking = false;
                                this.messages[currentIndex].isPaused = false;
                            }
                        },
                        onError: () => {
                            if (this.messages[currentIndex]) {
                                this.messages[currentIndex].isSpeaking = false;
                                this.messages[currentIndex].isPaused = false;
                            }
                        }
                    });
                    
                    if (!success) {
                        msg.isSpeaking = false;
                        msg.isPaused = false;
                    }
                } catch (e) {
                    console.error('Speech error:', e);
                    if (this.messages[index]) {
                        this.messages[index].isSpeaking = false;
                        this.messages[index].isPaused = false;
                    }
                }
            },
            toggleMsgSpeech(index) {
                try {
                    const speechService = window.Anju?.speechService;
                    if (!speechService) return;
                    
                    const msg = this.messages[index];
                    if (!msg || msg.role !== 'ai') return;
                    
                    if (msg.isSpeaking) {
                        if (msg.isPaused) {
                            // 当前暂停状态，双击恢复播报
                            speechService.resume();
                            msg.isPaused = false;
                        } else {
                            // 当前正在播报，双击暂停
                            speechService.pause();
                            msg.isPaused = true;
                        }
                    } else {
                        // 未播报，双击开始播报
                        this.toggleSpeak(index);
                    }
                } catch (e) {
                    console.error('Toggle msg speech error:', e);
                }
            },
            stopSpeaking() {
                try {
                    const speechService = window.Anju?.speechService;
                    if (speechService) {
                        speechService.stop();
                    }
                    this.isSpeaking = false;
                    this.showSpeakButton = false;
                } catch (e) {
                    console.error('Stop speech error:', e);
                }
            },
            enterScenario(card) {
                this.currentScenario = card;
                this.currentView = 'scenario';
                this.messages = [];
                this.userMessage = '';
                
                const userMsg = {
                    role: 'user',
                    content: card.initialMessage,
                    time: this.getCurrentTime()
                };
                this.messages = [userMsg];
                
                if (!this.activeChatId) {
                    const newChatId = Date.now().toString();
                    const newChat = {
                        id: newChatId,
                        messages: [userMsg],
                        sessionId: null,
                        createdTime: this.getCurrentTime(),
                        scenarioId: card.id
                    };
                    this.chats.unshift(newChat);
                    this.activeChatId = newChatId;
                } else {
                    const activeChat = this.chats.find(c => c.id === this.activeChatId);
                    if (activeChat) {
                        activeChat.messages = [...this.messages];
                        activeChat.scenarioId = card.id;
                    }
                }
                
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
                
                setTimeout(() => {
                    this.getAIResponse(card.initialMessage);
                }, 500);
            },
            backToCards() {
                this.stopSpeaking();
                this.currentView = 'cards';
                this.currentScenario = null;
                this.userMessage = '';
                this.canShowSpeakButton = false;
                this.lastAiContent = '';
                if (this.activeChatId) {
                    const activeChat = this.chats.find(c => c.id === this.activeChatId);
                    if (activeChat) {
                        this.messages = [...activeChat.messages];
                    }
                }
            },
            enterDirectChat() {
                const newChatId = Date.now().toString();
                const newChat = {
                    id: newChatId,
                    messages: [],
                    sessionId: null,
                    createdTime: this.getCurrentTime(),
                    scenarioId: null
                };
                this.chats.unshift(newChat);
                this.activeChatId = newChatId;
                this.messages = [];
                this.sessionId = null;
                this.userMessage = '';
                this.chatStarted = false;
                this.currentView = 'direct';
                this.currentScenario = null;
                this.saveChatData();
            },
            selectQuestion(question) {
                this.userMessage = question;
                this.sendMessage();
            },
            sendMessage() {
                if (!this.userMessage.trim()) return;
                
                this.chatStarted = true;
                
                if (!this.activeChatId) {
                    const newChatId = Date.now().toString();
                    const newChat = {
                        id: newChatId,
                        messages: [],
                        sessionId: null,
                        createdTime: this.getCurrentTime(),
                        scenarioId: this.currentScenario?.id || null
                    };
                    this.chats.unshift(newChat);
                    this.activeChatId = newChatId;
                }
                
                const userMsg = {
                    role: 'user',
                    content: this.userMessage,
                    time: this.getCurrentTime()
                };
                
                const activeChat = this.chats.find(chat => chat.id === this.activeChatId);
                if (activeChat) {
                    activeChat.messages.push(userMsg);
                    this.messages = [...activeChat.messages];
                    activeChat.scenarioId = this.currentScenario?.id || activeChat.scenarioId;
                }
                
                const chatHistoryItem = {
                    id: this.activeChatId,
                    message: this.userMessage,
                    time: this.getCurrentTime()
                };
                
                const existingIndex = this.chatHistory.findIndex(item => item.id === this.activeChatId);
                if (existingIndex >= 0) {
                    this.chatHistory[existingIndex] = chatHistoryItem;
                } else {
                    this.chatHistory.unshift(chatHistoryItem);
                }
                
                const messageToSend = this.userMessage;
                this.userMessage = '';
                
                this.$nextTick(() => {
                    const textarea = document.querySelector('.chat-input');
                    if (textarea) {
                        textarea.style.height = 'auto';
                        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
                    }
                    this.scrollToBottom();
                });
                
                this.saveChatData();
                
                this.getAIResponse(messageToSend);
            },
            scrollToBottom() {
                const chatMessages = this.$refs.chatMessages;
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            },
            async getAIResponse(msg) {
                const activeChat = this.chats.find(chat => chat.id === this.activeChatId);
                
                const aiMsg = {
                    role: 'ai',
                    content: '',
                    time: this.getCurrentTime(),
                    streaming: true,
                    isSpeaking: false,
                    isPaused: false
                };
                
                this.messages.push(aiMsg);
                const msgIndex = this.messages.length - 1;
                
                if (activeChat) {
                    activeChat.messages.push({...aiMsg});
                }
                
                await this.$nextTick();
                this.scrollToBottom();
                
                let fullResponse = '';
                
                try {
                    const response = await fetch(`${window.Anju.AI_API_BASE_URL}/ai/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: msg, houseId: null, sessionId: this.sessionId }),
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        fullResponse = data.data?.reply || data.reply || '';
                        
                        if (fullResponse && !fullResponse.includes('暂时无法提供') && !fullResponse.includes('无法提供')) {
                            this.sessionId = data.data?.sessionId || data.sessionId || this.sessionId;
                            if (activeChat) activeChat.sessionId = this.sessionId;
                        }
                    }
                } catch (error) {
                    console.error(`[AI Chat] Backend call failed:`, error);
                }
                
                if (!fullResponse || fullResponse.includes('暂时无法提供') || fullResponse.includes('无法提供')) {
                    fullResponse = this.generateLocalAIResponse(msg);
                }
                
                if (fullResponse && fullResponse.trim()) {
                    fullResponse = this.parseMarkdown(fullResponse);
                    
                    this.canShowSpeakButton = true;
                    this.isStreaming = true;
                    
                    this.startStreamingSpeech(fullResponse);
                    
                    for (let i = 0; i < fullResponse.length; i++) {
                        const char = fullResponse[i];
                        const currentMsg = this.messages[msgIndex];
                        const newContent = currentMsg.content + char;
                        
                        this.messages.splice(msgIndex, 1, {
                            ...currentMsg,
                            content: newContent,
                            streaming: true
                        });
                        
                        if (activeChat && activeChat.messages.length > 0) {
                            const chatIndex = activeChat.messages.length - 1;
                            activeChat.messages.splice(chatIndex, 1, {
                                ...activeChat.messages[chatIndex],
                                content: newContent,
                                streaming: true
                            });
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 40));
                        
                        if (i % 20 === 0) {
                            await this.$nextTick();
                            this.scrollToBottom();
                        }
                    }
                    
                    await this.$nextTick();
                    this.scrollToBottom();
                    
                    this.isStreaming = false;
                    
                    this.messages.splice(msgIndex, 1, {
                        ...this.messages[msgIndex],
                        streaming: false
                    });
                    
                    if (activeChat && activeChat.messages.length > 0) {
                        const chatIndex = activeChat.messages.length - 1;
                        activeChat.messages.splice(chatIndex, 1, {
                            ...activeChat.messages[chatIndex],
                            streaming: false
                        });
                    }
                    
                    this.lastAiContent = this.messages[msgIndex].content;
                } else {
                    this.messages.splice(msgIndex, 1, {
                        ...this.messages[msgIndex],
                        content: '抱歉，AI服务暂时不可用，请稍后重试。'
                    });
                    if (activeChat && activeChat.messages.length > 0) {
                        const chatIndex = activeChat.messages.length - 1;
                        activeChat.messages.splice(chatIndex, 1, {
                            ...activeChat.messages[chatIndex],
                            content: '抱歉，AI服务暂时不可用，请稍后重试。'
                        });
                    }
                    await this.$nextTick();
                    this.scrollToBottom();
                }
                
                this.saveChatData();
            },
            startStreamingSpeech(text) {
                try {
                    const speechService = window.Anju?.speechService;
                    if (!speechService) return;
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = text;
                    const plainText = tempDiv.textContent || tempDiv.innerText || '';
                    
                    if (!plainText.trim()) return;
                    
                    this.messages.forEach(m => {
                        m.isSpeaking = false;
                        m.isPaused = false;
                    });
                    
                    const lastMsg = this.messages[this.messages.length - 1];
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
                    console.error('Streaming speech error:', e);
                    const lastMsg = this.messages[this.messages.length - 1];
                    if (lastMsg) {
                        lastMsg.isSpeaking = false;
                        lastMsg.isPaused = false;
                    }
                }
            },
            
            async streamResponse(text, activeChat) {
                const aiMsg = {
                    role: 'ai',
                    content: '',
                    time: this.getCurrentTime()
                };
                
                this.messages.push(aiMsg);
                
                if (activeChat) {
                    const activeChatAiMsg = {
                        role: 'ai',
                        content: '',
                        time: this.getCurrentTime()
                    };
                    activeChat.messages.push(activeChatAiMsg);
                }
                
                await this.$nextTick();
                
                let currentIndex = this.messages.length - 1;
                let aiMessage = this.messages[currentIndex];
                
                for (let i = 0; i < text.length; i++) {
                    if (!this.isStreaming) break;
                    
                    aiMessage.content += text[i];
                    
                    if (activeChat && activeChat.messages.length > 0) {
                        const chatIndex = activeChat.messages.length - 1;
                        activeChat.messages[chatIndex].content = aiMessage.content;
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 30));
                    
                    if (i % 15 === 0) {
                        this.$forceUpdate();
                        this.$nextTick(() => {
                            this.scrollToBottom();
                        });
                    }
                }
                
                this.$forceUpdate();
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
                
                this.saveChatData();
                
                this.canShowSpeakButton = true;
                this.lastAiContent = aiMessage.content;
            },
            generateLocalAIResponse(msg) {
                let reply = '';
                if (msg.includes('定金') || msg.includes('押金') || msg.includes('先交')) {
                    reply = '⚠️ 高风险话术！正规租房流程不应在看房前收取定金，警惕诈骗，请勿转账。建议回复：我先看房再决定。';
                } else if (msg.includes('稀缺') || msg.includes('马上没了') || msg.includes('抢走')) {
                    reply = '⚠️ 常见紧迫感话术，制造焦虑，建议核实房源真实性，可以多方对比。';
                } else if (msg.includes('串串房') || msg.includes('全新装修') || msg.includes('甲醛')) {
                    reply = '🏚️ 警惕串串房/甲醛房！务必要求出示空气质量检测报告，或自带试纸检测。';
                } else if (msg.includes('低于市场价') || msg.includes('只限今天') || msg.includes('涨价')) {
                    reply = '⚠️ 虚假低价陷阱！价格明显低于市场价且限时，很可能是骗局。建议实地看房并对比周边价格。';
                } else if (msg.includes('不签合同') || msg.includes('微信转账') || msg.includes('太麻烦')) {
                    reply = '⚠️ 严重风险！不签合同直接转账是典型的诈骗行为，请务必签署正规租赁合同。';
                } else if (msg.includes('在外地') || msg.includes('视频看房') || msg.includes('出差')) {
                    reply = '⚠️ 虚假房源风险！房东在外地只提供视频看房，很可能是虚假房源，建议要求实地看房。';
                } else if (msg.includes('多次收费') || msg.includes('押金') || msg.includes('中介费') || msg.includes('物业费')) {
                    reply = '⚠️ 不合理收费！正规租房通常只需支付押金和房租，多次收费可能是诈骗。要求提供正规发票。';
                } else if (msg.includes('精装修') || msg.includes('拎包入住') || msg.includes('图片') || msg.includes('发霉')) {
                    reply = '⚠️ 过度美化话术！精装修拎包入住可能是掩盖房屋问题，建议实地考察房屋状况并拍照留存。';
                } else if (msg.includes('识别') || msg.includes('注意') || msg.includes('怎么办')) {
                    reply = '✅ 识别租房诈骗的关键要点：1.不提前交定金 2.核实房源真实性 3.签订正规合同 4.不相信低价陷阱 5.要求实地看房 6.索取正规发票。';
                } else if (msg.includes('合同')) {
                    reply = '✅ 签租房合同注意事项：1.确认房东身份和房产证 2.明确租金、押金金额及支付方式 3.约定租期和违约责任 4.列明房屋设施清单 5.明确维修责任 6.注意合同期限和续租条款。';
                } else {
                    reply = '✅ 目前未发现明显诈骗词汇，但依旧注意不要提前付款，签署正规合同。如有具体话术可以发给我帮您分析。';
                }
                return reply + ' (本地分析)';
            },
            parseMarkdown(text) {
                text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                text = text.replace(/^\s*\d+\.\s+/gm, '<br><span style="margin-left: 20px;">• </span>');
                text = text.replace(/^\s*[-*+]\s+/gm, '<br><span style="margin-left: 20px;">• </span>');
                text = text.replace(/\n/g, '<br>');
                return text;
            },
            getCurrentTime() {
                const now = new Date();
                return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            },
            createNewChat() {
                this.stopSpeaking();
                
                const newChatId = Date.now().toString();
                const newChat = {
                    id: newChatId,
                    messages: [],
                    sessionId: null,
                    createdTime: this.getCurrentTime()
                };
                
                this.chats.unshift(newChat);
                this.activeChatId = newChatId;
                this.messages = [];
                this.sessionId = null;
                this.userMessage = '';
                this.chatStarted = false;
                this.currentView = 'cards';
                this.currentScenario = null;
                this.canShowSpeakButton = false;
                this.lastAiContent = '';
                
                this.saveChatData();
            },
            createNewChatForPhrase() {
                const newChatId = Date.now().toString();
                const newChat = {
                    id: newChatId,
                    messages: [],
                    sessionId: null,
                    createdTime: this.getCurrentTime()
                };
                
                this.chats.unshift(newChat);
                this.activeChatId = newChatId;
                this.messages = [];
                this.sessionId = null;
                
                this.saveChatData();
            },
            loadChatById(chatId) {
                this.stopSpeaking();
                
                const chat = this.chats.find(c => c.id === chatId);
                if (chat) {
                    this.activeChatId = chatId;
                    this.messages = chat.messages.map(m => ({
                        ...m,
                        isSpeaking: false,
                        isPaused: false,
                        streaming: false
                    }));
                    this.sessionId = chat.sessionId || null;
                    this.chatStarted = true;
                    this.currentView = 'direct';
                    
                    this.saveChatData();
                    
                    this.$nextTick(() => {
                        this.scrollToBottom();
                    });
                }
            },
            deleteChat(chatId) {
                this.stopSpeaking();
                
                this.chatHistory = this.chatHistory.filter(chat => chat.id !== chatId);
                this.chats = this.chats.filter(chat => chat.id !== chatId);
                
                if (this.activeChatId === chatId) {
                    this.activeChatId = null;
                    this.messages = [];
                    this.sessionId = null;
                    this.chatStarted = false;
                    this.currentView = 'cards';
                    this.currentScenario = null;
                }
                
                this.saveChatData();
            },
            saveChatData() {
                const chatData = {
                    chatStarted: this.chatStarted,
                    messages: this.messages,
                    chatHistory: this.chatHistory,
                    sessionId: this.sessionId,
                    activeChatId: this.activeChatId,
                    chats: this.chats
                };
                localStorage.setItem('ai_chat_data', JSON.stringify(chatData));
            }
        }
    };

    window.Components = window.Components || {};
    window.Components.AIChatPage = AIChatPage;
})();