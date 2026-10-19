package com.aiagent.dto;

import lombok.Data;

@Data
public class GenerateReportResponse {
    private String reportId;
    private String houseId;
    private String reportTime;
    private Object imageGisReport;           // 图像组数据
    private AnalyzeChatResponse chatAnalysis; // AI分析结果
    private ComprehensiveRecommendation recommendation; // 综合推荐
}