from __future__ import annotations
import os
from typing import Optional, Dict, Any
from PIL import Image

try:
    import imagehash
except ImportError:
    imagehash = None

_default_hashes: Dict[str, Any] = {}

def is_imagehash_available() -> bool:
    return imagehash is not None

def get_default_hashes() -> dict:
    return _default_hashes

def load_hashes_from_directory(directory: str, logger: Optional[Any] = None) -> Dict[str, Any]:
    if imagehash is None:
        if logger:
            logger.warning("imagehash 未安装，无法加载哈希库")
        return {}
    hashes = {}
    valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
    if not os.path.exists(directory):
        return hashes
    for fname in os.listdir(directory):
        if fname.lower().endswith(valid_extensions):
            path = os.path.join(directory, fname)
            try:
                img = Image.open(path)
                h = imagehash.phash(img)
                hashes[path] = h
            except Exception as e:
                if logger:
                    logger.info(f"加载图片 {path} 哈希失败: {e}")
    if logger:
        logger.info(f"从 {directory} 加载了 {len(hashes)} 张图片的哈希")
    return hashes

def check_similarity(
    image_path: str,
    image_hashes: Optional[dict] = None,
    logger: Optional[Any] = None
) -> float:
    if imagehash is None:
        return 0.0
    hashes = image_hashes if image_hashes is not None else _default_hashes
    if not hashes:
        if logger:
            logger.debug("盗图检测哈希库为空，无法比较")
        return 0.0

    try:
        img = Image.open(image_path)
        current_hash = imagehash.phash(img)

        max_similarity = 0.0
        for hash_val in hashes.values():
            similarity = 1 - (current_hash - hash_val) / 64.0
            max_similarity = max(max_similarity, similarity)

        return float(max(0.0, min(1.0, max_similarity)))
    except Exception as e:
        if logger:
            logger.info(f"相似度检查失败: {e}")
        return 0.0