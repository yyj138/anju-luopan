import os
from typing import Optional, Any, List

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

_furniture_model = None

def _get_default_weight_path() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "yolov8n.pt"))

def detect_furniture(
    image_path: str,
    logger: Optional[Any] = None,
    weight_path: Optional[str] = None
) -> List[str]:
    global _furniture_model

    if YOLO is None:
        if logger:
            logger.warning("家具检测不可用：未安装 ultralytics")
        return []

    if weight_path is None:
        weight_path = _get_default_weight_path()

    if _furniture_model is None:
        if not os.path.exists(weight_path):
            if logger:
                logger.warning(
                    f"YOLO 权重文件不存在: {weight_path}。家具检测功能不可用。"
                    "请下载 yolov8n.pt 并放置在项目根目录，或通过 weight_path 指定。"
                )
            return []
        try:
            _furniture_model = YOLO(weight_path)
        except Exception as e:
            if logger:
                logger.info(f"YOLO 模型加载失败: {e}")
            return []

    try:
        results = _furniture_model(image_path)
        furniture = []
        furniture_classes = {
            "bed", "sofa", "chair", "dining table", "desk",
            "wardrobe", "couch", "armchair"
        }
        for r in results:
            boxes = r.boxes
            if boxes is None:
                continue
            for box in boxes:
                cls = int(box.cls[0])
                name = _furniture_model.names[cls]
                if name in furniture_classes:
                    furniture.append(name)
        return list(set(furniture))
    except Exception as e:
        if logger:
            logger.info(f"家具检测失败: {e}")
        return []