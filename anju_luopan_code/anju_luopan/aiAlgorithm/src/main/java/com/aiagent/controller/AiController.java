package com.aiagent.controller;

import com.aiagent.dto.*;
import com.aiagent.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/ai")
public class AiController {
    
    @Autowired
    private AiService aiService;
    
    /**
     * 分析聊天记录
     * POST /ai/analyze-chat
     */
    @PostMapping("/analyze-chat")
    public Map<String, Object> analyzeChat(@RequestBody AnalyzeChatRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            AnalyzeChatResponse response = aiService.analyzeChat(request);
            result.put("code", 200);
            result.put("data", response);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", e.getMessage());
        }
        return result;
    }
    
    /**
     * AI对话
     * POST /ai/chat
     */
    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody ChatRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            ChatResponse response = aiService.chat(request);
            result.put("code", 200);
            result.put("data", response);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", e.getMessage());
        }
        return result;
    }
    
    /**
     * 生成综合报告（主后端调用此接口）
     * POST /ai/generate-report
     */
    @PostMapping("/generate-report")
    public Map<String, Object> generateReport(@RequestBody GenerateReportRequest request) {
        Map<String, Object> result = new HashMap<>();
        try {
            GenerateReportResponse response = aiService.generateReport(request);
            result.put("code", 200);
            result.put("data", response);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", e.getMessage());
        }
        return result;
    }
    
    /**
     * 健康检查
     * GET /ai/health
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("status", "running");
        result.put("timestamp", System.currentTimeMillis());
        result.put("service", "ai-agent");
        result.put("apiUrl", aiService.getApiUrl());
        result.put("model", aiService.getModel());
        result.put("apiCallCount", aiService.getApiCallCount());
        result.put("apiSuccessCount", aiService.getApiSuccessCount());
        result.put("apiFailCount", aiService.getApiFailCount());
        return result;
    }
    
    // 根路径健康检查控制器
    @RestController
    @RequestMapping("/")
    class RootController {
        @GetMapping("/health")
        public Map<String, Object> health() {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("status", "running");
            result.put("timestamp", System.currentTimeMillis());
            result.put("service", "ai-agent");
            return result;
        }
    }
}