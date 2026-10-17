def analyze_room_quality(ocr_text: str, furniture: list) -> dict:
    """
    房间质量启发式：基于 OCR 关键词 + 家具数量/类型粗分类，给出可解释的分项评分与风险提示。

    约束：
    - 输出结构必须稳定，便于租房系统落地对接。
    - 本阶段是“启发式”，不追求绝对准确率。
    """
    text = (ocr_text or "").strip().lower()
    furniture_count = len(furniture) if furniture else 0

    # OCR 文本为空时：启发式无法获得可靠依据
    if not text:
        return {
            "tier": "medium",
            "scores": {"overall": 0, "decor": 0, "safety": 0},
            "cheap_decor_risk": "medium",
            "formaldehyde_risk_hint": "未能从图像中识别到可用OCR文本，因此房间质量启发式无法做有效判断（仅供参考）。",
        }

    # OCR 关键词（尽量覆盖“常见描述/卖点/风险措辞”）
    premium_keywords = [
        "精装",
        "高端",
        "品牌",
        "全屋定制",
        "环保材料",
        "德国",
        "德系",
        "大牌",
        "全新装修",
    ]
    cheap_keywords = [
        "毛坯",
        "简装",
        "简陋",
        "破旧",
        "旧房",
        "老房",
        "廉价",
        "便宜",
        "低价",
        "二手",
        "出租房",
        "老装修",
        "随便",
        "杂牌",
        "短租",
        "合租",
    ]
    safety_keywords = [
        "甲醛",
        "异味",
        "除甲醛",
        "活性炭",
        "除味",
        "通风",
        "检测报告",
        "环保",
        "绿色",
        "净化",
        "新装修",
        "刚装修",
        "翻新",
    ]

    premium_hit = any(k in text for k in premium_keywords)
    cheap_hit = any(k in text for k in cheap_keywords)
    safety_hit = any(k in text for k in safety_keywords)

    # 分项打分（经验值：更“精装/更环保” -> 分高）
    decor_score = 60
    safety_score = 55

    if premium_hit:
        decor_score += 18
    if cheap_hit:
        decor_score -= 22

    # 家具数量作为“布置完整度”粗指标
    if furniture_count >= 4:
        decor_score += 10
    elif furniture_count <= 1:
        decor_score -= 5

    # 甲醛/安全线索：命中风险词则下调；若出现“通风/检测/环保”则轻微回升
    if safety_hit:
        safety_score -= 12

    # 正/负线索进一步区分（避免过度推断）
    if any(k in text for k in ["环保", "绿色", "净化", "检测报告"]):
        safety_score += 10
    if any(k in text for k in ["除甲醛", "活性炭", "除味", "通风"]):
        safety_score += 6
    if any(k in text for k in ["甲醛", "异味", "刚装修", "新装修"]):
        safety_score -= 6

    # 裁剪到区间并计算 overall
    decor_score = max(0, min(100, int(decor_score)))
    safety_score = max(0, min(100, int(safety_score)))
    overall_score = int(0.45 * decor_score + 0.55 * safety_score)

    if overall_score >= 80:
        tier = "high"
    elif overall_score >= 55:
        tier = "medium"
    else:
        tier = "low"

    if decor_score >= 75:
        cheap_decor_risk = "low"
    elif decor_score >= 50:
        cheap_decor_risk = "medium"
    else:
        cheap_decor_risk = "high"

    # 可解释风险提示（基于命中词生成）
    risk_parts = []
    if cheap_hit:
        risk_parts.append("OCR提示可能存在简装/旧房等低端装修描述")
    else:
        risk_parts.append("未在OCR中看到明显低端装修关键词（仅供参考）")

    if any(k in text for k in ["甲醛", "异味", "刚装修", "新装修"]):
        risk_parts.append("OCR提示可能存在甲醛/异味相关线索，建议加强通风或索取检测信息")
    elif any(k in text for k in ["除甲醛", "活性炭", "除味", "通风", "检测报告", "环保"]):
        risk_parts.append("OCR出现环保/除味/通风/检测相关表述，风险可能相对可控，但仍需实地确认")
    else:
        risk_parts.append("未在OCR中看到明确甲醛/异味线索，建议现场闻味与核实装修时间")

    return {
        "tier": tier,
        "scores": {
            "overall": overall_score,
            "decor": decor_score,
            "safety": safety_score,
        },
        "cheap_decor_risk": cheap_decor_risk,
        "formaldehyde_risk_hint": "；".join(risk_parts),
    }

