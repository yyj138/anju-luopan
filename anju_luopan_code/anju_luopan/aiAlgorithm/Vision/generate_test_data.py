import os
import random
import numpy as np
from PIL import Image, ImageDraw
import cv2

# 确保目录存在
def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)


def seamless_clone(img, patch, y, x):
    """
    使用泊松融合将 patch 粘贴到 img 的 (y,x) 位置
    这是防止模型检测“硬边缘”的关键
    """
    h, w = img.shape[:2]
    ph, pw = patch.shape[:2]

    # 确保不越界
    if y + ph > h: ph = h - y
    if x + pw > w: pw = w - x
    patch = patch[:ph, :pw]

    # 创建掩码（全白，表示整个 patch 都要融合）
    mask = 255 * np.ones(patch.shape[:2], patch.dtype)

    # 泊松融合 (NORMAL_CLONE 或 MIXED_CLONE)
    # center 是目标区域的中心点
    center = (x + pw // 2, y + ph // 2)
    try:
        # cv2.seamlessClone 需要 uint8
        result = cv2.seamlessClone(patch, img, mask, center, cv2.NORMAL_CLONE)
        return result
    except Exception as e:
        # 如果融合失败，回退到普通粘贴（极少发生）
        img[y:y + ph, x:x + pw] = patch
        return img


def copy_move(img):
    """复制-移动伪造：使用泊松融合使其更隐蔽"""
    h, w = img.shape[:2]
    # 源区域大小 (限制最大尺寸，防止覆盖全图)
    src_h = random.randint(30, min(h // 3, 150))
    src_w = random.randint(30, min(w // 3, 150))

    # 源区域位置
    src_y = random.randint(0, h - src_h)
    src_x = random.randint(0, w - src_w)
    src = img[src_y:src_y + src_h, src_x:src_x + src_w]

    # 目标区域位置 (确保不与源区域重叠太多)
    while True:
        dst_y = random.randint(0, h - src_h)
        dst_x = random.randint(0, w - src_w)
        # 简单检查重叠
        if abs(dst_y - src_y) > src_h or abs(dst_x - src_x) > src_w:
            break

    # 对源区域进行轻微变换（旋转/翻转），增加检测难度
    if random.random() > 0.5:
        src = cv2.flip(src, 1)  # 水平翻转

    # 使用泊松融合粘贴
    result = seamless_clone(img, src, dst_y, dst_x)
    return result


def splicing(img, other_img):
    """拼接：从另一张图像中截取并融合"""
    if other_img is None: return img
    h, w = img.shape[:2]
    oh, ow = other_img.shape[:2]

    # 随机截取
    src_h = random.randint(40, min(oh, h // 2))
    src_w = random.randint(40, min(ow, w // 2))
    src_y = random.randint(0, oh - src_h)
    src_x = random.randint(0, ow - src_w)
    patch = other_img[src_y:src_y + src_h, src_x:src_x + src_w]

    # 调整大小以匹配目标风格（可选）
    target_h = int(src_h * random.uniform(0.8, 1.2))
    target_w = int(src_w * random.uniform(0.8, 1.2))
    patch = cv2.resize(patch, (target_w, target_h))

    # 目标位置
    dst_y = random.randint(0, h - target_h)
    dst_x = random.randint(0, w - target_w)

    # 融合
    result = seamless_clone(img, patch, dst_y, dst_x)
    return result


def add_jpeg_compression(img, quality_range=(10, 50)):
    """模拟JPEG压缩伪影（篡改后通常会重新保存）"""
    quality = random.randint(quality_range[0], quality_range[1])
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, encimg = cv2.imencode('.jpg', img, encode_param)
    decimg = cv2.imdecode(encimg, 1)
    return decimg


def generate_fake_images(real_dir, fake_dir, num_images=10, seed=None):
    """生成高拟真度的伪造图像"""
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    ensure_dir(fake_dir)

    real_images = [f for f in os.listdir(real_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if len(real_images) == 0: return 0

    # 伪造方法权重：增加 copy_move 和 splicing 的比重，减少纯噪声
    fake_methods = ['copy_move', 'splicing', 'jpeg_artifact']
    method_probs = [0.4, 0.4, 0.2]

    for i, img_file in enumerate(real_images[:num_images]):
        img_path = os.path.join(real_dir, img_file)
        img = cv2.imread(img_path)
        if img is None: continue

        # 随机选择方法
        method = random.choices(fake_methods, weights=method_probs)[0]

        if method == 'copy_move':
            fake_img = copy_move(img)
        elif method == 'splicing':
            # 随机选另一张图
            other_file = random.choice(real_images)
            other_path = os.path.join(real_dir, other_file)
            other_img = cv2.imread(other_path)
            fake_img = splicing(img, other_img)
        elif method == 'jpeg_artifact':
            # 模拟篡改后的重压缩
            fake_img = add_jpeg_compression(img)
        else:
            fake_img = img

        # 保存
        fake_img_path = os.path.join(fake_dir, f'fake_{i + 1:04d}.jpg')
        cv2.imwrite(fake_img_path, fake_img)
        # print(f'生成伪造: {method}')
    return num_images


def generate_ai_images(output_dir, num_images=10, size=(256, 256), seed=None):
    """
    模拟AI生成图像的统计特征：
    1. 频域异常（高频噪声多）
    2. 颜色过度平滑但纹理有伪影
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    ensure_dir(output_dir)

    for i in range(num_images):
        # 1. 生成基底：使用 Perlin Noise 或 随机渐变 模拟 AI 的构图
        # 这里用简单的随机色块模拟
        img = np.zeros((*size, 3), dtype=np.uint8)
        for _ in range(random.randint(5, 15)):
            color = tuple(random.randint(0, 255) for _ in range(3))
            x1, y1 = random.randint(0, size[0]), random.randint(0, size[1])
            x2, y2 = x1 + random.randint(50, 200), y1 + random.randint(50, 200)
            # 绘制圆形或矩形
            if random.random() > 0.5:
                cv2.circle(img, (x1, y1), random.randint(20, 100), color, -1)
            else:
                cv2.rectangle(img, (x1, y1), (x2, y2), color, -1)

        # 2. 模拟 AI 的平滑感
        img = cv2.GaussianBlur(img, (7, 7), 0)

        # 3. 添加高频伪影（这是关键特征）
        # AI 生成图通常在高频部分有特定的网格状噪声
        noise = np.random.normal(0, 20, img.shape).astype(np.uint8)
        img = cv2.add(img, noise)

        # 4. 模拟上采样伪影（双三次插值）（width,height）
        small = cv2.resize(img, (size[1] // 2, size[0] // 2), interpolation=cv2.INTER_AREA)
        img = cv2.resize(small, (size[1], size[0]), interpolation=cv2.INTER_CUBIC)

        # 保存
        file_path = os.path.join(output_dir, f'ai_{i + 1:04d}.jpg')
        cv2.imwrite(file_path, img)
    return num_images