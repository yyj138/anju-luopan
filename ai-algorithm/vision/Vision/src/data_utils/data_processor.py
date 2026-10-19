import os
import cv2
import numpy as np
from tqdm import tqdm
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import random
import shutil

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.logger import setup_logger, log_info, log_warning, log_error


def download_datasets():
    """
    此函数提供获取常用图像伪造检测数据集的方法和链接
    """
    print("以下是常用的图像伪造检测数据集:")
    print("1. CASIA 2.0 数据集: https://github.com/namtpham/casia2groundtruth")
    print("2. Columbia Image Splicing Detection 数据集: https://www.ee.columbia.edu/ln/dvmm/downloads/authsplcuncmp/")
    print("3. Coverage 数据集: https://github.com/wenbihan/coverage")
    print("4. NIST Nimble 2016 数据集: https://www.nist.gov/itl/iad/mig/nimble-2016-evaluation")
    print("5. PS-Battles 数据集: https://github.com/dbisUnibas/PS-Battles")
    
    print("\n您也可以使用自己的真实图像和通过工具如Photoshop或AI生成工具创建的伪造图像")
    print("如需下载，请访问上述链接手动下载数据集")


def preprocess_images(input_dir, output_dir, target_size=(256, 256), max_images=None):
    """
    将图像预处理并保存到输出目录
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取所有图像文件
    image_files = [f for f in os.listdir(input_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff'))]
    
    if max_images:
        random.shuffle(image_files)
        image_files = image_files[:max_images]
    
    logger = setup_logger("DataProcessor", "INFO")
    log_info(f"正在处理 {len(image_files)} 张图像...", logger)

    # 内部函数：处理单张图像
    def process_image(img_file):
        try:
            img_path = os.path.join(input_dir, img_file)
            # 直接使用 PIL 读取（支持中文路径）
            pil_img = Image.open(img_path).convert('RGB')
            img = np.array(pil_img)
            # PIL 读取的是 RGB，OpenCV 保存需要 BGR，所以转换
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
            # 调整大小
            img_resized = cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)
            # 保存
            out_path = os.path.join(output_dir, img_file)
            cv2.imwrite(out_path, img_resized)
            return True
        except Exception as e:
            log_error(f"处理图像 {img_file} 时出错: {str(e)}", logger)
            return False

    # 并行处理
    with ThreadPoolExecutor(max_workers=os.cpu_count()) as executor:
        results = list(tqdm(executor.map(process_image, image_files), total=len(image_files)))
    
    success_count = results.count(True)
    log_info(f"成功处理 {success_count}/{len(image_files)} 张图像", logger)
    return success_count


def split_dataset(data_dir, output_dir, split_ratio=(0.7, 0.15, 0.15)):
    """
    将数据集分割为训练集、验证集和测试集
    """
    # 确保比例总和为1
    assert sum(split_ratio) == 1.0, "比例总和必须为1"
    
    # 创建输出目录
    train_dir = os.path.join(output_dir, 'train')
    val_dir = os.path.join(output_dir, 'val')
    test_dir = os.path.join(output_dir, 'test')
    
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)
    
    # 获取所有图像
    images = [f for f in os.listdir(data_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    random.shuffle(images)
    
    # 计算分割索引
    n_train = int(len(images) * split_ratio[0])
    n_val = int(len(images) * split_ratio[1])
    
    train_images = images[:n_train]
    val_images = images[n_train:n_train+n_val]
    test_images = images[n_train+n_val:]
    
    # 复制文件
    for img in train_images:
        shutil.copy(os.path.join(data_dir, img), os.path.join(train_dir, img))
    
    for img in val_images:
        shutil.copy(os.path.join(data_dir, img), os.path.join(val_dir, img))
    
    for img in test_images:
        shutil.copy(os.path.join(data_dir, img), os.path.join(test_dir, img))
    
    logger = setup_logger("DataProcessor", "INFO")
    log_info("数据集分割完成:", logger)
    log_info(f"训练集: {len(train_images)} 张图像", logger)
    log_info(f"验证集: {len(val_images)} 张图像", logger)
    log_info(f"测试集: {len(test_images)} 张图像", logger)


if __name__ == "__main__":
    # 示例用法
    logger = setup_logger("DataProcessor", "INFO")
    log_info("数据处理工具", logger)
    log_info("使用方法:", logger)
    log_info("1. 从 download_datasets() 函数获取数据集下载链接", logger)
    log_info("2. 使用 preprocess_images() 处理图像", logger)
    log_info("3. 使用 split_dataset() 分割数据集", logger)