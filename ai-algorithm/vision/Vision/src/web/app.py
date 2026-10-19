import os
import sys
import uuid
import torch
import numpy as np
from PIL import Image
import torch.nn.functional as F
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
from werkzeug.utils import secure_filename
import albumentations as A
from albumentations.pytorch import ToTensorV2

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.models import get_model
from utils.logger import setup_logger, log_info
from src.services.image_analyzer import analyze_for_rent_upload
from src.services.ocr_detector import extract_ocr
from src.services.furniture_detector import detect_furniture
from src.services.room_quality_detector import analyze_room_quality
from src.services.piracy_detector import check_similarity, load_hashes_from_directory

# 项目根目录
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))

# 日志（必须在加载哈希前定义）
logger = setup_logger("WebApp", "INFO")

# 配置
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'static', 'uploads')
KNOWN_IMAGES_DIR = os.path.join(PROJECT_ROOT, 'static', 'known_images')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 加载参考图片哈希（盗图检测用）
image_hashes = {}
if os.path.exists(KNOWN_IMAGES_DIR):
    image_hashes = load_hashes_from_directory(KNOWN_IMAGES_DIR, logger=logger)
    logger.info(f"盗图检测参考库已加载，包含 {len(image_hashes)} 张图片")
else:
    logger.info(f"盗图检测参考库目录不存在: {KNOWN_IMAGES_DIR}，盗图检测功能将不可用")

# 创建Flask应用
app = Flask(
    __name__,
    template_folder=os.path.join(PROJECT_ROOT, 'templates'),
    static_folder=os.path.join(PROJECT_ROOT, 'static'),
)
app.secret_key = 'image_forensics_detector_key'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# 全局模型相关变量
model = None
device = None
img_size = 224
transform = None


def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file):
    """保存上传的文件，返回路径和文件名"""
    filename = secure_filename(file.filename)
    token = uuid.uuid4().hex
    filename = f"{token}_{filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    return filepath, filename


def load_model(model_path, model_name='efficientnet_b0', multi_task=False):
    """加载训练好的模型"""
    global model, device, transform
    if not os.path.isfile(model_path):
        raise FileNotFoundError(f"模型文件不存在: {model_path}")

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = get_model(model_name, num_classes=2, pretrained=True, multi_task=multi_task)
    checkpoint = torch.load(model_path, map_location=device)
    if 'model_state_dict' not in checkpoint:
        raise KeyError("模型 checkpoint 不包含 model_state_dict")
    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()

    transform = A.Compose([
        A.Resize(img_size, img_size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])

    log_info(f"模型 '{model_name}' 已加载，设备：{device}", logger)


def predict_image(image_path):
    """执行图像预测（伪造检测/多任务）"""
    if model is None or transform is None or device is None:
        raise RuntimeError("模型未加载，请先调用 load_model()")
    img = Image.open(image_path).convert('RGB')
    img_np = np.array(img)
    img_tensor = transform(image=img_np)['image'].unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img_tensor)
        if isinstance(outputs, dict):  # 多任务模型
            forgery_probs = F.softmax(outputs['forgery'], dim=1)[0]
            ai_probs = F.softmax(outputs['ai'], dim=1)[0]
            if forgery_probs.shape[0] < 2 or ai_probs.shape[0] < 2:
                raise ValueError("多任务概率输出不是2类")
            forgery_pred = torch.argmax(forgery_probs).item()
            ai_pred = torch.argmax(ai_probs).item()
            return {
                'class': '伪造' if forgery_pred == 1 else '真实',
                'fake_prob': float(forgery_probs[1].item() * 100),
                'real_prob': float(forgery_probs[0].item() * 100),
                'ai_class': 'AI生成' if ai_pred == 1 else '非AI生成',
                'ai_prob': float(ai_probs[1].item() * 100),
                'non_ai_prob': float(ai_probs[0].item() * 100)
            }
        else:  # 单任务模型
            probs = F.softmax(outputs, dim=1)[0]
            if probs.shape[0] < 2:
                raise ValueError("单任务概率输出不是2类")
            pred_class = torch.argmax(probs).item()
            return {
                'class': '伪造' if pred_class == 1 else '真实',
                'fake_prob': float(probs[1].item() * 100),
                'real_prob': float(probs[0].item() * 100)
            }


