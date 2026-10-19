# 安居·罗盘 - 视觉算法模块

基于深度学习的房源图片综合评估服务，支持 OCR 文本提取、家具检测、盗图相似度检查、房间质量评估与伪造/AI 生成识别。

## 核心特性

- **多模型架构支持**：集成 EfficientNet、ResNet、Xception 等前沿深度学习模型
- **现代化 Web 界面**：基于 Bootstrap 5.3.2 构建的响应式用户界面
- **综合图像评估**：支持 OCR 文本提取、家具检测、盗图相似度检查等功能
- **多任务学习**：支持伪造检测、AI 生成识别等多任务联合训练

##  项目架构

```
Vision/
│
├── src/                           # 源代码
│   ├── data_utils/                # 数据处理工具
│   │   ├── data_processor.py      # 数据预处理工具
│   │   └── unified_dataset.py     # 统一数据集类
│   │
│   ├── services/                  # 服务模块
│   │   ├── furniture_detector.py  # 家具检测
│   │   ├── image_analyzer.py      # 图像分析服务
│   │   ├── ocr_detector.py        # OCR文本提取
│   │   ├── piracy_detector.py     # 盗图检测
│   │   └── room_quality_detector.py # 房间质量评估
│   │
│   ├── training/                  # 训练相关
│   │   ├── evaluate.py            # 评估脚本
│   │   └── train_unified.py       # 统一训练模块
│   │
│   ├── utils/                     # 工具模块
│   │   └── logger.py              # 日志工具
│   │
│   └── web/                       # Web应用
│       └── app.py                 # Flask应用
│
├── static/                        # 静态资源
│   ├── css/                       # CSS样式
│   ├── img/                       # 图片资源
│   ├── js/                        # JavaScript
│   └── uploads/                   # 用户上传的图像
│
├── templates/                     # HTML模板
│   ├── about.html                 # 关于页面
│   ├── base.html                  # 基础模板
│   ├── index.html                 # 首页
│   └── result.html                # 结果页面
│
├── main.py                        # 项目主入口程序
├── README.md                      # 项目说明
└── requirements.txt               # 项目依赖
```

## 系统要求

- **Python**: 3.9+
- **PyTorch**: 2.0+（带CUDA支持）
- **GPU**: NVIDIA GPU，支持CUDA（8GB+显存）
- **内存**: 16GB
- **操作系统**: Windows、Ubuntu 20.04+或macOS 12+

##  安装

### 步骤1：创建Python环境
```bash
conda create -n vvpro python=3.9
conda activate vvpro
```

### 步骤2：安装依赖
```bash
cd ai-algorithm/vision/Vision
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 步骤3：安装OCR引擎（可选）
- 下载并安装 tesseract: https://github.com/UB-Mannheim/tesseract/wiki

##  快速开始

### 步骤1：生成测试数据
```bash
python main.py generate-data --real-dir data/real --ai-dir data/ai --fake-dir data/fake --num-real 30 --num-ai 30 --num-fake 30
```

### 步骤2：预处理图像
```bash
python main.py preprocess --input-dir data/real --output-dir data/processed/real --target-size 224 224
python main.py preprocess --input-dir data/ai --output-dir data/processed/ai --target-size 224 224
python main.py preprocess --input-dir data/fake --output-dir data/processed/fake --target-size 224 224
```

### 步骤3：训练模型
```bash
# 单任务训练
python main.py train --real-dir data/processed/real --fake-dir data/processed/fake --model efficientnet_b0 --pretrained --epochs 20 --batch-size 8 --save-dir models/saved

# 多任务训练
python main.py train --real-dir data/processed/real --ai-dir data/processed/ai --fake-dir data/processed/fake --multi-task --model efficientnet_b0 --pretrained --epochs 20 --batch-size 8 --save-dir models/saved
```

### 步骤4：启动Web应用
```bash
python main.py web --model-path models/saved/best_model.pth --model-name efficientnet_b0 --port 8080
```

### 步骤5：访问应用
打开浏览器访问[http://localhost:8080](http://localhost:8080)即可使用系统。

##  常见问题解决

### 端口占用问题
```bash
set FLASK_RUN_PORT=8080 && python main.py
```

### 依赖安装问题
```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

##  注意事项

- 确保Python 3.9+环境
- 使用`pip install -r requirements.txt`安装所有依赖
- 直接运行`python main.py`启动Web服务
- 如果有GPU，PyTorch会自动使用GPU加速