package com.aiagent.service;

import com.aiagent.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLContext;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiServiceImpl implements AiService {
    
    private static final Logger logger = LoggerFactory.getLogger(AiServiceImpl.class);
    
    @Value("${ai.api.url}")
    private String aiApiUrl;
    
    @Value("${ai.api.key}")
    private String aiApiKey;
    
    @Value("${ai.api.model:qwen-plus}")
    private String model;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public AiServiceImpl() {
        this.restTemplate = createRestTemplate();
        
        this.objectMapper = new ObjectMapper();
        this.objectMapper.setDefaultPropertyInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);
        this.objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
    
    private RestTemplate createRestTemplate() {
        try {
            SSLContext sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, new javax.net.ssl.TrustManager[]{new javax.net.ssl.X509TrustManager() {
                public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                    return null;
                }
                public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {}
            }}, new java.security.SecureRandom());
            
            org.springframework.http.client.SimpleClientHttpRequestFactory factory = 
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(30000);
            factory.setReadTimeout(60000);
            
            RestTemplate restTemplate = new RestTemplate(factory);
            
            List<org.springframework.http.converter.HttpMessageConverter<?>> converters = restTemplate.getMessageConverters();
            for (org.springframework.http.converter.HttpMessageConverter<?> converter : converters) {
                if (converter instanceof org.springframework.http.converter.StringHttpMessageConverter) {
                    ((org.springframework.http.converter.StringHttpMessageConverter) converter)
                        .setDefaultCharset(StandardCharsets.UTF_8);
                }
            }
            
            return restTemplate;
        } catch (Exception e) {
            logger.error("[RestTemplate] 创建失败, 使用默认配置", e);
            return new RestTemplate();
        }
    }
    
    private final ConcurrentHashMap<String, List<Map<String, Object>>> chatHistories = new ConcurrentHashMap<>();
    
    private int apiCallCount = 0;
    private int apiSuccessCount = 0;
    private int apiFailCount = 0;
    
    @Override
    public String getApiUrl() {
        return aiApiUrl;
    }
    
    @Override
    public String getModel() {
        return model;
    }
    
    @Override
    public int getApiCallCount() {
        return apiCallCount;
    }
    
    @Override
    public int getApiSuccessCount() {
        return apiSuccessCount;
    }
    
    @Override
    public int getApiFailCount() {
        return apiFailCount;
    }
    
    @Override
    public AnalyzeChatResponse analyzeChat(AnalyzeChatRequest request) {
        String prompt = buildAnalysisPrompt(request);
        String aiResponse = callLLM(prompt);
        return parseAnalysisResponse(aiResponse);
    }
    
    @Override
    public ChatResponse chat(ChatRequest request) {
        String sessionId = request.getSessionId() != null ? 
                          request.getSessionId() : UUID.randomUUID().toString();
        
        List<Map<String, Object>> history = chatHistories.computeIfAbsent(sessionId, k -> new ArrayList<>());
        
        history.add(Map.of("role", "user", "content", request.getMessage()));
        
        if (history.size() > 20) {
            history = history.subList(history.size() - 20, history.size());
            chatHistories.put(sessionId, history);
        }
        
        String riskContext = fetchHouseRiskContext(request.getHouseId());
        String prompt = buildChatPromptWithHistory(history, riskContext);
        
        String aiReply = callLLMWithHistory(history);
        
        history.add(Map.of("role", "assistant", "content", aiReply));
        
        ChatResponse response = new ChatResponse();
        response.setReply(aiReply);
        response.setSessionId(sessionId);
        return response;
    }
    
    @Override
    public GenerateReportResponse generateReport(GenerateReportRequest request) {
        GenerateReportResponse response = new GenerateReportResponse();
        response.setReportId(UUID.randomUUID().toString());
        response.setHouseId(request.getHouseId());
        response.setReportTime(new Date().toString());
        
        response.setImageGisReport(request.getImageAnalysis());
        
        AnalyzeChatResponse chatAnalysis = null;
        if (request.getChatHistory() != null && !request.getChatHistory().isEmpty()) {
            AnalyzeChatRequest analyzeRequest = new AnalyzeChatRequest();
            analyzeRequest.setHouseId(request.getHouseId());
            analyzeRequest.setChatHistory(request.getChatHistory());
            
            chatAnalysis = analyzeChat(analyzeRequest);
            response.setChatAnalysis(chatAnalysis);
        }
        
        ComprehensiveRecommendation recommendation = calculateRecommendation(
            request.getImageAnalysis(),
            request.getGisAnalysis(),
            chatAnalysis
        );
        response.setRecommendation(recommendation);
        
        return response;
    }
    
    private String buildAnalysisPrompt(AnalyzeChatRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一个专业的租房反欺诈专家。请分析以下用户与中介的聊天记录，识别是否存在欺诈话术。\n\n");
        
        prompt.append("【聊天记录】\n");
        for (ChatMessage msg : request.getChatHistory()) {
            String role = "user".equals(msg.getRole()) ? "用户" : "中介";
            prompt.append(String.format("%s: %s\n", role, msg.getContent()));
        }
        
        prompt.append("\n【分析要求】\n");
        prompt.append("请识别以下问题：\n");
        prompt.append("1. 是否存在虚假房源特征\n");
        prompt.append("2. 是否存在诈骗话术（要求预付定金、拒绝看房等）\n");
        prompt.append("3. 是否存在制造紧迫感\n");
        prompt.append("\n请只输出JSON，格式如下：\n");
        prompt.append("{\n");
        prompt.append("  \"fraudScore\": 0-100的数字,\n");
        prompt.append("  \"fraudLevel\": \"high/medium/low\",\n");
        prompt.append("  \"redFlags\": [\"话术漏洞1\", \"话术漏洞2\"],\n");
        prompt.append("  \"summary\": \"分析总结\",\n");
        prompt.append("  \"suggestions\": [\"给用户的建议1\"]\n");
        prompt.append("}");
        
        return prompt.toString();
    }
    
    private String buildChatPrompt(String userMessage, String riskContext) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是专业的租房顾问。\n\n");
        
        if (riskContext != null && !riskContext.isEmpty()) {
            prompt.append("【房源信息】\n").append(riskContext).append("\n\n");
        }
        
        prompt.append("【用户问题】\n").append(userMessage);
        prompt.append("\n\n回答简洁，分点说明。");
        
        return prompt.toString();
    }
    
    private String buildChatPromptWithHistory(List<Map<String, Object>> history, String riskContext) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一个专业的租房防诈骗助手，帮助租房客户识别和防范租房诈骗。\n\n");
        prompt.append("你的职责是：\n");
        prompt.append("1. 从租房客户的角度分析房东/中介的话术\n");
        prompt.append("2. 识别话术是否存在诈骗风险、不合理要求或可疑之处\n");
        prompt.append("3. 提供具体的防骗建议和应对措施\n");
        prompt.append("4. 绝对不要帮助优化骗子的话术，也不要站在房东/中介的角度说话\n\n");
        
        if (riskContext != null && !riskContext.isEmpty()) {
            prompt.append("【房源信息】\n").append(riskContext).append("\n\n");
        }
        
        prompt.append("【对话历史】\n");
        for (Map<String, Object> message : history) {
            String role = "user".equals(message.get("role")) ? "用户" : "你"; 
            prompt.append(String.format("%s: %s\n", role, message.get("content")));
        }
        
        prompt.append("\n请根据对话历史，作为租房防诈骗助手继续回答用户的问题。回答简洁，分点说明，重点关注防骗建议。");
        
        return prompt.toString();
    }
    
    private String callLLM(String prompt) {
        long startTime = System.currentTimeMillis();
        apiCallCount++;
        
        try {
            logger.info("[AI Call] 发起LLM调用, model={}, prompt_length={}", model, prompt.length());
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 2000);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + aiApiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                aiApiUrl,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            long responseTime = System.currentTimeMillis() - startTime;
            apiSuccessCount++;
            
            logger.info("[AI Call] LLM调用成功, 耗时={}ms, status={}", responseTime, response.getStatusCode());
            
            Map<String, Object> responseBody = response.getBody();
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                String content = (String) message.get("content");
                logger.debug("[AI Call] LLM响应内容长度={}", content != null ? content.length() : 0);
                return content;
            }
            
            logger.warn("[AI Call] LLM返回格式异常, choices为空");
            return "{\"error\": \"AI返回格式异常\"}";
            
        } catch (RestClientException e) {
            apiFailCount++;
            long responseTime = System.currentTimeMillis() - startTime;
            
            logger.error("[AI Call] LLM调用失败(RestClientException), 耗时={}ms, error={}", responseTime, e.getMessage(), e);
            
            return "{\"fraudScore\":50,\"fraudLevel\":\"medium\",\"redFlags\":[\"分析失败\"],\"summary\":\"服务暂时不可用\"}";
            
        } catch (Exception e) {
            apiFailCount++;
            long responseTime = System.currentTimeMillis() - startTime;
            
            logger.error("[AI Call] LLM调用失败(UnknownException), 耗时={}ms, error={}", responseTime, e.getMessage(), e);
            
            return "{\"fraudScore\":50,\"fraudLevel\":\"medium\",\"redFlags\":[\"分析失败\"],\"summary\":\"服务暂时不可用\"}";
        }
    }
    
    private String callLLMWithHistory(List<Map<String, Object>> history) {
        long startTime = System.currentTimeMillis();
        apiCallCount++;
        
        try {
            List<Map<String, Object>> limitedHistory = history;
            if (history.size() > 10) {
                limitedHistory = history.subList(history.size() - 10, history.size());
            }
            
            List<Map<String, Object>> messages = new ArrayList<>();
            
            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "你是一个专业的租房防诈骗助手，帮助租房客户识别和防范租房诈骗。\n\n" +
                "你的职责是：\n" +
                "1. 从租房客户的角度分析房东/中介的话术\n" +
                "2. 识别话术是否存在诈骗风险、不合理要求或可疑之处\n" +
                "3. 提供具体的防骗建议和应对措施\n" +
                "4. 绝对不要帮助优化骗子的话术，也不要站在房东/中介的角度说话");
            messages.add(systemMessage);
            
            messages.addAll(limitedHistory);
            
            logger.info("[AI Chat] 发起对话调用, model={}, message_count={}", model, messages.size());
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1000);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + aiApiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                aiApiUrl,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            long responseTime = System.currentTimeMillis() - startTime;
            apiSuccessCount++;
            
            logger.info("[AI Chat] 对话调用成功, 耗时={}ms, status={}", responseTime, response.getStatusCode());
            
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody == null) {
                logger.warn("[AI Chat] 响应体为空");
                return "AI暂时无法提供分析，请稍后重试。";
            }
            
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                if (message != null) {
                    String content = (String) message.get("content");
                    if (content != null && !content.isEmpty()) {
                        logger.debug("[AI Chat] 响应内容长度={}", content.length());
                        return content;
                    }
                }
            }
            
            logger.warn("[AI Chat] LLM返回格式异常, choices或message为空");
            return "AI暂时无法提供分析，请稍后重试。";
            
        } catch (RestClientException e) {
            apiFailCount++;
            long responseTime = System.currentTimeMillis() - startTime;
            
            logger.error("[AI Chat] 对话调用失败(RestClientException), 耗时={}ms, error={}", responseTime, e.getMessage(), e);
            
            String errorType = "网络错误";
            if (e.getMessage() != null) {
                if (e.getMessage().contains("401") || e.getMessage().contains("Unauthorized")) {
                    errorType = "API密钥无效";
                } else if (e.getMessage().contains("403") || e.getMessage().contains("Forbidden")) {
                    errorType = "权限不足或配额用尽";
                } else if (e.getMessage().contains("timeout") || e.getMessage().contains("Timeout")) {
                    errorType = "请求超时";
                }
            }
            
            logger.error("[AI Chat] 错误类型: {}, API URL: {}", errorType, aiApiUrl);
            
            return "AI暂时无法提供分析，请稍后重试。";
            
        } catch (Exception e) {
            apiFailCount++;
            long responseTime = System.currentTimeMillis() - startTime;
            
            logger.error("[AI Chat] 对话调用失败(UnknownException), 耗时={}ms, error={}", responseTime, e.getMessage(), e);
            
            return "AI暂时无法提供分析，请稍后重试。";
        }
    }
    
    private AnalyzeChatResponse parseAnalysisResponse(String aiResponse) {
        try {
            int start = aiResponse.indexOf('{');
            int end = aiResponse.lastIndexOf('}');
            if (start >= 0 && end > start) {
                String json = aiResponse.substring(start, end + 1);
                return objectMapper.readValue(json, AnalyzeChatResponse.class);
            }
        } catch (Exception e) {
            logger.warn("[Parse] 解析AI响应失败: {}", e.getMessage());
        }
        AnalyzeChatResponse response = new AnalyzeChatResponse();
        response.setFraudScore(50.0);
        response.setFraudLevel("medium");
        response.setRedFlags(List.of("分析失败"));
        response.setSummary("无法完整分析聊天记录");
        return response;
    }
    
    private String fetchHouseRiskContext(String houseId) {
        return "房源ID: " + houseId;
    }
    
    private ComprehensiveRecommendation calculateRecommendation(
            Object imageAnalysis,
            Object gisAnalysis,
            AnalyzeChatResponse chatAnalysis) {
        
        ComprehensiveRecommendation rec = new ComprehensiveRecommendation();
        
        double finalScore = 70.0;
        
        if (imageAnalysis != null) {
            try {
                Map<String, Object> imageMap = objectMapper.convertValue(imageAnalysis, Map.class);
                Map<String, Object> overallScore = (Map<String, Object>) imageMap.getOrDefault("overallScore", new HashMap<>());
                Object scoreObj = overallScore.getOrDefault("totalScore", 70);
                if (scoreObj instanceof Number) {
                    finalScore = ((Number) scoreObj).doubleValue();
                }
            } catch (Exception e) {
                logger.warn("[Recommendation] 解析图像分析失败: {}", e.getMessage());
            }
        }
        
        if (chatAnalysis != null && chatAnalysis.getFraudScore() != null) {
            double fraudScore = chatAnalysis.getFraudScore();
            if (fraudScore > 70) {
                finalScore = Math.max(0, finalScore - 30);
            } else if (fraudScore > 40) {
                finalScore = Math.max(0, finalScore - 15);
            }
        }
        
        rec.setFinalScore(finalScore);
        
        if (finalScore >= 80) {
            rec.setFinalGrade("强烈推荐");
        } else if (finalScore >= 65) {
            rec.setFinalGrade("推荐");
        } else if (finalScore >= 50) {
            rec.setFinalGrade("谨慎考虑");
        } else {
            rec.setFinalGrade("不推荐");
        }
        
        List<String> keyFindings = new ArrayList<>();
        if (chatAnalysis != null && chatAnalysis.getRedFlags() != null && !chatAnalysis.getRedFlags().isEmpty()) {
            keyFindings.add("📞 中介话术风险：" + chatAnalysis.getRedFlags().get(0));
        }
        
        if (imageAnalysis != null) {
            try {
                Map<String, Object> imageMap = objectMapper.convertValue(imageAnalysis, Map.class);
                Map<String, Object> imageRisk = (Map<String, Object>) imageMap.getOrDefault("imageRisk", new HashMap<>());
                Boolean isSSF = (Boolean) imageRisk.getOrDefault("isSSF", false);
                if (isSSF) {
                    keyFindings.add("🏠 房屋质量风险：疑似串串房");
                }
            } catch (Exception e) {
                logger.warn("[Recommendation] 解析图像风险失败: {}", e.getMessage());
            }
        }
        
        if (keyFindings.isEmpty()) {
            keyFindings.add("暂无显著风险发现");
        }
        rec.setKeyFindings(keyFindings);
        
        List<String> actionAdvice = new ArrayList<>();
        if (chatAnalysis != null && chatAnalysis.getFraudScore() != null && chatAnalysis.getFraudScore() > 50) {
            actionAdvice.add("建议实地看房前不要支付任何费用");
            actionAdvice.add("可要求中介提供房产证和房东身份证");
        } else {
            actionAdvice.add("建议实地看房确认房源真实性");
            actionAdvice.add("仔细阅读租赁合同条款");
        }
        rec.setActionAdvice(actionAdvice);
        
        if (finalScore >= 80) {
            rec.setVerdict("该房源综合表现优秀，可优先考虑。建议实地看房确认细节。");
        } else if (finalScore >= 65) {
            rec.setVerdict("该房源基本合格，但存在一些风险点，建议看房时重点关注。");
        } else if (finalScore >= 50) {
            rec.setVerdict("该房源存在较多风险，建议谨慎考虑，或作为备选。");
        } else {
            rec.setVerdict("该房源风险较高，强烈建议放弃，寻找其他房源。");
        }
        
        rec.setFinalSummary(String.format("综合评分：%.1f分（%s）", finalScore, rec.getFinalGrade()));
        
        return rec;
    }
}