package com.aiagent.dto;

import lombok.Data;
import java.util.List;

@Data
public class AnalyzeChatResponse {
    private Double fraudScore;
    private String fraudLevel;      // high/medium/low
    private List<String> redFlags;
    private List<String> suspiciousPatterns;
    private String summary;
    private List<String> suggestions;
    private List<String> questionsToAsk;
}