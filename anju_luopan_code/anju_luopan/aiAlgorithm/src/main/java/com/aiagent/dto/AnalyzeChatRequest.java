package com.aiagent.dto;

import lombok.Data;
import java.util.List;

@Data
public class AnalyzeChatRequest {
    private String houseId;
    private List<ChatMessage> chatHistory;
}