import os
from typing import Optional, Any

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    from paddleocr import PaddleOCR
except ImportError:
    PaddleOCR = None

_ocr_model = None

def extract_ocr(image_path: str, logger: Optional[Any] = None, lang: str = "ch") -> str:
    if cv2 is None or pytesseract is None:
        if logger:
            logger.warning("OCR 不可用：缺少 cv2 或 pytesseract 库")
        return ""

    global _ocr_model
    paddle_text = ""

    if PaddleOCR is not None:
        try:
            if _ocr_model is None:
                _ocr_model = PaddleOCR(use_angle_cls=True, lang=lang)
            result = _ocr_model.ocr(image_path, cls=True)
            if result and result[0]:
                texts = [line[1][0] for line in result[0]]
                paddle_text = " ".join(texts).strip()
        except Exception as e:
            if logger:
                logger.info(f"PaddleOCR 提取失败: {e}")

    if paddle_text:
        return paddle_text

    try:
        img = cv2.imread(image_path)
        if img is None:
            return ""
        try:
            text = pytesseract.image_to_string(img, lang="chi_sim")
        except Exception:
            text = pytesseract.image_to_string(img)
        return (text or "").strip()
    except Exception as e:
        if logger:
            logger.info(f"Tesseract OCR 提取失败: {e}")
        return ""