(() => {
    Vue.component('AvatarUploader', {
        props: {
            modelValue: {
                type: String,
                default: ''
            },
            size: {
                type: Number,
                default: 128
            }
        },
        data() {
            return {
                previewUrl: this.modelValue || '',
                isUploading: false,
                errorMessage: ''
            };
        },
        watch: {
            modelValue(val) {
                this.previewUrl = val || '';
            }
        },
        methods: {
            async handleFileChange(event) {
                const file = event.target.files[0];
                if (!file) return;

                this.errorMessage = '';

                if (!this.validateFile(file)) {
                    return;
                }

                try {
                    this.isUploading = true;
                    
                    const resizedImage = await this.resizeImage(file);
                    this.previewUrl = resizedImage;
                    
                    this.$emit('update:modelValue', resizedImage);
                    this.$emit('change', resizedImage);
                } catch (error) {
                    this.errorMessage = '图片处理失败，请重试';
                    console.error('Image processing error:', error);
                } finally {
                    this.isUploading = false;
                    event.target.value = '';
                }
            },
            validateFile(file) {
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                const maxSize = 2 * 1024 * 1024;

                if (!allowedTypes.includes(file.type)) {
                    this.errorMessage = '请选择JPG或PNG格式的图片';
                    return false;
                }

                if (file.size > maxSize) {
                    this.errorMessage = '图片大小不能超过2MB';
                    return false;
                }

                return true;
            },
            resizeImage(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const img = new Image();
                        
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            const minSize = Math.min(img.width, img.height);
                            const startX = (img.width - minSize) / 2;
                            const startY = (img.height - minSize) / 2;
                            
                            canvas.width = this.size;
                            canvas.height = this.size;
                            
                            ctx.drawImage(img, startX, startY, minSize, minSize, 0, 0, this.size, this.size);
                            
                            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            resolve(resizedDataUrl);
                        };
                        
                        img.onerror = reject;
                        img.src = e.target.result;
                    };
                    
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            },
            removeAvatar() {
                this.previewUrl = '';
                this.$emit('update:modelValue', '');
                this.$emit('change', '');
            }
        },
        template: `
            <div class="avatar-uploader">
                <div class="avatar-preview" :style="{ width: size + 'px', height: size + 'px' }">
                    <img v-if="previewUrl" :src="previewUrl" alt="头像" class="avatar-image">
                    <div v-else class="avatar-placeholder">
                        <i class="fas fa-user-circle"></i>
                        <span>点击上传</span>
                    </div>
                    <div class="avatar-overlay">
                        <input 
                            type="file" 
                            accept="image/jpeg,image/jpg,image/png" 
                            class="avatar-input"
                            @change="handleFileChange"
                            :disabled="isUploading"
                        >
                        <div class="avatar-overlay-content">
                            <i class="fas fa-camera"></i>
                            <span class="overlay-text">{{ previewUrl ? '更换头像' : '上传头像' }}</span>
                        </div>
                        <button v-if="previewUrl" class="remove-btn" @click.stop="removeAvatar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div v-if="isUploading" class="uploading-text">
                    <i class="fas fa-spinner fa-spin"></i> 处理中...
                </div>
                <div v-if="errorMessage" class="error-text">{{ errorMessage }}</div>
                <div class="hint-text">支持JPG、PNG格式，大小不超过2MB</div>
            </div>
        `
    });
})();
