package com.aiagent.service;

import com.aiagent.dto.AnalyzeChatRequest;
import com.aiagent.dto.AnalyzeChatResponse;
import com.aiagent.dto.ChatRequest;
import com.aiagent.dto.ChatResponse;
import com.aiagent.dto.GenerateReportRequest;
import com.aiagent.dto.GenerateReportResponse;

public interface AiService {
    AnalyzeChatResponse analyzeChat(AnalyzeChatRequest request);
    ChatResponse chat(ChatRequest request);
    GenerateReportResponse generateReport(GenerateReportRequest request);
    
    String getApiUrl();
    String getModel();
    int getApiCallCount();
    int getApiSuccessCount();
    int getApiFailCount();
}