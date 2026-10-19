from __future__ import annotations

from typing import Any, Callable, Optional, Set

from src.services.ocr_detector import extract_ocr
from src.services.piracy_detector import check_similarity, get_default_hashes as get_default_image_hashes, is_imagehash_available
from src.services.furniture_detector import detect_furniture
from src.services.room_quality_detector import analyze_room_quality


def _format_p_image(pred_result: dict) -> dict:
    label = pred_result.get("class")
    if label == "伪造":
        prob = pred_result.get("fake_prob")
    else:
        prob = pred_result.get("real_prob")
    return {"label": label, "prob": prob}


def _extract_ai_generated(pred_result: dict) -> dict:
    # predict_image 在多任务模式下会返回 ai_class/ai_prob/non_ai_prob
    keys = ("ai_class", "ai_prob", "non_ai_prob")
    if all(k in pred_result for k in keys):
        ai_label = pred_result.get("ai_class")
        ai_prob = pred_result.get("ai_prob") if ai_label == "AI生成" else pred_result.get("non_ai_prob")
        return {"status": "available", "label": ai_label, "prob": ai_prob}
    return {"status": "unavailable"}


def analyze_for_rent_upload(
    image_path: str,
    forensics_predict_fn: Callable[[str], dict],
    logger: Any = None,
    image_hashes: Optional[dict] = None,
    fields: Optional[Set[str]] = None,
) -> dict:
    """
    统一编排器：面向租房系统的图像检测 API。

    Args:
        image_path: 上传图片绝对路径
        forensics_predict_fn: 伪造/真实检测函数（复用现有 predict_image）
        logger: 可选日志器
        image_hashes: 盗图相似度的哈希库（可选；缺省使用 modules 默认空库）
    """
    # 默认：执行并返回全部字段
    allowed_fields = {"p_image", "ai_generated", "piracy", "room_quality", "ocr"}
    if fields is None or not fields:
        fields = set(allowed_fields)
    else:
        fields = {f for f in set(fields) if f in allowed_fields}

    # 合同里 `p_image` 是核心字段；即使客户端未请求也确保返回
    fields.add("p_image")

    run_ocr = ("ocr" in fields) or ("room_quality" in fields)
    run_room_quality = "room_quality" in fields
    run_furniture = run_room_quality
    run_ai_generated = "ai_generated" in fields
    run_piracy = "piracy" in fields

    if image_hashes is None:
        image_hashes = get_default_image_hashes()

    # p_image 必须：复用现有模型能力
    pred_result = forensics_predict_fn(image_path)
    response: dict = {
        "p_image": _format_p_image(pred_result),
        "ai_generated": _extract_ai_generated(pred_result) if run_ai_generated else {"status": "unavailable"},
        "piracy": {
            "status": "unavailable",
            "is_infringing": False,
            "match_count": 0,
            "top_results": [],
        },
        "room_quality": {
            "tier": "low",
            "scores": {"overall": 0, "decor": 0, "safety": 0},
            "cheap_decor_risk": "high",
            "formaldehyde_risk_hint": "" if run_room_quality else "未请求 room_quality，因此未计算（仅占位）。",
        },
        "ocr": {"status": "unavailable", "text": ""},
    }

    # piracy：当前为相似度启发式（未接入 tintin 时 top_results 为空）
    try:
        if run_piracy:
            # image_hashes 为空时，等价于没有可比对的参考库，不应标记为 available
            if is_imagehash_available() and image_hashes:
                similarity_score = check_similarity(
                    image_path, image_hashes=image_hashes, logger=logger
                )
                response["piracy"] = {
                    "status": "available",
                    "is_infringing": bool(similarity_score > 0.8),
                    "match_count": len(image_hashes) if image_hashes else 0,
                    "top_results": [],
                }
            else:
                response["piracy"] = {
                    "status": "unavailable",
                    "is_infringing": False,
                    "match_count": len(image_hashes) if image_hashes else 0,
                    "top_results": [],
                }
    except Exception as e:
        if logger:
            logger.info(f"piracy 检测失败: {e}")

    # ocr + room_quality + furniture
    ocr_text = ""
    try:
        if run_ocr:
            ocr_text = extract_ocr(image_path, logger=logger)
            if "ocr" in fields and ocr_text:
                response["ocr"] = {
                    "status": "available",
                    "text": ocr_text,
                    "words": [w for w in ocr_text.split() if w],
                }
            elif "ocr" in fields:
                response["ocr"] = {"status": "unavailable", "text": ""}
    except Exception as e:
        if logger:
            logger.info(f"OCR 检测失败: {e}")
        ocr_text = ""

    if run_furniture:
        try:
            furniture = detect_furniture(image_path, logger=logger)
        except Exception as e:
            if logger:
                logger.info(f"家具检测失败: {e}")
            furniture = []

        try:
            response["room_quality"] = analyze_room_quality(ocr_text, furniture)
        except Exception as e:
            if logger:
                logger.info(f"room_quality 计算失败: {e}")

    return response