def analyze_image(image_path):
    """对单张图片进行完整分析（用于 upload 路由）"""
    try:
        result = predict_image(image_path)
    except Exception as e:
        log_info(f"predict_image 失败: {e}", logger)
        result = {
            'class': '未知', 'fake_prob': 0.0, 'real_prob': 0.0,
            'ai_class': '未知', 'ai_prob': 0.0, 'non_ai_prob': 0.0
        }

    # 使用 services 模块中的功能
    result['ocr_text'] = extract_ocr(image_path, logger=logger)
    result['furniture'] = detect_furniture(image_path, logger=logger)
    result['similarity_score'] = check_similarity(image_path, image_hashes, logger=logger)

    try:
        result['room_quality'] = analyze_room_quality(result['ocr_text'], result['furniture'])
    except Exception as e:
        log_info(f"room_quality 计算失败: {e}", logger)
        result['room_quality'] = {
            'tier': 'medium',
            'scores': {'overall': 0, 'decor': 0, 'safety': 0},
            'cheap_decor_risk': 'medium',
            'formaldehyde_risk_hint': 'room_quality 计算失败（仅供参考）。'
        }

    result['plagiarism_suspicion'] = "高" if result['similarity_score'] > 0.8 else "低"
    return result


# ==================== 路由 ====================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('未选择文件')
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        flash('未选择文件')
        return redirect(request.url)
    if file and allowed_file(file.filename):
        filepath, filename = save_uploaded_file(file)
        result = analyze_image(filepath)
        result['image_path'] = 'uploads/' + filename
        return render_template('result.html', result=result)
    flash('不支持的文件类型，请上传JPG、JPEG或PNG格式的图像')
    return redirect(url_for('index'))


@app.route('/api/predict', methods=['POST'])
def api_predict():
    if 'file' not in request.files:
        return jsonify({'error': '未选择文件'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400
    if file and allowed_file(file.filename):
        filepath, filename = save_uploaded_file(file)
        result = analyze_image(filepath)
        result['image_path'] = 'uploads/' + filename
        return jsonify(result)
    return jsonify({'error': '不支持的文件类型，请上传JPG、JPEG或PNG格式的图像'}), 400


@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """租房系统专用 API，支持按需返回字段"""
    if 'file' not in request.files:
        return jsonify({'error': '未选择文件'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400
    if file and allowed_file(file.filename):
        filepath, filename = save_uploaded_file(file)
        fields_param = request.form.get("fields", "").strip()
        fields_set = None
        if fields_param:
            allowed_fields = {"p_image", "ai_generated", "piracy", "room_quality", "ocr"}
            normalized = set(k for k in [p.strip().lower() for p in fields_param.split(",")] if k in allowed_fields)
            if normalized:
                fields_set = normalized
        response = analyze_for_rent_upload(
            image_path=filepath,
            forensics_predict_fn=predict_image,
            logger=logger,
            image_hashes=image_hashes,
            fields=fields_set,
        )
        response['image_path'] = 'uploads/' + filename
        return jsonify(response)
    return jsonify({'error': '不支持的文件类型，请上传JPG、JPEG或PNG格式的图像'}), 400


# ==================== 启动入口 ====================
def main():
    import argparse
    parser = argparse.ArgumentParser(description='图像伪造检测Web应用')
    parser.add_argument('--model-path', type=str, required=True, help='模型路径')
    parser.add_argument('--model-name', type=str, default='efficientnet_b0', help='模型名称')
    parser.add_argument('--port', type=int, default=5000, help='端口号')
    parser.add_argument('--debug', action='store_true', help='调试模式')
    parser.add_argument('--multi-task', action='store_true', help='启用多任务模型')
    args = parser.parse_args()

    try:
        load_model(args.model_path, args.model_name, multi_task=args.multi_task)
    except Exception as e:
        log_info(f"模型加载失败: {e}", logger)
        raise

    app.run(host='0.0.0.0', port=args.port, debug=args.debug)


if __name__ == '__main__':
    main()