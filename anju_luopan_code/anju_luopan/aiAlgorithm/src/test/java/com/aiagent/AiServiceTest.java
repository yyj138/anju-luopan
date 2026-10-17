package com.aiagent;

import com.aiagent.dto.*;
import com.aiagent.service.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.*;

@SpringBootTest
public class AiServiceTest {
    
    @Autowired
    private AiService aiService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /** 
     * 测试1：模拟主后端传来的完整数据，测试生成报告 
     */
    @Test
    public void testGenerateReport() throws Exception {
        System.out.println("========== 测试生成综合报告 ==========");
        
        // 1. 模拟主后端传来的图像分析数据 
        Map<String, Object> imageAnalysis = new HashMap<>();
        imageAnalysis.put("houseId", "12345");
        
        Map<String, Object> overallScore = new HashMap<>();
        overallScore.put("totalScore", 72.5);
        overallScore.put("grade", "C");
        overallScore.put("summary", "该房源整体中等，装修较新");
        imageAnalysis.put("overallScore", overallScore);
        
        Map<String, Object> imageRisk = new HashMap<>();
        imageRisk.put("isSSF", false);
        imageRisk.put("ssfConfidence", 0.15);
        imageRisk.put("furnitureQualityScore", 0.82);
        imageRisk.put("isPhotoshopped", false);
        imageRisk.put("riskTags", Arrays.asList("装修较新", "家具齐全"));
        imageAnalysis.put("imageRisk", imageRisk);
        
        // 2. 模拟主后端传来的空间分析数据 
        Map<String, Object> gisAnalysis = new HashMap<>();
        Map<String, Object> commute = new HashMap<>();
        Map<String, Object> toCompany = new HashMap<>();
        toCompany.put("durationMin", 28);
        toCompany.put("commuteScore", 0.82);
        commute.put("toCompany", toCompany);
        gisAnalysis.put("commute", commute);
        
        Map<String, Object> surrounding = new HashMap<>();
        surrounding.put("overallScore", 0.78);
        Map<String, Object> risks = new HashMap<>();
        risks.put("hasGarbageStation", false);
        risks.put("hasFactory", false);
        risks.put("noiseRiskScore", 0.35);
        surrounding.put("risks", risks);
        gisAnalysis.put("surrounding", surrounding);
        
        // 3. 模拟聊天记录 
        List<ChatMessage> chatHistory = Arrays.asList(
            new ChatMessage("user", "这套房子还在吗？"),
            new ChatMessage("agent", "在的，昨天刚空出来，好多人抢，先付定金吧")
        );
        
        // 4. 构建请求 
        GenerateReportRequest request = new GenerateReportRequest();
        request.setHouseId("12345");
        request.setUserId(1L);
        request.setChatHistory(chatHistory);
        request.setImageAnalysis(imageAnalysis);
        request.setGisAnalysis(gisAnalysis);
        
        // 5. 调用服务 
        GenerateReportResponse response = aiService.generateReport(request);
        
        // 6. 打印结果 
        System.out.println("报告ID: " + response.getReportId());
        System.out.println("房源ID: " + response.getHouseId());
        System.out.println("生成时间: " + response.getReportTime());
        System.out.println("\n--- 图像组数据 ---");
        System.out.println(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(response.getImageGisReport()));
        
        if (response.getChatAnalysis() != null) {
            System.out.println("\n--- AI话术分析 ---");
            System.out.println("欺诈分: " + response.getChatAnalysis().getFraudScore());
            System.out.println("风险等级: " + response.getChatAnalysis().getFraudLevel());
            System.out.println("话术漏洞: " + response.getChatAnalysis().getRedFlags());
            System.out.println("建议: " + response.getChatAnalysis().getSuggestions());
        }
        
        System.out.println("\n--- 综合推荐 ---");
        System.out.println("最终分数: " + response.getRecommendation().getFinalScore());
        System.out.println("推荐等级: " + response.getRecommendation().getFinalGrade());
        System.out.println("关键发现: " + response.getRecommendation().getKeyFindings());
        System.out.println("行动建议: " + response.getRecommendation().getActionAdvice());
        System.out.println("最终 verdict: " + response.getRecommendation().getVerdict());
        
        System.out.println("\n========== 测试完成 ==========");
    }
    
    /** 
     * 测试2：测试分析聊天记录功能 
     */
    @Test
    public void testAnalyzeChat() {
        System.out.println("========== 测试分析聊天记录 ==========");
        
        AnalyzeChatRequest request = new AnalyzeChatRequest();
        request.setHouseId("12345");
        request.setChatHistory(Arrays.asList(
            new ChatMessage("user", "这套房子还在吗？"),
            new ChatMessage("agent", "在的，昨天刚空出来，好多人抢，先付定金吧"),
            new ChatMessage("user", "能先看房吗？"),
            new ChatMessage("agent", "看房要先交200意向金，不然房东不给看")
        ));
        
        AnalyzeChatResponse response = aiService.analyzeChat(request);
        
        System.out.println("欺诈分: " + response.getFraudScore());
        System.out.println("风险等级: " + response.getFraudLevel());
        System.out.println("话术漏洞: " + response.getRedFlags());
        System.out.println("分析总结: " + response.getSummary());
        System.out.println("建议: " + response.getSuggestions());
        
        System.out.println("========== 测试完成 ==========");
    }
    
    /** 
     * 测试3：测试AI对话 
     */
    @Test
    public void testChat() {
        System.out.println("========== 测试AI对话 ==========");
        
        ChatRequest request = new ChatRequest();
        request.setHouseId("12345");
        request.setMessage("怎么判断是不是串串房？");
        request.setUserId(1L);
        
        ChatResponse response = aiService.chat(request);
        
        System.out.println("AI回复: " + response.getReply());
        
        System.out.println("========== 测试完成 ==========");
    }
}