package com.aiagent.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private String houseId;
    private String message;
    private Long userId;
    private String sessionId;
}