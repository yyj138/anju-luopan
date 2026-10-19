package com.aiagent.dto;

import lombok.Data;
import java.util.List;

@Data
public class GenerateReportRequest {
    private String houseId;
    private Long userId;
    private List<ChatMessage> chatHistory;
    
    // 主后端传来的图像分析结果（直接透传）
    private Object imageAnalysis;
    
    // 主后端传来的空间分析结果（直接透传）
    private Object gisAnalysis;
}