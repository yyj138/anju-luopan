package com.aiagent.dto;

import lombok.Data;
import java.util.List;

@Data
public class ComprehensiveRecommendation {
    private Double finalScore;
    private String finalGrade;          // 强烈推荐/推荐/谨慎考虑/不推荐
    private String finalSummary;
    private List<String> keyFindings;
    private List<String> actionAdvice;
    private String verdict;
}